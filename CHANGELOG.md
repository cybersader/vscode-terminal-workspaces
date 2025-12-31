# Changelog

All notable changes to Terminal Workspaces will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2025-12-31

### Fixed

- **Disposed Terminal Error** - Fixed "Terminal has already been disposed" error when re-running a task after terminating the VS Code terminal while a tmux/zellij session was still running in the background. Now gracefully creates a new terminal instead of failing.

## [0.5.0] - 2025-12-30

### Added

- **Zellij Support** - New terminal multiplexer option alongside tmux
  - New built-in profiles: `WSL + Zellij` and `Bash + Zellij`
  - Same attach-or-create, always-new, and attach-only modes as tmux
  - Kill Zellij Session command for active zellij tasks
  - ZellijManager for session detection and management

### Fixed

- **Green Indicator Accuracy** - Fixed issue where green active indicator could persist after a multiplexer session was killed externally. Now verifies actual session existence (not just VS Code terminal) before showing active status

## [0.4.5] - 2025-12-26

### Fixed

- **Kill Session on Already-Dead Sessions** - "Kill Session" no longer shows error when tmux session was already terminated; gracefully closes terminal and refreshes indicators

## [0.4.4] - 2025-12-25

### Fixed

- **Hover Buttons on Active Tasks** - Inline buttons (play, edit, delete) now appear correctly when hovering over active tmux sessions
- **Green Indicator Persistence** - Fixed issue where green active indicator stayed after killing a tmux session
- **Terminal Name Matching** - Fixed detection of active terminals for tasks with sanitized tmux session names (e.g., "my project" -> "my_project")
- **Menu Pattern Reliability** - Changed package.json menu patterns from regex to explicit OR conditions for consistent button visibility

### Added

- **CLAUDE.md** - AI agent collaboration conventions and development guidelines
- **AI Agent Workflows Guide** - New documentation (`docs/ai-agent-workflows.md`) for using the extension with Claude Code, Cursor, and other AI coding tools

## [0.4.3] - 2024-12-13

### Fixed

- **Kill Session Shell Quoting** - Fixed command quoting issues when killing tmux sessions with special characters in names
- **Kill Session Only on Active** - "Kill Session" context menu now only appears on tasks with active tmux sessions (green dot), not inactive ones
- **Native Linux/macOS Support** - Kill session command now works correctly on native Linux/macOS, not just WSL

## [0.4.2] - 2024-12-13

### Fixed

- **Duplicate tmux Sessions Bug** - Fixed issue where tasks with spaces in their names (e.g., "claude code") would appear both as tracked tasks AND in untracked sessions. Session names are now properly sanitized to match tmux's actual session names (spaces become underscores).
- **Kill Session Not Working** - Fixed "can't find session" error when trying to kill tmux sessions from tasks with spaces in their names.

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
| 0.5.0 | 2025-12-30 | Zellij support, improved active indicator accuracy |
| 0.4.5 | 2025-12-26 | Graceful handling of already-dead tmux sessions |
| 0.4.4 | 2025-12-25 | Fix hover buttons on active tasks, AI agent docs |
| 0.4.3 | 2024-12-13 | Fix kill session quoting, only show on active sessions |
| 0.4.2 | 2024-12-13 | Fix duplicate sessions bug, session name sanitization |
| 0.4.1 | 2024-12-12 | Kill tmux from terminal tab, reveal in explorer, SSH/tmux docs |
| 0.4.0 | 2024-12-12 | Active terminal indicators, terminal location setting, tree view fixes |
| 0.3.0 | 2024-12-08 | Renamed to Terminal Workspaces, agentic workflow docs |
| 0.2.0 | 2024-12-08 | Sidebar UI, folders, profiles, tmux integration |
| 0.1.0 | 2024-12-07 | Initial release |
