# Architecture

Technical overview of the Terminal Tasks Manager codebase.

## Table of Contents

- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [Data Flow](#data-flow)
- [Key Types](#key-types)
- [Extension Activation](#extension-activation)
- [VS Code Integration Points](#vs-code-integration-points)

## Project Structure

```
vscode-terminal-tasks-manager/
├── src/
│   ├── extension.ts        # Entry point, command registration
│   ├── configManager.ts    # Configuration loading/saving
│   ├── terminalTasksProvider.ts  # Tree view provider, UI dialogs
│   ├── tmuxManager.ts      # tmux session detection/management
│   └── types.ts            # TypeScript interfaces
├── out/                    # Compiled JavaScript
├── docs/                   # User documentation
├── dev-docs/               # Developer documentation
├── images/                 # Extension icons and screenshots
├── .vscode/                # VS Code workspace settings
├── package.json            # Extension manifest
└── tsconfig.json           # TypeScript configuration
```

## Core Modules

### extension.ts

**Purpose:** Extension entry point and command registration.

**Responsibilities:**
- Register all commands with VS Code
- Initialize ConfigManager and TreeDataProvider
- Set up file watchers for config changes
- Handle command execution logic

**Key Functions:**
- `activate()` - Extension activation
- `validateTaskPath()` - Experimental path validation
- `getAllTaskNames()` - Recursive task name extraction

### configManager.ts

**Purpose:** Manage the `terminal-tasks.json` configuration file.

**Responsibilities:**
- Load and save configuration
- CRUD operations for tasks and folders
- Generate `tasks.json` from configuration
- Profile management

**Key Methods:**
```typescript
class ConfigManager {
  loadConfig(): Promise<void>
  saveConfig(): Promise<void>
  getConfig(): Promise<TerminalTasksConfig>
  addTask(task: Partial<TerminalTaskItem>): Promise<void>
  updateTask(id: string, updates: Partial<TerminalTaskItem>): Promise<void>
  deleteItem(id: string): Promise<void>
  addFolder(name: string, parentId?: string): Promise<void>
  moveItem(itemId: string, targetFolderId: string | null): Promise<void>
  generateTasksJson(): Promise<void>
  flattenTasks(): FlatTask[]
  findItemById(id: string): { item: TaskItem; parent: TaskItem[] } | undefined
  getProfile(id: string): Profile | undefined
  getAllProfiles(): Profile[]
  getFolderPaths(): { id: string; path: string }[]
}
```

### terminalTasksProvider.ts

**Purpose:** Provide data for the tree view and handle UI interactions.

**Responsibilities:**
- Implement TreeDataProvider interface
- Create tree items for tasks, folders, tmux sessions
- Provide dialogs for task creation/editing
- Handle profile and folder pickers

**Key Classes:**
```typescript
class TerminalTasksProvider implements TreeDataProvider<TaskTreeItem> {
  refresh(): void
  refreshTmuxSessions(): void
  getTreeItem(element: TaskTreeItem): TreeItem
  getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]>
  getUntrackedSessions(): TmuxSession[]
}

class TaskConfigDialog {
  static showCreate(...): Promise<TaskConfigResult | undefined>
  static showEdit(...): Promise<Partial<TaskConfigResult> | undefined>
}

class ProfileQuickPick {
  static show(...): Promise<Profile | undefined>
}

class FolderQuickPick {
  static show(...): Promise<{ id: string; path: string } | null | undefined>
}
```

### tmuxManager.ts

**Purpose:** Detect and manage tmux sessions.

**Responsibilities:**
- Check tmux availability
- List all tmux sessions
- Filter untracked sessions
- Generate attach commands
- Handle WSL path conversion

**Key Methods:**
```typescript
class TmuxManager {
  static isAvailable(): boolean
  static getSessions(): TmuxSession[]
  static getUntrackedSessions(trackedNames: string[]): TmuxSession[]
  static getAttachCommand(sessionName: string): string
  static normalizePathForDisplay(wslPath: string): string
}
```

### types.ts

**Purpose:** TypeScript type definitions.

**Key Types:**
```typescript
interface TerminalTaskItem {
  type: 'task'
  id: string
  name: string
  path: string
  profileId?: string
  tags?: string[]
  overrides?: TaskOverrides
}

interface TaskFolder {
  type: 'folder'
  id: string
  name: string
  expanded?: boolean
  tags?: string[]
  children: TaskItem[]
}

type TaskItem = TerminalTaskItem | TaskFolder

interface Profile {
  id: string
  name: string
  description?: string
  icon?: string
  builtin?: boolean
  shell?: string
  shellArgs?: string[]
  env?: Record<string, string>
  tmux?: TmuxConfig
}

interface TerminalTasksConfig {
  version: string
  settings: ConfigSettings
  profiles: Profile[]
  defaultProfileId?: string
  items: TaskItem[]
}
```

## Data Flow

### Configuration Loading

```
VS Code Activation
       ↓
extension.ts: activate()
       ↓
ConfigManager.loadConfig()
       ↓
Read .vscode/terminal-tasks.json
       ↓
Parse and validate
       ↓
Store in memory
       ↓
TerminalTasksProvider.refresh()
       ↓
Tree view updates
```

### Task Execution

```
User clicks task
       ↓
extension.ts: runTaskByIdCommand
       ↓
ConfigManager.findItemById()
       ↓
validateTaskPath() [if experimental enabled]
       ↓
vscode.commands.executeCommand('workbench.action.tasks.runTask', taskName)
       ↓
VS Code reads tasks.json
       ↓
Terminal created with configured shell/command
```

### Configuration Saving

```
User adds/edits task
       ↓
ConfigManager.addTask() or updateTask()
       ↓
Update in-memory config
       ↓
ConfigManager.saveConfig()
       ↓
Write terminal-tasks.json
       ↓
ConfigManager.generateTasksJson()
       ↓
Write tasks.json
       ↓
TerminalTasksProvider.refresh()
```

### tmux Session Discovery

```
Tree view requests children
       ↓
TerminalTasksProvider.getChildren()
       ↓
getUntrackedSessions()
       ↓
TmuxManager.getSessions()
       ↓
Execute: tmux list-sessions -F "..."
       ↓
Parse output
       ↓
Filter out tracked sessions
       ↓
Create TmuxSessionHeader + TmuxSessionData items
```

## Key Types

### Tree Item Types

The tree view displays different item types with a discriminated union:

```typescript
type TreeItemData = TaskItem | TmuxSessionsHeader | TmuxSessionData

interface TmuxSessionsHeader {
  type: 'tmuxSessionsHeader'
}

interface TmuxSessionData {
  type: 'tmuxSession'
  session: TmuxSession
}
```

### Context Values

Context values enable conditional menu visibility:

| contextValue | Item Type |
|--------------|-----------|
| `terminalTask` | Regular task |
| `taskFolderWithChildren` | Folder with tasks |
| `taskFolderEmpty` | Empty folder |
| `tmuxSessionsHeader` | Untracked sessions header |
| `tmuxSession` | Individual tmux session |
| `placeholder` | Empty state placeholder |

## Extension Activation

### Activation Events

The extension activates on:
- VS Code startup (no explicit activation events)
- When the view is revealed

### Initialization Sequence

1. Create ConfigManager instance
2. Create TerminalTasksProvider instance
3. Load configuration from disk
4. Register tree view
5. Register all commands
6. Set up file watcher for config changes
7. Add disposables to subscriptions

## VS Code Integration Points

### contributes (package.json)

| Contribution | Purpose |
|--------------|---------|
| `viewsContainers` | Activity bar icon |
| `views` | Tree view in sidebar |
| `viewsWelcome` | Empty state message |
| `commands` | Command palette entries |
| `menus` | Context menus for tree, explorer, terminal |
| `keybindings` | Keyboard shortcuts |
| `configuration` | Settings schema |

### APIs Used

| API | Usage |
|-----|-------|
| `vscode.TreeDataProvider` | Sidebar tree view |
| `vscode.window.createTreeView` | Tree view with options |
| `vscode.commands.registerCommand` | Command handlers |
| `vscode.workspace.getConfiguration` | Read settings |
| `vscode.window.showQuickPick` | Selection dialogs |
| `vscode.window.showInputBox` | Text input |
| `vscode.window.createTerminal` | Terminal creation |
| `vscode.workspace.createFileSystemWatcher` | Config file changes |

### File System

| File | Purpose |
|------|---------|
| `.vscode/terminal-tasks.json` | Main configuration |
| `.vscode/tasks.json` | Generated VS Code tasks |

## Design Decisions

### Why Two Config Files?

- `terminal-tasks.json` - Rich configuration with folders, profiles, overrides
- `tasks.json` - VS Code's native task format (limited structure)

The extension generates `tasks.json` from `terminal-tasks.json` because:
1. VS Code's task runner is well-tested and feature-rich
2. Users can still use other VS Code task features
3. Separation of concerns between config and execution

### Why tmux via Shell Commands?

tmux integration uses shell commands (`tmux attach-session -t`) rather than a library because:
1. Works across WSL, native Linux, macOS
2. No native Node.js tmux bindings
3. Simple and reliable
4. Easy to debug (commands are visible)

### Why Discriminated Unions?

Tree item types use TypeScript discriminated unions (`type: 'task' | 'folder'`) for:
1. Type-safe item handling
2. Easy type narrowing in conditionals
3. Exhaustive switch statements
4. Clear data structure documentation
