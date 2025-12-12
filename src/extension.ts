import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigManager } from './configManager';
import { TerminalTasksProvider, TaskTreeItem, TaskConfigDialog, FolderQuickPick, TmuxSessionData } from './terminalWorkspacesProvider';
import { TerminalTaskItem, TaskFolder } from './types';
import { TmuxManager, TmuxSession } from './tmuxManager';

let treeDataProvider: TerminalTasksProvider;
let configManager: ConfigManager;

/**
 * Check if a path exists (works with both Windows and WSL paths)
 */
async function pathExists(taskPath: string): Promise<boolean> {
    try {
        // Handle WSL paths when running on Windows
        if (process.platform === 'win32' && taskPath.startsWith('/mnt/')) {
            // Convert /mnt/c/... to C:\...
            const match = taskPath.match(/^\/mnt\/([a-z])\/(.*)/i);
            if (match) {
                const windowsPath = `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, '\\')}`;
                await fs.promises.access(windowsPath);
                return true;
            }
        }
        await fs.promises.access(taskPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate task path and prompt user if invalid (when experimental setting is enabled)
 * Returns the task to run (possibly with updated path), or undefined to cancel
 */
async function validateTaskPath(task: TerminalTaskItem): Promise<TerminalTaskItem | undefined> {
    const config = vscode.workspace.getConfiguration('terminalWorkspaces');
    const experimentalValidation = config.get<boolean>('experimentalPathValidation', false);

    if (!experimentalValidation) {
        return task; // Skip validation
    }

    const exists = await pathExists(task.path);
    if (exists) {
        return task;
    }

    // Path doesn't exist - prompt user
    const action = await vscode.window.showWarningMessage(
        `Path not found: ${task.path}`,
        { modal: false },
        'Browse for New Path',
        'Run Anyway',
        'Cancel'
    );

    if (action === 'Cancel' || !action) {
        return undefined;
    }

    if (action === 'Run Anyway') {
        return task;
    }

    if (action === 'Browse for New Path') {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select New Folder for Task'
        });

        if (!folderUri || !folderUri[0]) {
            return undefined;
        }

        const newPath = folderUri[0].fsPath;

        // Ask if they want to save this change
        const save = await vscode.window.showQuickPick(
            [
                { label: 'Yes, update the task', description: 'Save this path for future use', save: true },
                { label: 'No, just run once', description: 'Use this path only for this run', save: false }
            ],
            { placeHolder: 'Save this new path to the task?' }
        );

        if (!save) {
            return undefined;
        }

        if (save.save) {
            // Update the task in config
            try {
                await configManager.updateTask(task.id, { path: newPath });
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(`Updated "${task.name}" path to: ${newPath}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to update task: ${error}`);
            }
        }

        // Return task with updated path for this run
        return { ...task, path: newPath };
    }

    return undefined;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Terminal Workspaces is now active');

    configManager = new ConfigManager();
    treeDataProvider = new TerminalTasksProvider(configManager);

    // Initialize config
    configManager.loadConfig();

    // Create and register the tree view
    const treeView = vscode.window.createTreeView('terminalWorkspacesView', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true,
        canSelectMany: false
    });

    // Listen for terminal open/close events to update active status indicators
    const terminalOpenListener = vscode.window.onDidOpenTerminal(() => {
        treeDataProvider.refresh();
    });
    const terminalCloseListener = vscode.window.onDidCloseTerminal(() => {
        treeDataProvider.refresh();
    });
    context.subscriptions.push(terminalOpenListener, terminalCloseListener);

    // =========================================================================
    // REFRESH
    // =========================================================================

    const refreshCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.refresh',
        async () => {
            await configManager.loadConfig();
            treeDataProvider.refresh();
        }
    );

    // =========================================================================
    // ADD TASK - From Explorer Context Menu
    // =========================================================================

    const addFolderCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.addFolderToTasks',
        async (uri: vscode.Uri) => {
            if (!uri) {
                vscode.window.showErrorMessage('No folder selected');
                return;
            }

            const folderPath = uri.fsPath;
            const folderName = path.basename(folderPath);

            const result = await TaskConfigDialog.showCreate(configManager, folderPath, folderName);
            if (!result) {
                return;
            }

            try {
                await configManager.addTask({
                    name: result.name,
                    path: result.path,
                    profileId: result.profileId,
                    tags: result.tags,
                    overrides: result.overrides as any
                });
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(`Added "${result.name}" to terminal tasks`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add task: ${error}`);
            }
        }
    );

    // =========================================================================
    // ADD TASK - Smart Add with Options
    // =========================================================================

    const addCurrentFileFolderCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.addCurrentFileFolder',
        async () => {
            // Build options based on what's available
            const options: (vscode.QuickPickItem & { action: string; path?: string })[] = [];

            const activeEditor = vscode.window.activeTextEditor;
            const workspaceFolders = vscode.workspace.workspaceFolders;

            // Option 1: Current file's parent folder
            if (activeEditor && !activeEditor.document.isUntitled) {
                const filePath = activeEditor.document.uri.fsPath;
                const folderPath = path.dirname(filePath);
                const folderName = path.basename(folderPath);
                options.push({
                    label: `$(file) Current File's Folder`,
                    description: folderName,
                    detail: folderPath,
                    action: 'file',
                    path: folderPath
                });
            }

            // Option 2: Workspace folder(s)
            if (workspaceFolders) {
                for (const wsFolder of workspaceFolders) {
                    options.push({
                        label: `$(root-folder) Workspace: ${wsFolder.name}`,
                        description: '',
                        detail: wsFolder.uri.fsPath,
                        action: 'workspace',
                        path: wsFolder.uri.fsPath
                    });
                }
            }

            // Option 3: Browse
            options.push({
                label: '$(folder-opened) Browse for Folder...',
                description: 'Choose any folder',
                action: 'browse'
            });

            // If only browse is available, go straight to browse
            if (options.length === 1) {
                await vscode.commands.executeCommand('terminalWorkspaces.addBrowseFolder');
                return;
            }

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: 'Select folder to add as terminal task',
                matchOnDetail: true
            });

            if (!selected) {
                return;
            }

            let folderPath: string;
            let folderName: string;

            if (selected.action === 'browse') {
                await vscode.commands.executeCommand('terminalWorkspaces.addBrowseFolder');
                return;
            } else {
                folderPath = selected.path!;
                folderName = path.basename(folderPath);
            }

            const result = await TaskConfigDialog.showCreate(configManager, folderPath, folderName);
            if (!result) {
                return;
            }

            try {
                await configManager.addTask({
                    name: result.name,
                    path: result.path,
                    profileId: result.profileId,
                    tags: result.tags,
                    overrides: result.overrides as any
                });
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(`Added "${result.name}" to terminal tasks`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add task: ${error}`);
            }
        }
    );

    // =========================================================================
    // ADD TASK - File's Parent Folder (from explorer context menu on files)
    // =========================================================================

    const addFileParentFolderCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.addFileParentFolder',
        async (uri: vscode.Uri) => {
            if (!uri) {
                // Fallback to active editor
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor || activeEditor.document.isUntitled) {
                    vscode.window.showErrorMessage('No file selected');
                    return;
                }
                uri = activeEditor.document.uri;
            }

            const folderPath = path.dirname(uri.fsPath);
            const folderName = path.basename(folderPath);

            const result = await TaskConfigDialog.showCreate(configManager, folderPath, folderName);
            if (!result) {
                return;
            }

            try {
                await configManager.addTask({
                    name: result.name,
                    path: result.path,
                    profileId: result.profileId,
                    tags: result.tags,
                    overrides: result.overrides as any
                });
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(`Added "${result.name}" to terminal tasks`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add task: ${error}`);
            }
        }
    );

    // =========================================================================
    // ADD TASK - From Terminal (context menu)
    // =========================================================================

    const addFromTerminalCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.addFromTerminal',
        async () => {
            // VS Code doesn't expose terminal CWD directly, so we'll prompt user
            // to choose from available options or browse
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const options: (vscode.QuickPickItem & { action: string; path?: string })[] = [];

            // Add workspace folders as options
            if (workspaceFolders) {
                for (const wsFolder of workspaceFolders) {
                    options.push({
                        label: `$(root-folder) ${wsFolder.name}`,
                        description: 'Workspace folder',
                        detail: wsFolder.uri.fsPath,
                        action: 'workspace',
                        path: wsFolder.uri.fsPath
                    });
                }
            }

            // Add browse option
            options.push({
                label: '$(folder-opened) Browse for Folder...',
                description: 'Choose the folder for this terminal task',
                action: 'browse'
            });

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: 'Select or browse for the folder to add as a terminal task',
                matchOnDetail: true
            });

            if (!selected) {
                return;
            }

            if (selected.action === 'browse') {
                await vscode.commands.executeCommand('terminalWorkspaces.addBrowseFolder');
                return;
            }

            const folderPath = selected.path!;
            const folderName = path.basename(folderPath);

            const result = await TaskConfigDialog.showCreate(configManager, folderPath, folderName);
            if (!result) {
                return;
            }

            try {
                await configManager.addTask({
                    name: result.name,
                    path: result.path,
                    profileId: result.profileId,
                    tags: result.tags,
                    overrides: result.overrides as any
                });
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(`Added "${result.name}" to terminal tasks`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add task: ${error}`);
            }
        }
    );

    // =========================================================================
    // ADD TASK - Browse for Folder
    // =========================================================================

    const addBrowseFolderCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.addBrowseFolder',
        async () => {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Folder for Terminal Task'
            });

            if (!folderUri || !folderUri[0]) {
                return;
            }

            const folderPath = folderUri[0].fsPath;
            const folderName = path.basename(folderPath);

            const result = await TaskConfigDialog.showCreate(configManager, folderPath, folderName);
            if (!result) {
                return;
            }

            try {
                await configManager.addTask({
                    name: result.name,
                    path: result.path,
                    profileId: result.profileId,
                    tags: result.tags,
                    overrides: result.overrides as any
                });
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(`Added "${result.name}" to terminal tasks`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add task: ${error}`);
            }
        }
    );

    // =========================================================================
    // ADD FOLDER (for organizing tasks)
    // =========================================================================

    const addTaskFolderCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.addTaskFolder',
        async (item?: TaskTreeItem) => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter folder name',
                validateInput: value => value.trim() ? null : 'Name cannot be empty'
            });

            if (!name) {
                return;
            }

            try {
                const parentId = item?.itemData?.type === 'folder' ? item.itemData.id : undefined;
                await configManager.addFolder(name, parentId);
                treeDataProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create folder: ${error}`);
            }
        }
    );

    // =========================================================================
    // RUN TASK
    // =========================================================================

    // Helper to run a task, respecting terminal location setting
    const runTaskDirectly = async (task: TerminalTaskItem) => {
        const terminalLocation = vscode.workspace.getConfiguration('terminalWorkspaces').get<string>('terminalLocation', 'panel');

        if (terminalLocation === 'editor') {
            // Create terminal directly in editor area
            // Don't set shellPath/shellArgs - use default shell and send command via sendText
            // This prevents the shell from exiting immediately (which happens with cmd.exe /C)
            const generated = configManager.generateTaskCommand(task);

            const terminal = vscode.window.createTerminal({
                name: task.name,
                location: vscode.TerminalLocation.Editor
            });
            terminal.show();

            // Build the full command including shell wrapper if needed
            let fullCommand = generated.command;
            if (generated.shellOptions?.executable) {
                const shell = generated.shellOptions.executable;
                const args = generated.shellOptions.args?.join(' ') || '';

                if (shell.toLowerCase().includes('cmd.exe')) {
                    // For cmd.exe, use /K instead of /C to keep the shell open
                    // But actually, we should just send the WSL command directly
                    // since the default VS Code terminal on Windows can run wsl.exe
                    // The command already includes wsl.exe when needed
                } else if (shell.toLowerCase().includes('powershell')) {
                    // PowerShell commands can be sent directly
                }
            }

            terminal.sendText(fullCommand);
        } else {
            // Use VS Code task system for panel
            await vscode.commands.executeCommand('workbench.action.tasks.runTask', task.name);
        }
    };

    const runTaskByIdCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.runTaskById',
        async (taskId: string) => {
            const found = configManager.findItemById(taskId);
            if (!found || found.item.type !== 'task') {
                vscode.window.showErrorMessage('Task not found');
                return;
            }

            const task = found.item as TerminalTaskItem;

            // Validate path if experimental setting is enabled
            const validatedTask = await validateTaskPath(task);
            if (!validatedTask) {
                return; // User cancelled
            }

            // If path was updated, regenerate tasks.json before running
            if (validatedTask.path !== task.path) {
                await configManager.generateTasksJson();
            }

            await runTaskDirectly(validatedTask);
        }
    );

    const runTaskCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.runTask',
        async (item: TaskTreeItem) => {
            if (!item?.itemData) {
                return;
            }

            if (item.itemData.type === 'folder') {
                // Run all tasks in this folder
                const folder = item.itemData as TaskFolder;
                const allTasks = getAllTasks(folder.children);
                for (const task of allTasks) {
                    const validatedTask = await validateTaskPath(task);
                    if (validatedTask) {
                        if (validatedTask.path !== task.path) {
                            await configManager.generateTasksJson();
                        }
                        await runTaskDirectly(validatedTask);
                    }
                }
            } else if (item.itemData.type === 'task') {
                const task = item.itemData as TerminalTaskItem;

                // Validate path if experimental setting is enabled
                const validatedTask = await validateTaskPath(task);
                if (!validatedTask) {
                    return; // User cancelled
                }

                // If path was updated, regenerate tasks.json before running
                if (validatedTask.path !== task.path) {
                    await configManager.generateTasksJson();
                }

                await runTaskDirectly(validatedTask);
            }
        }
    );

    const runAllTasksCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.runAllTasks',
        async () => {
            const terminalLocation = vscode.workspace.getConfiguration('terminalWorkspaces').get<string>('terminalLocation', 'panel');
            const config = await configManager.getConfig();

            if (terminalLocation === 'editor') {
                // Run all tasks directly for editor location
                const allTasks = getAllTasks(config.items);
                for (const task of allTasks) {
                    const validatedTask = await validateTaskPath(task);
                    if (validatedTask) {
                        if (validatedTask.path !== task.path) {
                            await configManager.generateTasksJson();
                        }
                        await runTaskDirectly(validatedTask);
                    }
                }
            } else {
                // Use group task for panel
                await vscode.commands.executeCommand(
                    'workbench.action.tasks.runTask',
                    config.settings.groupTaskLabel
                );
            }
        }
    );

    const runFolderTasksCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.runFolderTasks',
        async (item: TaskTreeItem) => {
            if (!item?.itemData || item.itemData.type !== 'folder') {
                return;
            }

            const folder = item.itemData as TaskFolder;
            const allTasks = getAllTasks(folder.children);

            if (allTasks.length === 0) {
                vscode.window.showInformationMessage('No tasks in this folder');
                return;
            }

            for (const task of allTasks) {
                const validatedTask = await validateTaskPath(task);
                if (validatedTask) {
                    if (validatedTask.path !== task.path) {
                        await configManager.generateTasksJson();
                    }
                    await runTaskDirectly(validatedTask);
                }
            }
        }
    );

    // =========================================================================
    // EDIT TASK
    // =========================================================================

    const editTaskCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.editTask',
        async (item: TaskTreeItem) => {
            if (!item?.itemData || item.itemData.type !== 'task') {
                return;
            }

            const task = item.itemData as TerminalTaskItem;
            const updates = await TaskConfigDialog.showEdit(configManager, task);

            if (!updates) {
                return;
            }

            try {
                await configManager.updateTask(task.id, updates);
                treeDataProvider.refresh();
                vscode.window.showInformationMessage('Task updated');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to update task: ${error}`);
            }
        }
    );

    // =========================================================================
    // RENAME (for both tasks and folders)
    // =========================================================================

    const renameCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.rename',
        async (item: TaskTreeItem) => {
            if (!item?.itemData) {
                return;
            }

            // Only allow renaming tasks and folders
            if (item.itemData.type !== 'task' && item.itemData.type !== 'folder') {
                return;
            }

            const newName = await vscode.window.showInputBox({
                prompt: 'Enter new name',
                value: item.itemData.name,
                validateInput: value => value.trim() ? null : 'Name cannot be empty'
            });

            if (!newName || newName === item.itemData.name) {
                return;
            }

            try {
                if (item.itemData.type === 'task') {
                    await configManager.updateTask(item.itemData.id, { name: newName });
                } else {
                    await configManager.updateFolder(item.itemData.id, { name: newName });
                }
                treeDataProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to rename: ${error}`);
            }
        }
    );

    // =========================================================================
    // DELETE
    // =========================================================================

    const deleteCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.delete',
        async (item: TaskTreeItem) => {
            if (!item?.itemData) {
                return;
            }

            // Only allow deleting tasks and folders
            if (item.itemData.type !== 'task' && item.itemData.type !== 'folder') {
                return;
            }

            const itemType = item.itemData.type === 'folder' ? 'folder' : 'task';
            let message = `Delete "${item.itemData.name}"?`;

            if (item.itemData.type === 'folder') {
                const folder = item.itemData as TaskFolder;
                if (folder.children.length > 0) {
                    message = `Delete folder "${folder.name}" and all ${folder.children.length} item(s) inside?`;
                }
            }

            const confirm = await vscode.window.showWarningMessage(
                message,
                { modal: true },
                'Delete'
            );

            if (confirm !== 'Delete') {
                return;
            }

            try {
                await configManager.deleteItem(item.itemData.id);
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(`Deleted "${item.itemData.name}"`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to delete: ${error}`);
            }
        }
    );

    // =========================================================================
    // MOVE TO FOLDER
    // =========================================================================

    const moveToFolderCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.moveToFolder',
        async (item: TaskTreeItem) => {
            if (!item?.itemData) {
                return;
            }

            // Only allow moving tasks and folders
            if (item.itemData.type !== 'task' && item.itemData.type !== 'folder') {
                return;
            }

            const destination = await FolderQuickPick.show(configManager, item.itemData.id);

            if (destination === undefined) {
                return; // Cancelled
            }

            try {
                await configManager.moveItem(item.itemData.id, destination?.id || null);
                treeDataProvider.refresh();
                vscode.window.showInformationMessage(
                    `Moved "${item.itemData.name}" to ${destination?.path || 'root'}`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to move: ${error}`);
            }
        }
    );

    // =========================================================================
    // OPEN CONFIG FILE
    // =========================================================================

    const openConfigCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.openConfig',
        async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const configPath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'terminal-workspaces.json');

            // Ensure config exists
            await configManager.getConfig();
            await configManager.saveConfig();

            const uri = vscode.Uri.file(configPath);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
        }
    );

    // =========================================================================
    // OPEN TASKS.JSON
    // =========================================================================

    const openTasksJsonCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.openTasksJson',
        async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const tasksJsonPath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'tasks.json');
            const uri = vscode.Uri.file(tasksJsonPath);

            try {
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc);
            } catch {
                vscode.window.showErrorMessage('tasks.json not found. Add a task first.');
            }
        }
    );

    // =========================================================================
    // REGENERATE TASKS.JSON
    // =========================================================================

    const regenerateTasksJsonCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.regenerateTasksJson',
        async () => {
            try {
                await configManager.generateTasksJson();
                vscode.window.showInformationMessage('tasks.json regenerated');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to regenerate: ${error}`);
            }
        }
    );

    // =========================================================================
    // QUICK OPEN (Command Palette manager)
    // =========================================================================

    const openManagerCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.openTasksManager',
        async () => {
            const config = await configManager.getConfig();
            const flatTasks = configManager.flattenTasks();

            if (flatTasks.length === 0) {
                const action = await vscode.window.showInformationMessage(
                    'No terminal tasks configured.',
                    'Add Task',
                    'Browse for Folder'
                );

                if (action === 'Add Task') {
                    vscode.commands.executeCommand('terminalWorkspaces.addCurrentFileFolder');
                } else if (action === 'Browse for Folder') {
                    vscode.commands.executeCommand('terminalWorkspaces.addBrowseFolder');
                }
                return;
            }

            const items: vscode.QuickPickItem[] = [
                { label: '$(add) Add new task...', description: '' },
                { label: '$(folder-opened) Browse for folder...', description: '' },
                { label: '$(new-folder) Create task folder...', description: '' },
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                ...flatTasks.map(ft => ({
                    label: `$(terminal) ${ft.task.name}`,
                    description: ft.namePath.slice(0, -1).join(' / ') || '',
                    detail: ft.task.path
                }))
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a task to run or add a new one',
                matchOnDescription: true,
                matchOnDetail: true
            });

            if (!selected) {
                return;
            }

            if (selected.label === '$(add) Add new task...') {
                vscode.commands.executeCommand('terminalWorkspaces.addCurrentFileFolder');
            } else if (selected.label === '$(folder-opened) Browse for folder...') {
                vscode.commands.executeCommand('terminalWorkspaces.addBrowseFolder');
            } else if (selected.label === '$(new-folder) Create task folder...') {
                vscode.commands.executeCommand('terminalWorkspaces.addTaskFolder');
            } else {
                // Run the selected task
                const taskName = selected.label.replace(/^\$\([^)]+\)\s*/, '');
                await vscode.commands.executeCommand('workbench.action.tasks.runTask', taskName);
            }
        }
    );

    // =========================================================================
    // TMUX SESSION DISCOVERY
    // =========================================================================

    const refreshTmuxSessionsCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.refreshTmuxSessions',
        async () => {
            if (!TmuxManager.isAvailable()) {
                vscode.window.showWarningMessage('tmux is not available in this environment');
                return;
            }
            treeDataProvider.refreshTmuxSessions();
            vscode.window.showInformationMessage('tmux sessions refreshed');
        }
    );

    const importTmuxSessionsCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.importTmuxSessions',
        async () => {
            if (!TmuxManager.isAvailable()) {
                vscode.window.showWarningMessage('tmux is not available in this environment');
                return;
            }

            const sessions = TmuxManager.getSessions();
            if (sessions.length === 0) {
                vscode.window.showInformationMessage('No tmux sessions found');
                return;
            }

            // Get existing task names to mark which are already tracked
            const flatTasks = configManager.flattenTasks();
            const trackedNames = new Set<string>();
            for (const ft of flatTasks) {
                const profile = configManager.getProfile(ft.task.profileId || 'wsl-default');
                if (profile?.tmux?.enabled === true || ft.task.overrides?.tmux?.enabled === true) {
                    const sessionName = ft.task.overrides?.tmux?.sessionName || ft.task.name;
                    trackedNames.add(sessionName.toLowerCase());
                }
            }

            // Build quick pick items
            const items = sessions.map(session => ({
                label: session.name,
                description: TmuxManager.normalizePathForDisplay(session.path),
                detail: trackedNames.has(session.name.toLowerCase())
                    ? '$(check) Already tracked'
                    : `$(circle-outline) ${session.attached ? 'Attached' : 'Detached'} • ${session.windowCount} window(s)`,
                picked: !trackedNames.has(session.name.toLowerCase()),
                session
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select tmux sessions to import as tasks',
                canPickMany: true
            });

            if (!selected || selected.length === 0) {
                return;
            }

            // Filter out already tracked sessions
            const toImport = selected.filter(s => !trackedNames.has(s.session.name.toLowerCase()));

            if (toImport.length === 0) {
                vscode.window.showInformationMessage('All selected sessions are already tracked');
                return;
            }

            // Import selected sessions
            let imported = 0;
            for (const item of toImport) {
                try {
                    await configManager.addTask({
                        name: item.session.name,
                        path: item.session.path,
                        profileId: 'wsl-tmux', // Use WSL+tmux profile
                        overrides: {
                            tmux: {
                                enabled: true,
                                mode: 'attach-or-create',
                                sessionName: item.session.name
                            }
                        }
                    });
                    imported++;
                } catch (error) {
                    console.error(`Failed to import session ${item.session.name}:`, error);
                }
            }

            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Imported ${imported} tmux session(s) as tasks`);
        }
    );

    const attachTmuxSessionCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.attachTmuxSession',
        async (sessionOrItem: TmuxSession | TaskTreeItem) => {
            let session: TmuxSession | undefined;

            // Handle both direct session object and TaskTreeItem
            if (sessionOrItem && 'itemData' in sessionOrItem) {
                // It's a TaskTreeItem from the tree view
                const item = sessionOrItem as TaskTreeItem;
                if (item.itemData?.type === 'tmuxSession') {
                    session = (item.itemData as TmuxSessionData).session;
                }
            } else if (sessionOrItem && 'name' in sessionOrItem && 'path' in sessionOrItem) {
                // It's a direct TmuxSession object
                session = sessionOrItem as TmuxSession;
            }

            if (!session) {
                vscode.window.showErrorMessage('No tmux session selected');
                return;
            }

            // Create terminal - don't set cwd since tmux will handle the working directory
            // The session's path might not exist on the Windows side or could be invalid
            const terminalLocation = vscode.workspace.getConfiguration('terminalWorkspaces').get<string>('terminalLocation', 'panel');
            const terminal = vscode.window.createTerminal({
                name: `tmux: ${session.name}`,
                // Intentionally not setting cwd - tmux attach will restore the session's directory
                location: terminalLocation === 'editor'
                    ? vscode.TerminalLocation.Editor
                    : vscode.TerminalLocation.Panel
            });

            terminal.show();

            // Send the attach command - tmux will restore the session's working directory
            const isRemoteWSL = vscode.env.remoteName === 'wsl';
            if (isRemoteWSL) {
                terminal.sendText(TmuxManager.getAttachCommand(session.name));
            } else {
                // On Windows, need to go through WSL
                terminal.sendText(`wsl.exe -e bash -c "${TmuxManager.getAttachCommand(session.name)}"`);
            }
        }
    );

    const importTmuxSessionCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.importTmuxSession',
        async (item: TaskTreeItem) => {
            if (!item?.itemData || item.itemData.type !== 'tmuxSession') {
                return;
            }

            const sessionData = item.itemData as TmuxSessionData;
            const session = sessionData.session;

            // Ask for task name
            const name = await vscode.window.showInputBox({
                prompt: 'Task name for this session',
                value: session.name,
                validateInput: value => value.trim() ? null : 'Name cannot be empty'
            });

            if (!name) {
                return;
            }

            try {
                await configManager.addTask({
                    name,
                    path: session.path,
                    profileId: 'wsl-tmux',
                    overrides: {
                        tmux: {
                            enabled: true,
                            mode: 'attach-or-create',
                            sessionName: session.name
                        }
                    }
                });

                treeDataProvider.refresh();
                vscode.window.showInformationMessage(`Imported "${session.name}" as task "${name}"`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to import session: ${error}`);
            }
        }
    );

    // =========================================================================
    // SEARCH TASKS
    // =========================================================================

    const searchTasksCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.searchTasks',
        async () => {
            const flatTasks = configManager.flattenTasks();

            if (flatTasks.length === 0) {
                vscode.window.showInformationMessage('No terminal tasks configured yet.');
                return;
            }

            // Build searchable items with tags and path info
            const items: (vscode.QuickPickItem & { taskName: string; tags?: string[] })[] = flatTasks.map(ft => {
                const tagsStr = ft.task.tags?.length ? ` [${ft.task.tags.join(', ')}]` : '';
                const folderPath = ft.namePath.slice(0, -1).join(' / ');
                return {
                    label: `$(terminal) ${ft.task.name}`,
                    description: folderPath || undefined,
                    detail: `${ft.task.path}${tagsStr}`,
                    taskName: ft.task.name,
                    tags: ft.task.tags
                };
            });

            const quickPick = vscode.window.createQuickPick();
            quickPick.items = items;
            quickPick.placeholder = 'Search tasks by name, folder, path, or tags...';
            quickPick.matchOnDescription = true;
            quickPick.matchOnDetail = true;

            quickPick.onDidAccept(() => {
                const selected = quickPick.selectedItems[0] as typeof items[0];
                if (selected) {
                    vscode.commands.executeCommand('workbench.action.tasks.runTask', selected.taskName);
                }
                quickPick.hide();
            });

            quickPick.onDidHide(() => quickPick.dispose());
            quickPick.show();
        }
    );

    // =========================================================================
    // ATTACH ALL TMUX SESSIONS
    // =========================================================================

    const attachAllSessionsCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.attachAllSessions',
        async () => {
            if (!TmuxManager.isAvailable()) {
                vscode.window.showWarningMessage('tmux is not available in this environment');
                return;
            }

            const untrackedSessions = treeDataProvider.getUntrackedSessions();
            if (untrackedSessions.length === 0) {
                vscode.window.showInformationMessage('No untracked tmux sessions to attach');
                return;
            }

            const isRemoteWSL = vscode.env.remoteName === 'wsl';

            const terminalLocation = vscode.workspace.getConfiguration('terminalWorkspaces').get<string>('terminalLocation', 'panel');

            for (const session of untrackedSessions) {
                // Don't set cwd - tmux will restore the session's working directory
                const terminal = vscode.window.createTerminal({
                    name: `tmux: ${session.name}`,
                    location: terminalLocation === 'editor'
                        ? vscode.TerminalLocation.Editor
                        : vscode.TerminalLocation.Panel
                });

                terminal.show(false); // Don't steal focus for subsequent terminals

                if (isRemoteWSL) {
                    terminal.sendText(TmuxManager.getAttachCommand(session.name));
                } else {
                    terminal.sendText(`wsl.exe -e bash -c "${TmuxManager.getAttachCommand(session.name)}"`);
                }
            }

            vscode.window.showInformationMessage(`Attached to ${untrackedSessions.length} tmux session(s)`);
        }
    );

    // =========================================================================
    // REVEAL IN EXPLORER
    // =========================================================================

    const revealInExplorerCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.revealInExplorer',
        async (element: any) => {
            if (!element?.itemData?.path) {
                vscode.window.showErrorMessage('No path available for this item');
                return;
            }

            const taskPath = element.itemData.path;

            // Convert WSL path to Windows path if needed
            let revealPath = taskPath;
            if (process.platform === 'win32' && taskPath.startsWith('/mnt/')) {
                const match = taskPath.match(/^\/mnt\/([a-z])\/(.*)/i);
                if (match) {
                    revealPath = `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, '\\')}`;
                }
            }

            try {
                await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(revealPath));
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to reveal folder: ${error}`);
            }
        }
    );

    // =========================================================================
    // OPEN SETTINGS
    // =========================================================================

    const openSettingsCommand = vscode.commands.registerCommand(
        'terminalWorkspaces.openSettings',
        async () => {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                '@ext:cybersader.terminal-workspaces'
            );
        }
    );

    // =========================================================================
    // FILE WATCHER
    // =========================================================================

    const configWatcher = vscode.workspace.createFileSystemWatcher('**/.vscode/terminal-workspaces.json');
    configWatcher.onDidChange(async () => {
        await configManager.loadConfig();
        treeDataProvider.refresh();
    });
    configWatcher.onDidCreate(async () => {
        await configManager.loadConfig();
        treeDataProvider.refresh();
    });
    configWatcher.onDidDelete(async () => {
        await configManager.loadConfig();
        treeDataProvider.refresh();
    });

    // =========================================================================
    // REGISTER ALL
    // =========================================================================

    context.subscriptions.push(
        treeView,
        refreshCommand,
        addFolderCommand,
        addCurrentFileFolderCommand,
        addFileParentFolderCommand,
        addFromTerminalCommand,
        addBrowseFolderCommand,
        addTaskFolderCommand,
        runTaskByIdCommand,
        runTaskCommand,
        runAllTasksCommand,
        runFolderTasksCommand,
        editTaskCommand,
        renameCommand,
        deleteCommand,
        moveToFolderCommand,
        openConfigCommand,
        openTasksJsonCommand,
        regenerateTasksJsonCommand,
        openManagerCommand,
        openSettingsCommand,
        revealInExplorerCommand,
        searchTasksCommand,
        refreshTmuxSessionsCommand,
        importTmuxSessionsCommand,
        attachTmuxSessionCommand,
        attachAllSessionsCommand,
        importTmuxSessionCommand,
        configWatcher
    );
}

// Helper: Get all task names from items recursively
function getAllTaskNames(items: (TerminalTaskItem | TaskFolder)[]): string[] {
    const names: string[] = [];
    for (const item of items) {
        if (item.type === 'task') {
            names.push(item.name);
        } else if (item.type === 'folder') {
            names.push(...getAllTaskNames(item.children));
        }
    }
    return names;
}

// Helper: Get all tasks from items recursively
function getAllTasks(items: (TerminalTaskItem | TaskFolder)[]): TerminalTaskItem[] {
    const tasks: TerminalTaskItem[] = [];
    for (const item of items) {
        if (item.type === 'task') {
            tasks.push(item);
        } else if (item.type === 'folder') {
            tasks.push(...getAllTasks(item.children));
        }
    }
    return tasks;
}

export function deactivate() {}
