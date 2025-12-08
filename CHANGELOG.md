# Changelog

All notable changes to Terminal Tasks Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Configuration now stored in `terminal-tasks.json` (separate from `tasks.json`)
- Tasks.json is auto-generated from terminal-tasks.json
- All commands renamed to "Terminal Tasks Manager: ..." for clarity

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
| 0.2.0 | 2024-12-08 | Sidebar UI, folders, profiles, tmux integration |
| 0.1.0 | 2024-12-07 | Initial release |
