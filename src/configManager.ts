import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
    TerminalTasksConfig,
    TaskItem,
    TerminalTaskItem,
    TaskFolder,
    Profile,
    FlattenedTask,
    BUILTIN_PROFILES,
    DEFAULT_CONFIG
} from './types';

export class ConfigManager {
    private config: TerminalTasksConfig | null = null;
    private configPath: string | null = null;

    /**
     * Get the config file path for the current workspace
     */
    private getConfigPath(): string | undefined {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return undefined;
        }
        return path.join(folders[0].uri.fsPath, '.vscode', 'terminal-workspaces.json');
    }

    /**
     * Load configuration from file or create default
     */
    async loadConfig(): Promise<TerminalTasksConfig> {
        const configPath = this.getConfigPath();
        if (!configPath) {
            return { ...DEFAULT_CONFIG };
        }

        this.configPath = configPath;

        // Ensure .vscode directory exists
        const vscodePath = path.dirname(configPath);
        if (!fs.existsSync(vscodePath)) {
            fs.mkdirSync(vscodePath, { recursive: true });
        }

        if (!fs.existsSync(configPath)) {
            this.config = { ...DEFAULT_CONFIG };
            return this.config;
        }

        try {
            const content = fs.readFileSync(configPath, 'utf8');
            this.config = JSON.parse(content);
            return this.config!;
        } catch (error) {
            console.error('Failed to load terminal-workspaces.json:', error);
            this.config = { ...DEFAULT_CONFIG };
            return this.config;
        }
    }

    /**
     * Save configuration to file
     */
    async saveConfig(): Promise<void> {
        if (!this.configPath || !this.config) {
            throw new Error('No configuration loaded');
        }

        const content = JSON.stringify(this.config, null, 2);
        fs.writeFileSync(this.configPath, content, 'utf8');

        // Auto-generate tasks.json if enabled
        if (this.config.settings.autoGenerateTasksJson) {
            await this.generateTasksJson();
        }
    }

    /**
     * Get current config (loads if necessary)
     */
    async getConfig(): Promise<TerminalTasksConfig> {
        if (!this.config) {
            return this.loadConfig();
        }
        return this.config;
    }

    // =========================================================================
    // PROFILE MANAGEMENT
    // =========================================================================

    /**
     * Get all profiles (built-in + user-defined)
     */
    getAllProfiles(): Profile[] {
        return [...BUILTIN_PROFILES, ...(this.config?.profiles || [])];
    }

    /**
     * Get a profile by ID
     */
    getProfile(id: string): Profile | undefined {
        return this.getAllProfiles().find(p => p.id === id);
    }

    /**
     * Add a custom profile
     */
    async addProfile(profile: Profile): Promise<void> {
        const config = await this.getConfig();
        config.profiles.push(profile);
        await this.saveConfig();
    }

    /**
     * Update a custom profile
     */
    async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
        const config = await this.getConfig();
        const index = config.profiles.findIndex(p => p.id === id);
        if (index === -1) {
            throw new Error(`Profile "${id}" not found or is built-in`);
        }
        config.profiles[index] = { ...config.profiles[index], ...updates };
        await this.saveConfig();
    }

    /**
     * Delete a custom profile
     */
    async deleteProfile(id: string): Promise<void> {
        const config = await this.getConfig();
        const index = config.profiles.findIndex(p => p.id === id);
        if (index === -1) {
            throw new Error(`Profile "${id}" not found or is built-in`);
        }
        config.profiles.splice(index, 1);
        await this.saveConfig();
    }

    // =========================================================================
    // TASK ITEM MANAGEMENT
    // =========================================================================

    /**
     * Generate a unique ID
     */
    private generateId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Find an item by ID (recursive)
     */
    findItemById(id: string, items?: TaskItem[]): { item: TaskItem; parent: TaskFolder | null; index: number } | null {
        const searchItems = items || this.config?.items || [];

        for (let i = 0; i < searchItems.length; i++) {
            const item = searchItems[i];
            if (item.id === id) {
                return { item, parent: null, index: i };
            }
            if (item.type === 'folder') {
                const found = this.findItemById(id, item.children);
                if (found) {
                    if (found.parent === null) {
                        found.parent = item;
                    }
                    return found;
                }
            }
        }
        return null;
    }

    /**
     * Add a task to the root or a folder
     */
    async addTask(task: Omit<TerminalTaskItem, 'id' | 'type'>, parentFolderId?: string): Promise<TerminalTaskItem> {
        const config = await this.getConfig();

        const newTask: TerminalTaskItem = {
            ...task,
            id: this.generateId(),
            type: 'task'
        };

        if (parentFolderId) {
            const found = this.findItemById(parentFolderId);
            if (!found || found.item.type !== 'folder') {
                throw new Error(`Folder "${parentFolderId}" not found`);
            }
            (found.item as TaskFolder).children.push(newTask);
        } else {
            config.items.push(newTask);
        }

        await this.saveConfig();
        return newTask;
    }

    /**
     * Add a folder to the root or another folder
     */
    async addFolder(name: string, parentFolderId?: string): Promise<TaskFolder> {
        const config = await this.getConfig();

        const newFolder: TaskFolder = {
            id: this.generateId(),
            type: 'folder',
            name,
            children: [],
            expanded: true
        };

        if (parentFolderId) {
            const found = this.findItemById(parentFolderId);
            if (!found || found.item.type !== 'folder') {
                throw new Error(`Folder "${parentFolderId}" not found`);
            }
            (found.item as TaskFolder).children.push(newFolder);
        } else {
            config.items.push(newFolder);
        }

        await this.saveConfig();
        return newFolder;
    }

    /**
     * Update a task
     */
    async updateTask(id: string, updates: Partial<Omit<TerminalTaskItem, 'id' | 'type'>>): Promise<void> {
        const found = this.findItemById(id);
        if (!found || found.item.type !== 'task') {
            throw new Error(`Task "${id}" not found`);
        }

        Object.assign(found.item, updates);
        await this.saveConfig();
    }

    /**
     * Update a folder
     */
    async updateFolder(id: string, updates: Partial<Omit<TaskFolder, 'id' | 'type' | 'children'>>): Promise<void> {
        const found = this.findItemById(id);
        if (!found || found.item.type !== 'folder') {
            throw new Error(`Folder "${id}" not found`);
        }

        Object.assign(found.item, updates);
        await this.saveConfig();
    }

    /**
     * Delete an item (task or folder)
     */
    async deleteItem(id: string): Promise<void> {
        const config = await this.getConfig();

        const deleteFromArray = (items: TaskItem[]): boolean => {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === id) {
                    items.splice(i, 1);
                    return true;
                }
                if (items[i].type === 'folder') {
                    if (deleteFromArray((items[i] as TaskFolder).children)) {
                        return true;
                    }
                }
            }
            return false;
        };

        if (!deleteFromArray(config.items)) {
            throw new Error(`Item "${id}" not found`);
        }

        await this.saveConfig();
    }

    /**
     * Move an item to a different parent
     */
    async moveItem(id: string, newParentId: string | null): Promise<void> {
        const config = await this.getConfig();
        const found = this.findItemById(id);
        if (!found) {
            throw new Error(`Item "${id}" not found`);
        }

        // Remove from current location
        if (found.parent) {
            found.parent.children.splice(found.index, 1);
        } else {
            config.items.splice(found.index, 1);
        }

        // Add to new location
        if (newParentId) {
            const newParent = this.findItemById(newParentId);
            if (!newParent || newParent.item.type !== 'folder') {
                throw new Error(`Folder "${newParentId}" not found`);
            }
            (newParent.item as TaskFolder).children.push(found.item);
        } else {
            config.items.push(found.item);
        }

        await this.saveConfig();
    }

    // =========================================================================
    // FLATTENING & TRAVERSAL
    // =========================================================================

    /**
     * Get all tasks flattened (for generating tasks.json)
     */
    flattenTasks(items?: TaskItem[], parentPath: string[] = [], parentNames: string[] = []): FlattenedTask[] {
        const searchItems = items || this.config?.items || [];
        const result: FlattenedTask[] = [];

        for (const item of searchItems) {
            if (item.type === 'task') {
                result.push({
                    idPath: [...parentPath, item.id],
                    namePath: [...parentNames, item.name],
                    task: item,
                    depth: parentPath.length
                });
            } else if (item.type === 'folder') {
                result.push(...this.flattenTasks(
                    item.children,
                    [...parentPath, item.id],
                    [...parentNames, item.name]
                ));
            }
        }

        return result;
    }

    /**
     * Get all folder paths (for UI dropdown)
     */
    getFolderPaths(items?: TaskItem[], parentPath: string = ''): { id: string; path: string }[] {
        const searchItems = items || this.config?.items || [];
        const result: { id: string; path: string }[] = [];

        for (const item of searchItems) {
            if (item.type === 'folder') {
                const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
                result.push({ id: item.id, path: currentPath });
                result.push(...this.getFolderPaths(item.children, currentPath));
            }
        }

        return result;
    }

    // =========================================================================
    // TASKS.JSON GENERATION
    // =========================================================================

    /**
     * Generate VS Code tasks.json from our config
     */
    async generateTasksJson(): Promise<void> {
        const config = await this.getConfig();
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            return;
        }

        const tasksJsonPath = path.join(workspaceFolder, '.vscode', 'tasks.json');
        const flatTasks = this.flattenTasks();

        interface VscodeTask {
            label: string;
            type: string;
            command: string;
            options?: {
                shell?: {
                    executable?: string;
                    args?: string[];
                };
                cwd?: string;
            };
            presentation: {
                panel: string;
                name: string;
                reveal?: string;
            };
            isBackground: boolean;
            problemMatcher: string[];
            dependsOn?: string[];
        }

        const tasks: VscodeTask[] = [];

        // Generate individual tasks
        for (const flatTask of flatTasks) {
            const task = flatTask.task;
            const profile = this.getProfile(task.profileId || config.defaultProfileId) || BUILTIN_PROFILES[0];
            const merged = this.mergeProfileWithOverrides(profile, task.overrides);
            const generated = this.generateCommand(task.path, task.name, merged);

            const vscodeTask: VscodeTask = {
                label: task.name,
                type: 'shell',
                command: generated.command,
                presentation: {
                    panel: 'new',
                    name: task.name
                },
                isBackground: true,
                problemMatcher: []
            };

            if (generated.shellOptions) {
                vscodeTask.options = { shell: generated.shellOptions };
            }

            tasks.push(vscodeTask);
        }

        // Generate group task if enabled
        if (config.settings.createGroupTask && tasks.length > 0) {
            tasks.unshift({
                label: config.settings.groupTaskLabel,
                type: 'shell',
                command: 'echo "Opening all terminals..."',
                dependsOn: tasks.map(t => t.label),
                presentation: {
                    panel: 'new',
                    name: config.settings.groupTaskLabel
                },
                isBackground: true,
                problemMatcher: []
            });
        }

        const tasksJson = {
            version: '2.0.0',
            tasks
        };

        fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJson, null, 2), 'utf8');
    }

    /**
     * Merge profile with task-specific overrides
     */
    private mergeProfileWithOverrides(profile: Profile, overrides?: Partial<Profile>): Profile {
        if (!overrides) {
            return profile;
        }
        return {
            ...profile,
            ...overrides,
            tmux: overrides.tmux ? { ...profile.tmux, ...overrides.tmux } : profile.tmux,
            colors: overrides.colors ? { ...profile.colors, ...overrides.colors } : profile.colors,
            env: overrides.env ? { ...profile.env, ...overrides.env } : profile.env
        };
    }

    /**
     * Generate the shell command for a task
     */
    private generateCommand(folderPath: string, taskName: string, profile: Profile): { command: string; shellOptions?: { executable?: string; args?: string[] } } {
        const wslPath = this.toWslPath(folderPath);
        const windowsPath = this.toWindowsPath(folderPath);

        // Sanitize session name for tmux (alphanumeric, underscores, dashes only)
        const sessionName = (profile.tmux?.sessionName || taskName)
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 50);

        let command = '';
        let shellOptions: { executable?: string; args?: string[] } | undefined;

        // Build command based on shell type
        switch (profile.shellType) {
            case 'wsl':
                if (this.isRemoteWSL()) {
                    // Already in WSL, just cd
                    command = this.buildBashCommand(wslPath, sessionName, profile);
                } else {
                    // On Windows, use wsl.exe
                    command = `wsl.exe --cd "${windowsPath}"`;
                    if (profile.tmux?.enabled) {
                        command = `wsl.exe -e bash -c "cd '${wslPath}' && ${this.buildTmuxCommand(sessionName, profile)}"`;
                    }
                    shellOptions = { executable: 'cmd.exe', args: ['/C'] };
                }
                break;

            case 'wsl-bash':
                command = `wsl.exe -e bash -c "${this.buildBashCommand(wslPath, sessionName, profile).replace(/"/g, '\\"')}"`;
                shellOptions = { executable: 'cmd.exe', args: ['/C'] };
                break;

            case 'powershell':
                command = `Set-Location '${windowsPath}'`;
                if (profile.postCommands?.length) {
                    command += '; ' + profile.postCommands.join('; ');
                }
                shellOptions = { executable: 'powershell.exe' };
                break;

            case 'cmd':
                command = `cd /d "${windowsPath}"`;
                if (profile.postCommands?.length) {
                    command += ' && ' + profile.postCommands.join(' && ');
                }
                shellOptions = { executable: 'cmd.exe', args: ['/K'] };
                break;

            case 'bash':
            case 'zsh':
                command = this.buildBashCommand(folderPath, sessionName, profile);
                break;

            case 'default':
                // Use VS Code's default - minimal command
                command = `cd '${this.isWindows() ? windowsPath : folderPath}'`;
                break;

            case 'custom':
                if (profile.customShell) {
                    command = this.buildBashCommand(folderPath, sessionName, profile);
                    shellOptions = {
                        executable: profile.customShell,
                        args: profile.customShellArgs
                    };
                }
                break;
        }

        return { command, shellOptions };
    }

    /**
     * Build bash/zsh command with optional tmux
     */
    private buildBashCommand(folderPath: string, sessionName: string, profile: Profile): string {
        const parts: string[] = [];

        // Pre-commands
        if (profile.preCommands?.length) {
            parts.push(...profile.preCommands);
        }

        // CD to directory
        parts.push(`cd '${folderPath}'`);

        // Post-commands
        if (profile.postCommands?.length) {
            parts.push(...profile.postCommands);
        }

        // Tmux - check enabled explicitly (could be undefined)
        if (profile.tmux?.enabled === true) {
            parts.push(this.buildTmuxCommand(sessionName, profile));
        } else {
            // Keep shell open
            const shell = profile.shellType === 'zsh' ? 'zsh' : 'bash';
            parts.push(`exec ${shell}`);
        }

        return parts.join(' && ');
    }

    /**
     * Build tmux command based on mode
     */
    private buildTmuxCommand(sessionName: string, profile: Profile): string {
        if (!profile.tmux) {
            return 'exec bash';
        }

        // Default to 'attach-or-create' if mode not specified
        const mode = profile.tmux.mode || 'attach-or-create';

        switch (mode) {
            case 'attach-or-create':
                // This matches your t() function: attach if exists, create if not
                return `tmux new-session -A -s '${sessionName}'`;

            case 'always-new':
                return `tmux new-session -s '${sessionName}'`;

            case 'attach-only':
                return `tmux attach-session -t '${sessionName}' || echo 'Session ${sessionName} not found'`;

            case 'custom':
                return profile.tmux.customCommand || 'tmux';

            default:
                return `tmux new-session -A -s '${sessionName}'`;
        }
    }

    // =========================================================================
    // PATH UTILITIES
    // =========================================================================

    private isRemoteWSL(): boolean {
        return vscode.env.remoteName === 'wsl';
    }

    private isWindows(): boolean {
        if (this.isRemoteWSL()) {
            return false;
        }
        return process.platform === 'win32';
    }

    private toWslPath(inputPath: string): string {
        if (inputPath.startsWith('/')) {
            return inputPath;
        }
        const driveMatch = inputPath.match(/^([A-Za-z]):\\?(.*)/);
        if (driveMatch) {
            const drive = driveMatch[1].toLowerCase();
            const subPath = driveMatch[2]?.replace(/\\/g, '/') || '';
            return `/mnt/${drive}/${subPath}`;
        }
        return inputPath.replace(/\\/g, '/');
    }

    private toWindowsPath(inputPath: string): string {
        if (/^[A-Za-z]:/.test(inputPath) || inputPath.startsWith('\\\\')) {
            return inputPath;
        }
        const mntMatch = inputPath.match(/^\/mnt\/([a-z])\/?(.*)/i);
        if (mntMatch) {
            const drive = mntMatch[1].toUpperCase();
            const subPath = mntMatch[2]?.replace(/\//g, '\\') || '';
            return `${drive}:\\${subPath}`;
        }
        return inputPath.replace(/\//g, '\\');
    }
}
