# Terminal Workspaces Roadmap

Future ideas and potential features. None are committed - just capturing possibilities.

## Sidebar Organization

- **Root task position** - Choose whether root-level tasks appear above or below folders
- **Custom folder ordering** - Manual ordering beyond alphabetical
- **Drag-and-drop reordering** - Visually reorganize tasks and folders in sidebar

## Visual Indicators

- **Multiplexer-specific colors** - Color-code by multiplexer type instead of state:
  - Zellij: Blue shades (bright=active, dim=background, grey=inactive)
  - tmux: Yellow shades (bright=active, dim=background, grey=inactive)
  - *Decision: Kept state-based (green/yellow/grey) for simplicity. Revisit if users request.*

## Session Management

- **Session templates** - Save/restore window layouts within tmux/zellij sessions
- **Session snapshots** - Capture and restore full session state
- **Auto-attach on startup** - Option to automatically attach to sessions when VS Code opens

## Integration

- **SSH remote support** - Detect and manage tmux/zellij sessions on remote SSH hosts
- **Dev containers** - Support for sessions inside dev containers
- **Multi-root workspaces** - Better handling of VS Code multi-root workspace scenarios

## Quality of Life

- **Task search/filter improvements** - Fuzzy search, tag filtering
- **Keyboard navigation** - Full keyboard control of sidebar
- **Task templates** - Create new tasks from saved templates
- **Bulk operations** - Select multiple tasks for batch actions

---

*To suggest features, open an issue on [GitHub](https://github.com/cybersader/vscode-terminal-workspaces/issues).*
