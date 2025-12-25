# AI Agent Workflows with Terminal Workspaces

This guide covers how to use Terminal Workspaces effectively when working with AI coding assistants like Claude Code, Cursor, Aider, and similar tools.

## Why Terminal Workspaces for AI Development?

When working with AI coding agents across multiple projects, you face challenges:
- **Context switching** - Jumping between different codebases requires re-orienting
- **Session persistence** - AI conversations get lost when terminals close
- **Organization** - Hard to track which agent is working on what

Terminal Workspaces solves these by:
- **One-click launch** - Pre-configured terminals for each project
- **tmux persistence** - Sessions survive VS Code restarts and SSH disconnects
- **Visual organization** - Folder structure mirrors your project relationships
- **Quick switching** - Jump between agent contexts instantly

## Multi-Agent Development Pattern

### Setup Pattern

1. **Create folder structure** for related projects:
   ```
   My Stack/
   ├── Frontend (React)
   ├── Backend (Node)
   └── Shared (TypeScript libs)
   ```

2. **In Terminal Workspaces sidebar**:
   - Create folder: "Full-Stack Agents"
   - Add tasks:
     - "Frontend Claude" -> `wsl-tmux` profile -> /path/to/frontend
     - "Backend Claude" -> `wsl-tmux` profile -> /path/to/backend
     - "Shared Claude" -> `wsl-tmux` profile -> /path/to/shared

3. **Click "Run All"** -> Three persistent tmux sessions open, each ready for an AI agent

### Example Configuration

```json
{
  "version": "1.0.0",
  "items": [
    {
      "type": "folder",
      "id": "fullstack-agents",
      "name": "Full-Stack AI Agents",
      "children": [
        {
          "type": "task",
          "id": "frontend-claude",
          "name": "Frontend Agent",
          "path": "/mnt/c/projects/myapp-frontend",
          "profileId": "wsl-tmux",
          "tags": ["ai", "frontend"]
        },
        {
          "type": "task",
          "id": "backend-claude",
          "name": "Backend Agent",
          "path": "/mnt/c/projects/myapp-backend",
          "profileId": "wsl-tmux",
          "tags": ["ai", "backend"]
        },
        {
          "type": "task",
          "id": "docs-agent",
          "name": "Docs Agent",
          "path": "/mnt/c/projects/myapp-docs",
          "profileId": "wsl-tmux",
          "tags": ["ai", "docs"]
        }
      ]
    }
  ]
}
```

## Session Persistence with tmux

### Why tmux?

tmux keeps your AI agent sessions alive:
- **VS Code restarts** - Sessions continue running
- **SSH disconnects** - Reconnect and resume
- **Sleep/hibernate** - Come back where you left off
- **Multi-device** - Access same sessions from phone via Termux

### Workflow

1. Start Claude Code in a tmux-profile task
2. Work on your project with the AI agent
3. Close VS Code (tmux session keeps running)
4. Come back later -> Click task -> Reattach to same conversation

### Mobile Access Pattern

```
Phone (Termux)  <--SSH-->  Desktop (WSL + tmux)
                             |
                         Claude Code session still running
```

Using Tailscale + Termux, you can SSH into your home machine and `tmux attach` to continue AI conversations from anywhere.

## Best Practices

### Task Naming
- **Be specific**: "Frontend Bug Fix" not just "Frontend"
- **Include context**: "Auth Refactor Claude" tells you exactly what that agent is working on
- **Use project names**: "myapp-frontend-agent"

### Tagging
Use tags for quick filtering:
```json
"tags": ["ai", "claude", "frontend"]
```
Then search with `Ctrl+Shift+Alt+O` and type "ai" to see all AI-related tasks.

### Terminal Location
For complex agent workflows:
```json
"terminalWorkspaces.terminalLocation": "editor"
```
This enables 2D grid layouts - put multiple agent terminals side-by-side in the editor area.

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Alt+T` | Run all terminal tasks |
| `Ctrl+Shift+Alt+A` | Add new task |
| `Ctrl+Shift+Alt+O` | Quick open/search tasks |

## Working with AI on This Extension

If you're using AI to develop Terminal Workspaces itself:

### Effective Prompts

**Good**:
- "Add a command to export all tasks to a shareable JSON file"
- "Make the tree view show task counts for each folder"
- "The green indicator doesn't clear after killing a session - fix it"

**Include Context**:
- "Looking at extension.ts line 500, the runTaskDirectly function..."
- "In types.ts, the TaskItem union..."
- "Per the CLAUDE.md conventions..."

### Reference Points
- **Data model**: `src/types.ts`
- **Architecture**: `dev-docs/architecture.md`
- **Conventions**: `CLAUDE.md`

## Pre-Publish Checklist for AI-Assisted Changes

Before pushing to GitHub or publishing to VS Code Marketplace:

### Code Review
- [ ] No hardcoded personal paths (check for `/home/username`, `C:\Users\YourName`)
- [ ] No API keys or secrets in code
- [ ] No personal email addresses in comments
- [ ] Test data doesn't contain real personal info

### Config Files
- [ ] `.vscode/terminal-workspaces.json` doesn't contain personal project paths
- [ ] No local machine references in example configs
- [ ] package.json author/publisher info is correct (not personal email if you want privacy)

### Documentation
- [ ] README screenshots don't reveal personal folders
- [ ] Example configurations use generic paths (`/mnt/c/projects/...`)
- [ ] No personal usernames in documentation

### Quick Grep Check
```bash
# Search for potential personal info
grep -r "Users/[A-Z]" . --include="*.ts" --include="*.json" --include="*.md"
grep -r "@gmail\|@yahoo\|@hotmail" . --include="*.ts" --include="*.json" --include="*.md"
grep -r "home/" . --include="*.ts" --include="*.json" --include="*.md"
```

### Files to Double-Check
- `README.md` - Screenshots, example paths
- `docs/*.md` - Example configurations
- `package.json` - Author info, repository URLs
- Any `.json` example files
- `CHANGELOG.md` - Personal commit info

## Tips

### Parallel Agent Work
Run multiple Claude Code instances:
1. Open VS Code multi-root workspace
2. Create tasks for each project
3. Launch all with "Run All"
4. Switch between conversations as needed

### Recovery
If you lose track of tmux sessions:
1. Check "Untracked Sessions" in sidebar
2. Click to attach or import as tasks
3. Use `tmux list-sessions` in any terminal

### Debugging Agent Sessions
If an agent session seems stuck:
1. Right-click task -> "Kill Session"
2. Wait for green indicator to clear
3. Re-run the task to start fresh
