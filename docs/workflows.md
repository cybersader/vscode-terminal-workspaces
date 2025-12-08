# Workflows

Recommended patterns and opinionated workflows for Terminal Tasks Manager.

## Table of Contents

- [Philosophy](#philosophy)
- [Core Workflow](#core-workflow)
- [Multi-Project Setup](#multi-project-setup)
- [AI-Assisted Development](#ai-assisted-development)
- [Remote Development](#remote-development)
- [Team Workflows](#team-workflows)

## Philosophy

Terminal Tasks Manager is built around these principles:

1. **Terminals as First-Class Citizens** - Terminal sessions deserve the same organizational tools as files and folders
2. **Persistence Over Recreation** - Don't rebuild your environment; persist it with tmux
3. **Visual Organization** - Nested folders and tags beat flat lists
4. **One-Click Access** - Any terminal should be reachable in one click

## Core Workflow

### The Ideal Setup

```
Terminal Tasks Manager
├── Active Projects
│   ├── Project A (tmux)
│   ├── Project B (tmux)
│   └── Project C (tmux)
├── Background Services
│   ├── Database (tmux)
│   └── Message Queue (tmux)
└── Utilities
    ├── System Monitor
    └── Log Viewer
```

### Daily Flow

1. **Morning**: Click "Run All Terminals" to restore your environment
2. **During Work**: Click individual tasks as needed
3. **Context Switch**: Detach from current sessions (`Ctrl+B D`), run different project
4. **End of Day**: Close VS Code; tmux sessions persist

### Key Habits

- **Use tmux for anything long-running** - Builds, servers, watchers
- **Use regular terminals for quick commands** - Git operations, one-off scripts
- **Organize by project, not by tool** - "Project A" folder contains API, frontend, database tasks
- **Tag cross-cutting concerns** - Tag "database" tasks across projects for easy filtering

## Multi-Project Setup

### Monorepo Pattern

For monorepos with multiple packages:

```
Terminal Tasks Manager
├── Monorepo Root
│   └── Root Terminal (for top-level commands)
├── Packages
│   ├── @myorg/api
│   ├── @myorg/web
│   ├── @myorg/mobile
│   └── @myorg/shared
└── Infrastructure
    ├── Docker Compose
    └── Local Database
```

**Tips:**
- Each package gets its own tmux session
- Use `postCommands` to auto-start dev servers
- Root terminal for running monorepo-wide commands (lerna, turborepo)

### Microservices Pattern

For distributed microservices:

```
Terminal Tasks Manager
├── Services
│   ├── auth-service
│   ├── user-service
│   ├── order-service
│   └── notification-service
├── Infrastructure
│   ├── API Gateway
│   ├── Redis
│   └── PostgreSQL
└── Tools
    ├── Log Aggregator
    └── Service Mesh Dashboard
```

**Tips:**
- Color-code services by domain
- Use tags like "critical", "experimental"
- Create a "minimal" folder with just essential services

### Multi-Workspace Pattern

For completely separate projects:

```
Terminal Tasks Manager
├── Work
│   ├── Client Project A
│   └── Internal Tool
├── Personal
│   ├── Side Project
│   └── Learning
└── Open Source
    ├── Contribution 1
    └── My Library
```

**Tips:**
- Top-level folders by life domain
- Collapse inactive sections
- Use different tmux session prefixes per domain

## AI-Assisted Development

### Claude Code / Copilot Workflow

When using AI coding assistants:

```
Terminal Tasks Manager
├── Current Context
│   ├── Main Project (tmux)
│   └── Test Runner (tmux)
├── Reference Projects
│   ├── Similar Project 1
│   └── Documentation Site
└── Scratch
    └── Experiments
```

**The Pattern:**
1. Keep your main project terminal visible
2. AI assistant can see terminal output
3. Reference projects provide context without polluting main workspace

### Multi-Context Development

When working on interconnected systems:

```
Terminal Tasks Manager
├── Frontend (tmux)
│   └── [auto-runs: npm run dev]
├── Backend (tmux)
│   └── [auto-runs: npm run start:dev]
├── Shared Types
│   └── [auto-runs: npm run watch]
└── Test Suite
    └── [runs on demand]
```

**Benefits:**
- Full-stack visibility in terminal panel
- Instant context for AI assistants
- Hot-reload across the stack

## Remote Development

### SSH + tmux Workflow

For remote development machines:

**On Remote (via SSH):**
```bash
# Create persistent sessions
tmux new -s project-api
tmux new -s project-web
```

**In VS Code (later):**
1. Connect via Remote-SSH extension
2. Open Terminal Tasks Manager
3. See sessions under "Untracked Sessions"
4. Import as tasks for future use

### Mobile Development Workflow

When SSH'ing from mobile (Termux, etc.):

1. SSH to dev machine
2. Create/attach to tmux sessions
3. Do quick fixes or start long processes
4. Detach and disconnect

Later, in VS Code:
1. Sessions appear in "Untracked Sessions"
2. Attach to see results of long processes
3. Continue development with full IDE

### Devcontainer Workflow

For containerized development:

```
Terminal Tasks Manager
├── Container Shell (default profile)
├── Host Shell (WSL profile)
└── Docker Commands (bash profile)
```

**Note:** tmux inside containers may require additional setup.

## Team Workflows

### Shared Configuration

Share terminal-tasks.json with your team:

1. Add `.vscode/terminal-tasks.json` to version control
2. Use relative paths where possible
3. Use environment variables for user-specific paths:
   ```json
   "path": "${env:PROJECT_ROOT}/frontend"
   ```

### Onboarding Template

Create a starter configuration for new team members:

```json
{
  "version": "2.0.0",
  "items": [
    {
      "type": "folder",
      "name": "Getting Started",
      "children": [
        {
          "type": "task",
          "name": "Setup (run first)",
          "path": ".",
          "overrides": {
            "postCommands": ["./scripts/setup.sh"]
          }
        },
        {
          "type": "task",
          "name": "Dev Server",
          "path": ".",
          "profileId": "wsl-tmux"
        }
      ]
    }
  ]
}
```

### Documentation Tasks

Include documentation servers in your config:

```
Terminal Tasks Manager
├── Development
│   └── App Server
├── Documentation
│   ├── Storybook
│   ├── API Docs
│   └── Dev Wiki
└── Quality
    ├── Linting
    └── Type Check
```

## Anti-Patterns to Avoid

### Too Many Top-Level Tasks

**Bad:**
```
├── Task 1
├── Task 2
├── Task 3
├── ...
└── Task 47
```

**Good:**
```
├── Frontend
│   └── (tasks)
├── Backend
│   └── (tasks)
└── DevOps
    └── (tasks)
```

### Duplicate Sessions

**Bad:** Multiple tasks pointing to same directory with different names

**Good:** One task per directory; use tmux windows for multiple shells in same project

### Ignoring tmux

**Bad:** Using regular terminals for long-running processes

**Good:** Use tmux profile; detach instead of closing

### Over-Complicating postCommands

**Bad:**
```json
"postCommands": ["npm install", "npm run build", "npm run migrate", "npm run seed", "npm run dev"]
```

**Good:**
```json
"postCommands": ["npm run dev"]
```
(Put setup in a script or run manually when needed)

## Quick Tips

1. **Collapse what you're not using** - Keeps the view clean
2. **Use search for deep hierarchies** - `Ctrl+Shift+Alt+O`
3. **Color-code by purpose** - Red for production-related, blue for development
4. **Review monthly** - Delete tasks for abandoned projects
5. **Backup your config** - It's just JSON; version control it
