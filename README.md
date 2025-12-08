# Terminal Tasks Manager

A VS Code extension for managing terminal sessions with a visual sidebar interface. Supports WSL, tmux, PowerShell, nested folder organization, profiles, and more.

![Terminal Tasks Manager](images/sidebar-preview.png)

## Features

- **Visual Sidebar** - Manage all terminal tasks from a dedicated tree view
- **Right-Click Integration** - Add folders from Explorer, files, or terminals
- **Nested Organization** - Group tasks into folders for better organization
- **Terminal Profiles** - WSL, tmux, PowerShell, CMD, bash with customizable settings
- **tmux Integration** - Attach-or-create sessions, discover untracked sessions
- **Quick Search** - Find and run tasks instantly with fuzzy search
- **Path Validation** - Experimental feature to detect and fix broken paths

## Quick Start

1. Install the extension
2. Click the Terminal Tasks Manager icon in the Activity Bar
3. Click the `+` button or right-click a folder in Explorer → "Add Folder"
4. Choose a profile and configure your task
5. Click the play button to launch your terminal

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Alt+T` | Run all terminal tasks |
| `Ctrl+Shift+Alt+A` | Add new task |
| `Ctrl+Shift+Alt+O` | Quick open task manager |

## Documentation

- **[User Guide](docs/user-guide.md)** - Complete usage instructions
- **[Configuration](docs/configuration.md)** - Settings, profiles, and customization
- **[tmux Integration](docs/tmux-integration.md)** - Working with tmux sessions
- **[Workflows](docs/workflows.md)** - Recommended workflow patterns

## For Developers

- **[Architecture](dev-docs/architecture.md)** - Codebase overview
- **[Contributing](dev-docs/contributing.md)** - How to contribute
- **[Building](dev-docs/building.md)** - Build and test instructions

## Configuration Highlights

```jsonc
{
  // Default terminal profile
  "terminalTasksManager.defaultProfile": "wsl-tmux",

  // Auto-generate tasks.json from terminal-tasks.json
  "terminalTasksManager.autoGenerateTasksJson": true,

  // Validate paths before running (experimental)
  "terminalTasksManager.experimentalPathValidation": true
}
```

See [Configuration](docs/configuration.md) for all options.

## Why Terminal Tasks Manager?

**Problem**: Managing multiple projects means constantly `cd`-ing to different directories and setting up terminal sessions.

**Solution**: Define your terminal configurations once, organize them visually, and launch them with a single click. Perfect for:

- Multi-project monorepos
- Microservices development
- Switching between work and personal projects
- Persistent tmux sessions across SSH connections

## License

MIT

## Links

- [GitHub Repository](https://github.com/cybersader/vscode-terminal-tasks-manager)
- [Report Issues](https://github.com/cybersader/vscode-terminal-tasks-manager/issues)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=cybersader.terminal-tasks-manager)
