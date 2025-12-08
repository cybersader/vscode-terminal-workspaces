import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { TaskItem, TerminalTaskItem, TaskFolder, Profile, TmuxMode, BUILTIN_PROFILES } from './types';
import { TmuxManager, TmuxSession } from './tmuxManager';

// Special marker types for tree items
export interface TmuxSessionsHeader {
    type: 'tmuxSessionsHeader';
}

export interface TmuxSessionData {
    type: 'tmuxSession';
    session: TmuxSession;
}

export type TreeItemData = TaskItem | TmuxSessionsHeader | TmuxSessionData;

export class TerminalTasksProvider implements vscode.TreeDataProvider<TaskTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined | null | void> = new vscode.EventEmitter<TaskTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private cachedUntrackedSessions: TmuxSession[] = [];

    constructor(private configManager: ConfigManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Refresh tmux sessions specifically
     */
    refreshTmuxSessions(): void {
        this.cachedUntrackedSessions = []; // Clear cache to force refresh
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TaskTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
        const config = await this.configManager.getConfig();

        if (!element) {
            // Root level
            const items: TaskTreeItem[] = [];

            // Check for untracked tmux sessions
            const untrackedSessions = this.getUntrackedSessions();
            if (untrackedSessions.length > 0) {
                items.push(this.createTmuxSessionsHeader(untrackedSessions.length));
            }

            // Regular tasks
            if (config.items.length === 0 && untrackedSessions.length === 0) {
                return [this.createPlaceholderItem()];
            }

            items.push(...this.itemsToTreeItems(config.items));
            return items;
        }

        // Children of tmux sessions header
        if (element.itemData && 'type' in element.itemData && element.itemData.type === 'tmuxSessionsHeader') {
            return this.getUntrackedSessions().map(session => this.createTmuxSessionItem(session));
        }

        // Children of a folder
        if (element.itemData?.type === 'folder') {
            const folder = element.itemData as TaskFolder;
            return this.itemsToTreeItems(folder.children);
        }

        return [];
    }

    /**
     * Get untracked tmux sessions (sessions not mapped to tasks)
     */
    getUntrackedSessions(): TmuxSession[] {
        // Get all task names that might be tmux sessions
        const flatTasks = this.configManager.flattenTasks();
        const trackedNames: string[] = [];

        for (const ft of flatTasks) {
            // Check if task uses tmux
            const profile = this.configManager.getProfile(ft.task.profileId || 'wsl-default');
            if (profile?.tmux?.enabled === true || ft.task.overrides?.tmux?.enabled === true) {
                // Use custom session name if set, otherwise task name
                const sessionName = ft.task.overrides?.tmux?.sessionName || ft.task.name;
                trackedNames.push(sessionName);
            }
        }

        return TmuxManager.getUntrackedSessions(trackedNames);
    }

    getParent(element: TaskTreeItem): vscode.ProviderResult<TaskTreeItem> {
        // Not implementing for now - needed for reveal() functionality
        return null;
    }

    private itemsToTreeItems(items: TaskItem[]): TaskTreeItem[] {
        return items.map(item => {
            if (item.type === 'folder') {
                return this.createFolderItem(item);
            } else {
                return this.createTaskItem(item);
            }
        });
    }

    private createFolderItem(folder: TaskFolder): TaskTreeItem {
        const item = new TaskTreeItem(
            folder.name,
            folder.expanded !== false
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.Collapsed,
            folder
        );

        item.iconPath = new vscode.ThemeIcon('folder');
        // Use different context values for empty vs non-empty folders
        // This allows us to hide "Run All" on empty folders
        const hasChildren = folder.children.length > 0;
        item.contextValue = hasChildren ? 'taskFolderWithChildren' : 'taskFolderEmpty';
        item.tooltip = `Folder: ${folder.name}\n${folder.children.length} item(s)`;

        if (folder.tags?.length) {
            item.description = folder.tags.join(', ');
        }

        return item;
    }

    private createTaskItem(task: TerminalTaskItem): TaskTreeItem {
        const item = new TaskTreeItem(
            task.name,
            vscode.TreeItemCollapsibleState.None,
            task
        );

        // Get the profile for this task
        const profile = this.configManager.getProfile(task.profileId || 'wsl-default');
        const iconName = profile?.icon || task.overrides?.icon || 'terminal';

        item.iconPath = new vscode.ThemeIcon(iconName);
        item.contextValue = 'terminalTask';
        item.description = this.shortenPath(task.path);
        item.tooltip = this.buildTaskTooltip(task, profile);

        // Double-click to run
        item.command = {
            command: 'terminalWorkspaces.runTaskById',
            title: 'Run Terminal',
            arguments: [task.id]
        };

        return item;
    }

    private createPlaceholderItem(): TaskTreeItem {
        const item = new TaskTreeItem(
            'No terminal tasks configured',
            vscode.TreeItemCollapsibleState.None
        );

        item.iconPath = new vscode.ThemeIcon('info');
        item.contextValue = 'placeholder';
        item.command = {
            command: 'terminalWorkspaces.addCurrentFileFolder',
            title: 'Add First Task'
        };

        return item;
    }

    private createTmuxSessionsHeader(count: number): TaskTreeItem {
        const item = new TaskTreeItem(
            `Untracked Sessions (${count})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            { type: 'tmuxSessionsHeader' } as TmuxSessionsHeader
        );

        item.iconPath = new vscode.ThemeIcon('broadcast');
        item.contextValue = 'tmuxSessionsHeader';
        item.tooltip = `${count} tmux session(s) not linked to tasks.\nClick to expand, then import sessions as tasks.`;
        item.description = 'tmux';

        return item;
    }

    private createTmuxSessionItem(session: TmuxSession): TaskTreeItem {
        const item = new TaskTreeItem(
            session.name,
            vscode.TreeItemCollapsibleState.None,
            { type: 'tmuxSession', session } as TmuxSessionData
        );

        item.iconPath = new vscode.ThemeIcon(session.attached ? 'broadcast' : 'circle-outline');
        item.contextValue = 'tmuxSession';
        item.description = TmuxManager.normalizePathForDisplay(session.path);
        item.tooltip = [
            `Session: ${session.name}`,
            `Path: ${session.path}`,
            `Windows: ${session.windowCount}`,
            `Status: ${session.attached ? 'Attached' : 'Detached'}`,
            `Created: ${session.created.toLocaleString()}`,
            '',
            'Right-click to attach or import as task'
        ].join('\n');

        // Only attach on click if setting is enabled
        const clickToAttach = vscode.workspace.getConfiguration('terminalWorkspaces').get<boolean>('tmuxClickToAttach', false);
        if (clickToAttach) {
            item.command = {
                command: 'terminalWorkspaces.attachTmuxSession',
                title: 'Attach to Session',
                arguments: [session]
            };
        }

        return item;
    }

    private shortenPath(fullPath: string): string {
        // Show last 2-3 components
        const parts = fullPath.replace(/\\/g, '/').split('/').filter(p => p);
        if (parts.length <= 3) {
            return fullPath;
        }
        return '.../' + parts.slice(-2).join('/');
    }

    private buildTaskTooltip(task: TerminalTaskItem, profile?: Profile): string {
        const lines: string[] = [
            `Task: ${task.name}`,
            `Path: ${task.path}`
        ];

        if (profile) {
            lines.push(`Profile: ${profile.name}`);
            if (profile.tmux?.enabled) {
                lines.push(`tmux: ${profile.tmux.mode}`);
            }
        }

        if (task.tags?.length) {
            lines.push(`Tags: ${task.tags.join(', ')}`);
        }

        return lines.join('\n');
    }
}

export class TaskTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemData?: TreeItemData
    ) {
        super(label, collapsibleState);
    }
}

// ============================================================================
// PROFILE PICKER PROVIDER
// ============================================================================

export class ProfileQuickPick {
    static async show(configManager: ConfigManager, currentProfileId?: string): Promise<Profile | undefined> {
        const profiles = configManager.getAllProfiles();

        const items: (vscode.QuickPickItem & { profile: Profile })[] = profiles.map(profile => ({
            label: profile.name,
            description: profile.description,
            detail: profile.builtin ? 'Built-in' : 'Custom',
            picked: profile.id === currentProfileId,
            profile
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a terminal profile',
            matchOnDescription: true
        });

        return selected?.profile;
    }
}

// ============================================================================
// FOLDER PICKER PROVIDER
// ============================================================================

export class FolderQuickPick {
    static async show(configManager: ConfigManager, excludeId?: string): Promise<{ id: string; path: string } | null | undefined> {
        const folders = configManager.getFolderPaths();

        // Filter out the item being moved (can't move into itself)
        const filteredFolders = excludeId
            ? folders.filter(f => f.id !== excludeId)
            : folders;

        const items: vscode.QuickPickItem[] = [
            { label: '$(home) Root', description: 'Move to root level' },
            { label: '', kind: vscode.QuickPickItemKind.Separator },
            ...filteredFolders.map(f => ({
                label: `$(folder) ${f.path}`,
                description: '',
                detail: f.id
            }))
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select destination folder'
        });

        if (!selected) {
            return undefined;
        }

        if (selected.label === '$(home) Root') {
            return null; // Move to root
        }

        const folder = filteredFolders.find(f => f.id === selected.detail);
        return folder;
    }
}

// ============================================================================
// TASK CONFIGURATION DIALOG
// ============================================================================

export interface TaskConfigResult {
    name: string;
    path: string;
    profileId: string;
    tags?: string[];
    overrides?: {
        tmux?: {
            enabled?: boolean;
            mode?: TmuxMode;
            sessionName?: string;
        };
        icon?: string;
        colors?: {
            background?: string;
        };
        env?: Record<string, string>;
        postCommands?: string[];
    };
}

export class TaskConfigDialog {
    static async showCreate(
        configManager: ConfigManager,
        defaultPath: string,
        defaultName: string
    ): Promise<TaskConfigResult | undefined> {
        // Step 1: Name
        const name = await vscode.window.showInputBox({
            prompt: 'Enter a name for this terminal task',
            value: defaultName,
            validateInput: value => value.trim() ? null : 'Name cannot be empty'
        });

        if (!name) {
            return undefined;
        }

        // Step 2: Profile selection
        const config = await configManager.getConfig();
        const profile = await ProfileQuickPick.show(configManager, config.defaultProfileId);

        if (!profile) {
            return undefined;
        }

        // Step 3: Optional - tmux session name (if tmux enabled)
        let tmuxSessionName: string | undefined;
        if (profile.tmux?.enabled) {
            const customSession = await vscode.window.showInputBox({
                prompt: 'tmux session name (leave empty to use task name, ESC to cancel)',
                placeHolder: name.replace(/[^a-zA-Z0-9_-]/g, '_')
            });
            // undefined means ESC was pressed - cancel the whole wizard
            if (customSession === undefined) {
                return undefined;
            }
            tmuxSessionName = customSession || undefined;
        }

        // Step 4: Optional - tags
        const tagsInput = await vscode.window.showInputBox({
            prompt: 'Tags (comma-separated, optional - press Enter to skip, ESC to cancel)',
            placeHolder: 'work, frontend, important'
        });

        // undefined means ESC was pressed - cancel the whole wizard
        if (tagsInput === undefined) {
            return undefined;
        }

        const tags = tagsInput
            ? tagsInput.split(',').map(t => t.trim()).filter(t => t)
            : undefined;

        return {
            name,
            path: defaultPath,
            profileId: profile.id,
            tags,
            overrides: tmuxSessionName ? {
                tmux: {
                    sessionName: tmuxSessionName
                }
            } : undefined
        };
    }

    static async showEdit(
        configManager: ConfigManager,
        task: TerminalTaskItem
    ): Promise<Partial<TaskConfigResult> | undefined> {
        const actions = await vscode.window.showQuickPick([
            { label: '$(edit) Rename', action: 'rename' },
            { label: '$(folder-opened) Change folder', action: 'path' },
            { label: '$(symbol-misc) Change profile', action: 'profile' },
            { label: '$(tag) Edit tags', action: 'tags' },
            { label: '$(settings-gear) Advanced settings', action: 'advanced' }
        ], {
            placeHolder: `Edit "${task.name}"`
        });

        if (!actions) {
            return undefined;
        }

        switch (actions.action) {
            case 'rename': {
                const name = await vscode.window.showInputBox({
                    prompt: 'Enter new name',
                    value: task.name,
                    validateInput: value => value.trim() ? null : 'Name cannot be empty'
                });
                return name ? { name } : undefined;
            }

            case 'path': {
                const folderUri = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri: vscode.Uri.file(task.path),
                    openLabel: 'Select Folder'
                });
                return folderUri?.[0] ? { path: folderUri[0].fsPath } : undefined;
            }

            case 'profile': {
                const profile = await ProfileQuickPick.show(configManager, task.profileId);
                return profile ? { profileId: profile.id } : undefined;
            }

            case 'tags': {
                const tagsInput = await vscode.window.showInputBox({
                    prompt: 'Tags (comma-separated)',
                    value: task.tags?.join(', ') || ''
                });
                if (tagsInput === undefined) {
                    return undefined;
                }
                const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
                return { tags: tags.length > 0 ? tags : undefined };
            }

            case 'advanced': {
                return this.showAdvancedSettings(configManager, task);
            }

            default:
                return undefined;
        }
    }

    private static async showAdvancedSettings(
        configManager: ConfigManager,
        task: TerminalTaskItem
    ): Promise<Partial<TaskConfigResult> | undefined> {
        const profile = configManager.getProfile(task.profileId || 'wsl-default');

        const options = await vscode.window.showQuickPick([
            {
                label: '$(terminal) tmux settings',
                description: profile?.tmux?.enabled ? 'Enabled' : 'Disabled',
                action: 'tmux'
            },
            {
                label: '$(symbol-color) Terminal color',
                description: task.overrides?.colors?.background || 'Default',
                action: 'color'
            },
            {
                label: '$(play) Startup commands',
                description: task.overrides?.postCommands?.length ? `${task.overrides.postCommands.length} commands` : 'None',
                action: 'commands'
            },
            {
                label: '$(symbol-variable) Environment variables',
                description: task.overrides?.env ? `${Object.keys(task.overrides.env).length} vars` : 'None',
                action: 'env'
            }
        ], {
            placeHolder: 'Advanced settings'
        });

        if (!options) {
            return undefined;
        }

        switch (options.action) {
            case 'tmux': {
                const tmuxMode = await vscode.window.showQuickPick([
                    { label: 'Disabled', mode: 'none' as TmuxMode },
                    { label: 'Attach or Create', description: 'Reattach if session exists, create if not', mode: 'attach-or-create' as TmuxMode },
                    { label: 'Always New', description: 'Always create a new session', mode: 'always-new' as TmuxMode },
                    { label: 'Attach Only', description: 'Only attach, fail if session doesn\'t exist', mode: 'attach-only' as TmuxMode }
                ], {
                    placeHolder: 'tmux mode'
                });

                if (!tmuxMode) {
                    return undefined;
                }

                if (tmuxMode.mode === 'none') {
                    return {
                        overrides: {
                            ...task.overrides,
                            tmux: { enabled: false }
                        }
                    };
                }

                const sessionName = await vscode.window.showInputBox({
                    prompt: 'Session name (leave empty for task name)',
                    value: task.overrides?.tmux?.sessionName || ''
                });

                return {
                    overrides: {
                        ...task.overrides,
                        tmux: {
                            enabled: true,
                            mode: tmuxMode.mode,
                            sessionName: sessionName || undefined
                        }
                    }
                };
            }

            case 'color': {
                const color = await vscode.window.showInputBox({
                    prompt: 'Terminal tab color (hex like #ff0000, or leave empty for default)',
                    value: task.overrides?.colors?.background || '',
                    validateInput: value => {
                        if (!value) return null;
                        if (/^#[0-9A-Fa-f]{6}$/.test(value)) return null;
                        return 'Enter a valid hex color like #ff0000';
                    }
                });

                if (color === undefined) {
                    return undefined;
                }

                return {
                    overrides: {
                        ...task.overrides,
                        colors: color ? { background: color } : undefined
                    }
                };
            }

            case 'commands': {
                const commands = await vscode.window.showInputBox({
                    prompt: 'Commands to run after cd (semicolon-separated)',
                    value: task.overrides?.postCommands?.join('; ') || '',
                    placeHolder: 'npm install; npm run dev'
                });

                if (commands === undefined) {
                    return undefined;
                }

                return {
                    overrides: {
                        ...task.overrides,
                        postCommands: commands
                            ? commands.split(';').map(c => c.trim()).filter(c => c)
                            : undefined
                    }
                };
            }

            case 'env': {
                const envInput = await vscode.window.showInputBox({
                    prompt: 'Environment variables (KEY=value, comma-separated)',
                    value: task.overrides?.env
                        ? Object.entries(task.overrides.env).map(([k, v]) => `${k}=${v}`).join(', ')
                        : '',
                    placeHolder: 'NODE_ENV=development, DEBUG=true'
                });

                if (envInput === undefined) {
                    return undefined;
                }

                const env: Record<string, string> = {};
                if (envInput) {
                    envInput.split(',').forEach(pair => {
                        const [key, ...valueParts] = pair.split('=');
                        if (key && valueParts.length > 0) {
                            env[key.trim()] = valueParts.join('=').trim();
                        }
                    });
                }

                return {
                    overrides: {
                        ...task.overrides,
                        env: Object.keys(env).length > 0 ? env : undefined
                    }
                };
            }

            default:
                return undefined;
        }
    }
}
