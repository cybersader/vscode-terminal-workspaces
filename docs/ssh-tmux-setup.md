# SSH + tmux Setup Guide

Quick setup for remoting into WSL via SSH and managing tmux sessions efficiently.

## Bash Aliases & Autocomplete

Add these to your `~/.bashrc` on the WSL/Linux machine you SSH into:

```bash
# ============================================================================
# TMUX SESSION HELPERS
# ============================================================================

# Attach to tmux session (or create if doesn't exist)
t() {
    if [ -n "$1" ]; then
        tmux attach -t "$1" 2>/dev/null || tmux new -s "$1"
    else
        tmux attach 2>/dev/null || tmux new
    fi
}

# Kill a tmux session
tk() {
    if [ -n "$1" ]; then
        tmux kill-session -t "$1"
    else
        echo "Usage: tk <session-name>"
        echo "Sessions:"
        tmux list-sessions -F "  #{session_name}" 2>/dev/null
    fi
}

# List tmux sessions
tl() {
    tmux list-sessions 2>/dev/null || echo "No tmux sessions"
}

# Autocomplete tmux session names for t, tk commands
_tmux_complete() {
    local sessions
    sessions=$(tmux list-sessions -F "#{session_name}" 2>/dev/null)
    COMPREPLY=($(compgen -W "$sessions" -- "${COMP_WORDS[COMP_CWORD]}"))
}
complete -F _tmux_complete t
complete -F _tmux_complete tk
complete -F _tmux_complete tmux
```

After adding, run `source ~/.bashrc` or reconnect.

## Usage

| Command | Description |
|---------|-------------|
| `t` | Attach to last session, or create new |
| `t myproject` | Attach to "myproject" session (creates if doesn't exist) |
| `t my<Tab>` | Autocomplete session names |
| `tk myproject` | Kill "myproject" session |
| `tk my<Tab>` | Autocomplete for kill |
| `tl` | List all sessions |

## SSH Setup with Tailscale

For seamless mobile-to-desktop coding:

### 1. Install Tailscale on both devices

**Windows/WSL:**
```bash
# In WSL
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh
```

**Android (Termux):**
```bash
pkg install tailscale
tailscaled &
tailscale up
```

### 2. Connect from Termux

```bash
# Find your WSL machine's Tailscale IP or hostname
ssh username@your-wsl-machine

# Once connected, attach to session
t myproject
```

### 3. Workflow

1. Start tmux sessions on WSL (via Terminal Workspaces or manually)
2. Work on your PC in VS Code
3. Walk away from PC
4. SSH from phone: `ssh user@machine`
5. `t my<Tab>` to autocomplete and attach
6. Continue working where you left off
7. Detach with `Ctrl+B, D`
8. Back at PC? Terminal Workspaces shows sessions, click to reattach

## Tmux Quick Reference

| Key | Action |
|-----|--------|
| `Ctrl+B, D` | Detach from session (keeps it running) |
| `Ctrl+B, C` | Create new window |
| `Ctrl+B, N` | Next window |
| `Ctrl+B, P` | Previous window |
| `Ctrl+B, %` | Split pane vertically |
| `Ctrl+B, "` | Split pane horizontally |
| `Ctrl+B, Arrow` | Navigate panes |
| `Ctrl+B, X` | Kill current pane |
| `Ctrl+B, &` | Kill current window |

## Killing Sessions

**From bash:**
```bash
tk session-name    # Kill specific session
tmux kill-server   # Kill ALL sessions (nuclear option)
```

**From inside tmux:**
```bash
# Kill current session and detach
tmux kill-session

# Or exit all panes/windows in the session
exit  # (repeat until session closes)
```

**From Terminal Workspaces:**
- Right-click on a tmux session → "Kill Session"

## Tips

- **Short session names**: Use short names like `api`, `web`, `docs` instead of `my-super-long-project-name`
- **Rename existing session**: `tmux rename-session -t old-name new-name`
- **Session from Terminal Workspaces**: The extension uses task names as session names by default, but you can set custom short names in task settings
