# User Guide

Complete guide to using Terminal Tasks Manager.

## Table of Contents

- [Installation](#installation)
- [Interface Overview](#interface-overview)
- [Adding Tasks](#adding-tasks)
- [Running Tasks](#running-tasks)
- [Organizing with Folders](#organizing-with-folders)
- [Editing Tasks](#editing-tasks)
- [Using Profiles](#using-profiles)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Command Palette](#command-palette)

## Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Terminal Tasks Manager"
4. Click Install

Or install via command line:
```bash
code --install-extension cybersader.terminal-tasks-manager
```

## Interface Overview

### Activity Bar Icon

Terminal Tasks Manager adds an icon to the Activity Bar (left sidebar). Click it to open the Terminal Tasks view.

### Toolbar Buttons

| Icon | Action |
|------|--------|
| ▶ (Run All) | Launch all terminal tasks |
| 🔍 (Search) | Search and run tasks |
| + (Add) | Add a new task |
| 📁 (New Folder) | Create organizational folder |
| ↻ (Refresh) | Refresh the task list |

### Task Tree

Tasks appear in a hierarchical tree. Each task shows:
- **Icon** - Based on the terminal profile
- **Name** - Task label
- **Path** - Shortened working directory path

Hover over a task for inline action buttons:
- ▶ Run the task
- ⚙ Edit settings
- 🗑 Delete

## Adding Tasks

### Method 1: From Explorer (Recommended)

1. Right-click any folder in the Explorer sidebar
2. Select "Terminal Tasks Manager: Add Folder"
3. Configure the task in the wizard

### Method 2: From a File

1. Right-click any file in Explorer
2. Select "Terminal Tasks Manager: Add File's Folder"
3. The parent folder will be used as the working directory

### Method 3: From the Sidebar

1. Click the `+` button in the Terminal Tasks toolbar
2. Choose from:
   - Current file's folder
   - Workspace folder
   - Browse for folder

### Method 4: From Terminal Context Menu

1. Right-click inside any terminal or on a terminal tab
2. Select "Terminal Tasks Manager: Add Task"
3. Choose a folder to associate with the task

### Task Creation Wizard

When adding a task, you'll be prompted for:

1. **Name** - Display name for the task (defaults to folder name)
2. **Profile** - Terminal type (WSL, tmux, PowerShell, etc.)
3. **tmux Session Name** (if using tmux profile) - Custom session name
4. **Tags** (optional) - Comma-separated labels for organization

## Running Tasks

### Single Task

- **Click** the task name in the tree view
- **Click** the ▶ button on hover
- **Right-click** → "Run Terminal"

### All Tasks in a Folder

- **Click** the ▶ button on a folder with tasks
- **Right-click** folder → "Run All Terminals in Folder"

### All Tasks

- **Click** the ▶▶ (Run All) button in the toolbar
- **Keyboard**: `Ctrl+Shift+Alt+T`
- **Command Palette**: "Terminal Tasks Manager: Run All Terminals"

### Search and Run

1. Click the 🔍 button or press `Ctrl+Shift+Alt+O`
2. Type to filter tasks by name, path, or tags
3. Press Enter to run the selected task

## Organizing with Folders

### Create a Folder

1. Click the 📁 button in the toolbar, or
2. Right-click an existing folder → "Create Folder"
3. Enter a folder name

### Move Tasks to Folders

1. Right-click a task
2. Select "Move to Folder"
3. Choose destination folder or "Root"

### Nested Folders

Folders can be nested to any depth. Click the 📁 button while a folder is selected to create a subfolder.

### Rename Folders

Right-click folder → "Rename"

### Delete Folders

Right-click folder → "Delete"

> **Warning**: Deleting a folder also deletes all tasks inside it.

## Editing Tasks

### Quick Edit Options

Right-click a task to access:

| Option | Description |
|--------|-------------|
| Run Terminal | Launch this terminal |
| Edit Task | Open edit menu |
| Rename | Change task name |
| Move to Folder | Reorganize |
| Delete | Remove task |

### Edit Task Menu

Click "Edit Task" or the ⚙ icon to access:

- **Rename** - Change display name
- **Change folder** - Update working directory
- **Change profile** - Switch terminal type
- **Edit tags** - Modify organizational tags
- **Advanced settings** - tmux, colors, commands, env vars

### Advanced Settings

#### tmux Settings

- **Mode**: Disabled, Attach-or-Create, Always New, Attach Only
- **Session Name**: Custom name (defaults to task name)

#### Terminal Color

Set a custom background color for the terminal tab (hex format like `#ff5500`).

#### Startup Commands

Commands to run after `cd` to the directory. Separate multiple commands with semicolons.

Example: `npm install; npm run dev`

#### Environment Variables

Set custom environment variables in `KEY=value` format, comma-separated.

Example: `NODE_ENV=development, DEBUG=true`

## Using Profiles

Profiles define the terminal type and default behavior. Available built-in profiles:

| Profile | Description |
|---------|-------------|
| `wsl-default` | WSL terminal (auto-detects environment) |
| `wsl-tmux` | WSL with tmux (attach-or-create sessions) |
| `powershell` | Windows PowerShell |
| `cmd` | Windows Command Prompt |
| `bash` | Native bash (Linux/macOS) |
| `default` | VS Code's default terminal |

Select a profile when creating a task, or change it later via Edit Task → Change Profile.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Alt+T` | Run all terminal tasks |
| `Ctrl+Shift+Alt+A` | Add new task (smart picker) |
| `Ctrl+Shift+Alt+O` | Quick open/search tasks |

### Customizing Shortcuts

1. Open Keyboard Shortcuts (`Ctrl+K Ctrl+S`)
2. Search for "Terminal Tasks Manager"
3. Click the pencil icon to change bindings

## Command Palette

All commands are available via `Ctrl+Shift+P`:

| Command | Description |
|---------|-------------|
| Terminal Tasks Manager: Add Task | Add from current context |
| Terminal Tasks Manager: Browse for Folder | Add from file picker |
| Terminal Tasks Manager: Create Folder | New organizational folder |
| Terminal Tasks Manager: Run All Terminals | Launch everything |
| Terminal Tasks Manager: Search | Find and run tasks |
| Terminal Tasks Manager: Quick Open | Same as Search |
| Terminal Tasks Manager: Open Settings | Extension settings |
| Terminal Tasks Manager: Open Config File | Edit terminal-tasks.json |
| Terminal Tasks Manager: Open tasks.json | View generated tasks |
| Terminal Tasks Manager: Regenerate tasks.json | Force regeneration |
| Terminal Tasks Manager: Import tmux Sessions | Bulk import tmux sessions |
| Terminal Tasks Manager: Refresh tmux Sessions | Rescan for sessions |

## Tips

### Auto-Open Terminals on Workspace Load

Add this to your generated `.vscode/tasks.json`:

```json
{
  "label": "Open All Terminals",
  "runOptions": { "runOn": "folderOpen" }
}
```

### Finding Tasks Quickly

Use the search feature (`Ctrl+Shift+Alt+O`) to filter by:
- Task name
- Folder path
- File system path
- Tags

### Organizing Large Task Lists

1. Create folders by project or category
2. Use tags for cross-cutting concerns (e.g., "frontend", "backend")
3. Collapse folders you're not actively using
