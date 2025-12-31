# tmux Integration

Terminal Workspaces provides deep integration with tmux for persistent terminal sessions.

> **Note:** Terminal Workspaces also supports **Zellij** as an alternative multiplexer. Zellij provides similar persistence features with a different UI. See the [Zellij section](#zellij-alternative) below.

## Table of Contents

- [Why tmux?](#why-tmux)
- [Quick Start](#quick-start)
- [Session Modes](#session-modes)
- [Untracked Sessions](#untracked-sessions)
- [Session Discovery Workflow](#session-discovery-workflow)
- [Troubleshooting](#troubleshooting)
- [Zellij Alternative](#zellij-alternative)

## Why tmux?

tmux (terminal multiplexer) allows terminal sessions to persist independently of the VS Code window. Benefits:

- **Persistence** - Sessions survive VS Code restarts
- **Remote Work** - Attach to sessions created via SSH
- **Background Processes** - Long-running tasks continue when detached
- **Session Sharing** - Access the same session from multiple terminals

## Quick Start

### 1. Select the WSL + tmux Profile

When creating a task:
1. Choose "WSL + tmux" as the profile
2. Optionally set a custom session name
3. The task will attach-or-create a tmux session

### 2. Run the Task

Click the play button. The extension will:
1. Check if a session with that name exists
2. Attach to it if found
3. Create a new session if not found

### 3. Detach and Reattach

- **Detach**: Press `Ctrl+B` then `D` in tmux
- **Reattach**: Run the task again

## Session Modes

Configure tmux behavior per-task via Edit Task → Advanced Settings → tmux Settings.

### Attach-or-Create (Default)

```
If session "my-project" exists → attach
Else → create new session "my-project"
```

Best for: Most use cases. Ensures you always have a session.

### Always New

```
Create session "my-project-1"
Next time: Create session "my-project-2"
```

Best for: When you want multiple independent sessions for the same project.

### Attach Only

```
If session "my-project" exists → attach
Else → error message
```

Best for: Connecting to sessions you know should exist (e.g., created via SSH).

## Untracked Sessions

Terminal Workspaces can discover tmux sessions that aren't linked to any task.

### What are Untracked Sessions?

Sessions created:
- Via SSH from another machine
- Manually in terminal (`tmux new -s session-name`)
- By other tools or scripts

### Viewing Untracked Sessions

When untracked sessions exist, an "Untracked Sessions" section appears in the sidebar:

```
▼ Untracked Sessions (3) tmux
  ○ mobile-session
  ○ ssh-work
  ○ background-job
```

### Attaching to Untracked Sessions

**Option 1: Inline Button**
Hover over a session → Click the ▶ (attach) button

**Option 2: Right-Click**
Right-click session → "Attach to Session"

**Option 3: Attach All**
Click ▶▶ on "Untracked Sessions" header → Attaches to all sessions

### Importing as Tasks

To track a session permanently:

1. Right-click the session
2. Select "Import as Task"
3. Enter a task name
4. The session becomes a tracked task

### Refreshing Sessions

Click ↻ on the "Untracked Sessions" header or run:
"Terminal Workspaces: Refresh tmux Sessions"

## Session Discovery Workflow

A powerful workflow for remote development:

### Scenario: SSH from Mobile

1. SSH into your dev machine from Termux/mobile
2. Create tmux sessions for your work:
   ```bash
   tmux new -s project-a
   # do some work
   # Ctrl+B D to detach
   tmux new -s project-b
   ```
3. Later, open VS Code on your desktop
4. The sessions appear under "Untracked Sessions"
5. Attach to continue where you left off
6. Import as tasks to track permanently

### Scenario: Long-Running Processes

1. Create a task with tmux profile
2. Start a long process (build, test suite, etc.)
3. Detach with `Ctrl+B D`
4. Close VS Code, go home
5. Reopen VS Code, run the task
6. The process is still running where you left it

## Troubleshooting

### "can't find session: undefined"

**Cause**: The session name wasn't passed correctly.

**Fix**: This was a bug in earlier versions. Update to the latest version.

### tmux Sessions Not Appearing

**Cause 1**: tmux may not be in PATH or installed.

**Check**:
```bash
which tmux
tmux list-sessions
```

**Fix**: Install tmux:
```bash
# Ubuntu/Debian
sudo apt install tmux

# macOS
brew install tmux
```

**Cause 2 (Windows Local Mode)**: tmux installed to user directory.

When VS Code runs in Windows Local mode (not WSL Remote), it detects tmux via `wsl.exe -e which tmux`. This uses a non-interactive shell that doesn't load `~/.bashrc`, so user directories like `~/.local/bin/` aren't in PATH.

**Fix**: Ensure tmux is installed system-wide (`/usr/bin/` via apt install)

### Sessions Show Wrong Path

**Cause**: tmux reports the path of the active pane, which may have changed.

**Note**: The extension doesn't set `cwd` when attaching because tmux restores the session's working directory automatically.

### "No untracked sessions" but I Have Sessions

**Cause**: Sessions might be tracked by existing tasks with matching names.

**Check**: A session is "tracked" if any task has:
- Same name as the session, OR
- tmux override with matching session name

### Permission Errors on Windows

**Cause**: Running tmux commands through WSL from Windows.

**Fix**: Ensure you're either:
- Connected to WSL via Remote-WSL extension, OR
- Have WSL properly configured with `wsl.exe` in PATH

## tmux Quick Reference

### Key Bindings (Default Prefix: Ctrl+B)

| Keys | Action |
|------|--------|
| `Ctrl+B D` | Detach from session |
| `Ctrl+B C` | Create new window |
| `Ctrl+B N` | Next window |
| `Ctrl+B P` | Previous window |
| `Ctrl+B %` | Split pane vertically |
| `Ctrl+B "` | Split pane horizontally |
| `Ctrl+B Arrow` | Navigate panes |
| `Ctrl+B [` | Enter scroll mode |

### Useful Commands

```bash
# List sessions
tmux list-sessions

# Attach to session
tmux attach -t session-name

# Create new session
tmux new -s session-name

# Kill session
tmux kill-session -t session-name

# Kill all sessions
tmux kill-server
```

## Configuration Tips

### Custom Session Names

Use descriptive session names that differ from task names:

```json
"overrides": {
  "tmux": {
    "sessionName": "myapp-dev-server"
  }
}
```

### Startup Commands in tmux

Use `postCommands` to run commands when creating new sessions:

```json
"overrides": {
  "postCommands": ["npm run dev"]
}
```

Note: Commands only run on session creation, not when attaching.

## Zellij Alternative

[Zellij](https://zellij.dev/) is a modern terminal multiplexer that can be used instead of (or alongside) tmux.

### Why Zellij?

- **Modern UI** - Built-in status bar, tab bar, and pane borders
- **WebAssembly plugins** - Extensible with WASM plugins
- **Better defaults** - More intuitive out of the box
- **Floating panes** - Pop-up terminal windows within sessions
- **Works better with some TUI apps** - Some apps like OpenCode render better in Zellij than tmux

### Quick Start with Zellij

1. Install Zellij to a system-wide location:
   ```bash
   curl -L https://github.com/zellij-org/zellij/releases/latest/download/zellij-x86_64-unknown-linux-musl.tar.gz | tar xz
   sudo mv zellij /usr/local/bin/
   ```

2. When creating a task, choose "WSL + Zellij" as the profile

3. The extension will attach-or-create Zellij sessions just like tmux

### Zellij Sessions in Sidebar

When Zellij sessions exist, an "Untracked Sessions (zellij)" section appears separately from tmux sessions:

```
▼ Untracked Sessions (3) tmux
  ○ tmux-session-1
  ○ tmux-session-2
▼ Untracked Sessions (2) zellij
  ○ zellij-session-1
  ○ zellij-session-2
```

### Zellij Key Bindings (Default)

| Keys | Action |
|------|--------|
| `Ctrl+P D` | Detach from session |
| `Alt+N` | New pane |
| `Alt+Arrow` | Navigate panes |
| `Ctrl+P W` | Toggle floating pane |
| `Ctrl+P C` | New tab |
| `Ctrl+P N/P` | Next/Previous tab |

### Zellij Commands

```bash
# List sessions
zellij list-sessions

# Attach to session
zellij attach session-name

# Create new session
zellij -s session-name

# Kill session
zellij kill-session session-name
```

### Critical: Zellij PATH Requirement

**Zellij must be installed to `/usr/local/bin/` or `/usr/bin/`** for detection to work in Windows Local mode.

If you installed via `cargo install zellij` (goes to `~/.cargo/bin/`) or the official install script (goes to `~/.local/bin/`), session detection will only work in WSL Remote mode.

**Fix:** Move Zellij to system-wide location:
```bash
sudo mv ~/.local/bin/zellij /usr/local/bin/
# or
sudo mv ~/.cargo/bin/zellij /usr/local/bin/
```
