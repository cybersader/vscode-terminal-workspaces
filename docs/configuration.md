# Configuration

Complete reference for Terminal Tasks Manager settings, profiles, and customization options.

## Table of Contents

- [VS Code Settings](#vs-code-settings)
- [Terminal Profiles](#terminal-profiles)
- [Config File Structure](#config-file-structure)
- [Task Properties](#task-properties)
- [Folder Properties](#folder-properties)
- [Generated tasks.json](#generated-tasksjson)

## VS Code Settings

Access via `Ctrl+,` → search "Terminal Tasks Manager" or add to `settings.json`:

### terminalTasksManager.defaultProfile

Default terminal profile for new tasks.

```json
"terminalTasksManager.defaultProfile": "wsl-default"
```

**Options:**
- `wsl-default` - WSL terminal (auto-detects environment)
- `wsl-tmux` - WSL with tmux attach-or-create
- `powershell` - Windows PowerShell
- `cmd` - Windows Command Prompt
- `bash` - Native bash (Linux/macOS)
- `default` - VS Code's default terminal

### terminalTasksManager.autoGenerateTasksJson

Automatically regenerate `.vscode/tasks.json` when `terminal-tasks.json` changes.

```json
"terminalTasksManager.autoGenerateTasksJson": true
```

### terminalTasksManager.groupTaskLabel

Label for the "run all" group task in tasks.json.

```json
"terminalTasksManager.groupTaskLabel": "Open All Terminals"
```

### terminalTasksManager.createGroupTask

Whether to create a group task that runs all terminals.

```json
"terminalTasksManager.createGroupTask": true
```

### terminalTasksManager.tmuxClickToAttach

Click untracked tmux sessions to attach immediately.

```json
"terminalTasksManager.tmuxClickToAttach": false
```

When `false` (default), clicking shows session info. Right-click to attach.
When `true`, single-click attaches to the session.

### terminalTasksManager.experimentalPathValidation

**[Experimental]** Validate task paths before running.

```json
"terminalTasksManager.experimentalPathValidation": false
```

When enabled:
- Checks if the configured path exists before running
- Prompts to browse for a new path if missing
- Option to save the updated path or run once

## Terminal Profiles

### Built-in Profiles

| ID | Name | Description |
|----|------|-------------|
| `wsl-default` | WSL Terminal | Standard WSL bash session |
| `wsl-tmux` | WSL + tmux | Attach-or-create tmux sessions |
| `powershell` | PowerShell | Windows PowerShell |
| `cmd` | Command Prompt | Windows CMD |
| `bash` | Bash | Native bash (Linux/macOS) |
| `default` | Default Terminal | VS Code's default profile |

### Profile Properties

Each profile defines:

```typescript
interface Profile {
  id: string;           // Unique identifier
  name: string;         // Display name
  description?: string; // Help text
  icon?: string;        // VS Code icon name
  shell?: string;       // Shell executable
  shellArgs?: string[]; // Shell arguments
  env?: Record<string, string>; // Environment variables
  tmux?: {
    enabled: boolean;
    mode: 'attach-or-create' | 'always-new' | 'attach-only';
    sessionName?: string;
  };
}
```

### WSL + tmux Profile Details

The `wsl-tmux` profile:
- Attaches to existing session if it exists
- Creates a new session if it doesn't
- Session name defaults to task name
- Persists across terminal closures

## Config File Structure

Configuration is stored in `.vscode/terminal-tasks.json`:

```json
{
  "version": "2.0.0",
  "settings": {
    "groupTaskLabel": "Open All Terminals",
    "createGroupTask": true
  },
  "profiles": [],
  "defaultProfileId": "wsl-default",
  "items": []
}
```

### Top-Level Properties

| Property | Type | Description |
|----------|------|-------------|
| `version` | string | Config version (currently "2.0.0") |
| `settings` | object | Global settings |
| `profiles` | array | Custom profile definitions |
| `defaultProfileId` | string | Default profile for new tasks |
| `items` | array | Tasks and folders |

## Task Properties

```json
{
  "type": "task",
  "id": "unique-id",
  "name": "My Task",
  "path": "/path/to/directory",
  "profileId": "wsl-tmux",
  "tags": ["frontend", "work"],
  "overrides": {
    "tmux": {
      "enabled": true,
      "mode": "attach-or-create",
      "sessionName": "custom-session"
    },
    "icon": "terminal-bash",
    "colors": {
      "background": "#1a1a2e"
    },
    "env": {
      "NODE_ENV": "development"
    },
    "postCommands": ["npm run dev"]
  }
}
```

### Task Fields

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Always `"task"` |
| `id` | Yes | Unique identifier (auto-generated) |
| `name` | Yes | Display name |
| `path` | Yes | Working directory path |
| `profileId` | No | Profile to use (defaults to extension setting) |
| `tags` | No | Array of string labels |
| `overrides` | No | Per-task customizations |

### Override Options

#### tmux

```json
"tmux": {
  "enabled": true,
  "mode": "attach-or-create",
  "sessionName": "my-session"
}
```

| Mode | Behavior |
|------|----------|
| `attach-or-create` | Attach if exists, create if not |
| `always-new` | Always create new session (numbered) |
| `attach-only` | Fail if session doesn't exist |

#### icon

VS Code theme icon name:
```json
"icon": "terminal-bash"
```

Common icons: `terminal`, `terminal-bash`, `terminal-powershell`, `terminal-cmd`

#### colors

Terminal tab background color:
```json
"colors": {
  "background": "#ff5500"
}
```

#### env

Environment variables:
```json
"env": {
  "NODE_ENV": "development",
  "DEBUG": "*"
}
```

#### postCommands

Commands to run after cd:
```json
"postCommands": ["npm install", "npm run dev"]
```

## Folder Properties

```json
{
  "type": "folder",
  "id": "unique-id",
  "name": "Frontend Projects",
  "expanded": true,
  "tags": ["work"],
  "children": []
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Always `"folder"` |
| `id` | Yes | Unique identifier |
| `name` | Yes | Display name |
| `expanded` | No | Whether folder is expanded in tree |
| `tags` | No | Array of string labels |
| `children` | Yes | Array of tasks and subfolders |

## Generated tasks.json

Terminal Tasks Manager generates `.vscode/tasks.json` from your configuration.

### Example Output

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Open All Terminals",
      "dependsOn": ["Frontend", "Backend", "Database"],
      "dependsOrder": "parallel",
      "problemMatcher": [],
      "runOptions": {}
    },
    {
      "label": "Frontend",
      "type": "shell",
      "command": "cd '/path/to/frontend' && exec bash",
      "options": {
        "cwd": "/path/to/frontend"
      },
      "presentation": {
        "reveal": "always",
        "panel": "new",
        "name": "Frontend"
      },
      "isBackground": true,
      "problemMatcher": []
    }
  ]
}
```

### Regenerating tasks.json

Tasks.json is regenerated when:
- You add, edit, or delete tasks
- You save changes to terminal-tasks.json (if auto-generate enabled)
- You run "Terminal Tasks Manager: Regenerate tasks.json"

### Manual Edits

> **Warning**: Manual edits to tasks.json will be overwritten when regenerated.

If you need custom tasks alongside Terminal Tasks Manager tasks:
1. Disable `autoGenerateTasksJson`
2. Manually merge your custom tasks after regeneration
3. Or use a separate tasks file for custom tasks

## Example Configurations

### Minimal Setup

```json
{
  "version": "2.0.0",
  "items": [
    {
      "type": "task",
      "id": "1",
      "name": "My Project",
      "path": "/home/user/projects/my-project"
    }
  ]
}
```

### Organized with Folders

```json
{
  "version": "2.0.0",
  "items": [
    {
      "type": "folder",
      "id": "work",
      "name": "Work",
      "children": [
        {
          "type": "task",
          "id": "api",
          "name": "API Server",
          "path": "/home/user/work/api",
          "profileId": "wsl-tmux"
        }
      ]
    }
  ]
}
```

### With Custom Overrides

```json
{
  "version": "2.0.0",
  "items": [
    {
      "type": "task",
      "id": "dev-server",
      "name": "Dev Server",
      "path": "/home/user/app",
      "profileId": "wsl-tmux",
      "tags": ["dev", "frontend"],
      "overrides": {
        "tmux": {
          "sessionName": "app-dev"
        },
        "colors": {
          "background": "#2d3748"
        },
        "env": {
          "NODE_ENV": "development"
        },
        "postCommands": ["npm run dev"]
      }
    }
  ]
}
```
