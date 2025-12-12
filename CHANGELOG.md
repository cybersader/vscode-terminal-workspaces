# Changelog

All notable changes to Terminal Workspaces will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2024-12-12

### Added

- **Kill tmux Session from Terminal Tab** - Right-click terminal tabs in the panel to kill the associated tmux session
- **Reveal in VS Code Explorer** - New context menu option to reveal task folders in the VS Code sidebar explorer
- **SSH + tmux Setup Guide** - New documentation (`docs/ssh-tmux-setup.md`) with bash helpers for efficient tmux session management via SSH

### Fixed

- **Terminal Reuse** - Terminals opened in editor area now reuse existing tabs instead of creating duplicates with lock symbols
- **Kill tmux from Terminal Tab** - Command now properly receives the clicked terminal instead of requiring it to be active

## [0.4.0] - 2024-12-12

### Added

- **Active Terminal Indicators** - Tasks and tmux sessions now show green when a terminal is open, grey when inactive
- **Terminal Location Setting** - New `terminalWorkspaces.terminalLocation` setting to open terminals in the editor area (for 2D grid layouts) or panel
  - Works for both regular tasks and tmux session attachments

### Fixed

- **Tree View Alignment** - Fixed icon alignment issues where folder children appeared misaligned
  - Folders now use `archive` icon for consistent width with task icons
  - Tasks use `circle-filled` icons that align properly with tmux sessions
- **Tree View Collapse** - Added unique IDs to all tree items to preserve expansion state across refreshes
- **Editor Terminal Location** - Regular tasks now properly open in editor area when setting is configured (previously only worked for tmux sessions)

## [0.3.0] - 2024-12-08

### Changed

- **Renamed to Terminal Workspaces** - Clearer name reflecting the extension's purpose
  - Extension ID: `terminal-workspaces`
  - Config file: `terminal-workspaces.json` (was `terminal-tasks.json`)
  - All settings now prefixed with `terminalWorkspaces.`
- Added "Agentic Coding Workflows" documentation for Claude Code, Cursor, Aider
- Added "Mobile + Desktop Seamless Coding" workflow with Tailscale/Termux/tmux

## [0.2.0] - 2024-12-08

### Added

- **Visual Sidebar** - Dedicated tree view in Activity Bar for managing terminal tasks
- **Nested Folder Organization** - Create folders to organize tasks hierarchically
- **Terminal Profiles** - Built-in profiles for WSL, tmux, PowerShell, CMD, and bash
- **tmux Integration**
  - Attach-or-create session mode
  - Untracked session discovery
  - Bulk import tmux sessions
  - Attach all sessions at once
- **Per-Task Customization**
  - Custom tmux session names
  - Terminal tab colors
  - Environment variables
  - Startup commands (postCommands)
- **Search & Filter** - Quick search across all tasks by name, path, or tags
- **Task Tags** - Add comma-separated tags for organization
- **Context Menu Integration**
  - Right-click folders in Explorer to add
  - Right-click files to add parent folder
  - Right-click in terminal to add task
- **Keyboard Shortcuts**
  - `Ctrl+Shift+Alt+T` - Run all terminals
  - `Ctrl+Shift+Alt+A` - Add new task
  - `Ctrl+Shift+Alt+O` - Quick open/search
- **Path Validation** - Experimental setting to detect and fix broken paths
- **Settings Access** - Quick access to extension settings from sidebar menu

### Changed

- Complete rewrite with new data model
- Configuration now stored in `terminal-workspaces.json` (separate from `tasks.json`)
- Tasks.json is auto-generated from terminal-workspaces.json
- All commands renamed to "Terminal Workspaces: ..." for clarity

### Fixed

- ESC key now properly cancels task creation wizard
- tmux attach no longer fails with undefined session names
- Empty folders no longer show "Run All" button
- Proper handling of paths with spaces

## [0.1.0] - 2024-12-07

### Added

- Initial release
- Right-click folder to add terminal task
- Command palette integration
- Auto-detection of WSL environment
- Basic task templates (WSL, bash, PowerShell, CMD)
- Group task for running all terminals
- Path conversion between Windows and WSL formats

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.4.1 | 2024-12-12 | Kill tmux from terminal tab, reveal in explorer, SSH/tmux docs |
| 0.4.0 | 2024-12-12 | Active terminal indicators, terminal location setting, tree view fixes |
| 0.3.0 | 2024-12-08 | Renamed to Terminal Workspaces, agentic workflow docs |
| 0.2.0 | 2024-12-08 | Sidebar UI, folders, profiles, tmux integration |
| 0.1.0 | 2024-12-07 | Initial release |
