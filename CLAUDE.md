# CLAUDE.md - Terminal Workspaces Extension

## Project Identity

**Name**: Terminal Workspaces
**Type**: VS Code Extension (TypeScript)
**Purpose**: Visual terminal session management with sidebar GUI, supporting WSL, tmux, PowerShell, and multi-project workflows
**Target Users**: Developers working with multiple projects, especially AI-assisted development workflows

## Quick Context

This extension solves the problem of managing multiple terminal sessions across different project directories. Users can:
- Define terminal configurations visually via sidebar tree view
- Launch terminals with one click (no manual cd-ing)
- Organize tasks in nested folders
- Use tmux for persistent sessions (SSH-safe)
- Work with AI coding agents across multiple projects simultaneously

**Key Innovation**: Dual-config approach - rich `terminal-workspaces.json` generates simpler `tasks.json` for VS Code's task runner.

## Build & Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Lint
npm run lint

# Package extension
vsce package
```

## Architecture Overview

### File Structure
```
src/
├── extension.ts              # Entry point, command registration, activation
├── configManager.ts          # CRUD for terminal-workspaces.json, tasks.json generation
├── terminalWorkspacesProvider.ts  # Tree view UI, dialogs, tmux/zellij session display
├── tmuxManager.ts            # tmux detection, session management
├── zellijManager.ts          # Zellij detection, session management
├── types.ts                  # TypeScript interfaces (discriminated unions)
└── pathConverter.ts          # WSL <-> Windows path conversion
```

### Core Data Model

**Discriminated Union Pattern**:
- `TaskItem = TerminalTaskItem | TaskFolder`
- `type: 'task' | 'folder'` enables type-safe operations

**Configuration Files**:
- `.vscode/terminal-workspaces.json` - Rich config (profiles, folders, overrides)
- `.vscode/tasks.json` - Generated flat task list for VS Code runner

### Key Design Decisions

1. **Why two config files?** - terminal-workspaces.json supports nested folders/profiles; tasks.json is VS Code's limited but well-tested format
2. **Why shell commands for tmux?** - Cross-platform (WSL/Linux/macOS), no Node.js bindings needed, debuggable
3. **Why discriminated unions?** - Type safety, exhaustive pattern matching, clear data structures

## Development Conventions

### Code Style
- TypeScript with strict type checking
- Discriminated unions for polymorphic data (`type` field)
- Async/await for file I/O and VS Code APIs
- Helper functions at bottom of extension.ts (getAllTasks, getAllTaskNames)

### Naming Patterns
- Commands: `terminalWorkspaces.<action>` (e.g., `terminalWorkspaces.runTask`)
- Tree item context values: `terminalTask`, `terminalTaskTmuxActive`, `taskFolderWithChildren`, `tmuxSession`
- Interfaces: PascalCase with descriptive suffixes (`TerminalTaskItem`, `TaskFolder`)

### File Modification Rules

| File | Responsibility | Notes |
|------|----------------|-------|
| `extension.ts` | Command handlers, wiring | Register commands, handle execution logic |
| `configManager.ts` | File I/O | All reads/writes for terminal-workspaces.json and tasks.json |
| `terminalWorkspacesProvider.ts` | UI only | Tree view, dialogs, pickers |
| `tmuxManager.ts` | tmux integration | Stable - avoid modifications unless necessary |
| `types.ts` | Data model | Add interfaces here, maintain BUILTIN_PROFILES and DEFAULT_CONFIG |

### Critical Patterns

1. **Command registration**: Always add to `context.subscriptions` in activate()
2. **Config changes**: Always call `treeDataProvider.refresh()` after mutations
3. **Path handling**: Use pathConverter.ts for WSL<->Windows conversion
4. **Terminal naming**: Tasks run via `runTaskDirectly` use raw task.name; attached sessions use `tmux: ${sanitizedName}`
5. **Menu visibility**: Use explicit contextValue matches in package.json (`viewItem == terminalTask || viewItem == terminalTaskTmuxActive`)

### Git Commit Rules

**NEVER include in commit messages:**
- "Generated with Claude Code" or similar AI attribution
- "Co-Authored-By: Claude" or any AI co-author lines
- Emojis (unless explicitly requested)
- Any AI tool branding or links

Commit messages should be clean and professional, attributable solely to the human developer.

## Common Tasks

### Release Process

When publishing a new version:
1. Update version in `package.json`
2. Add entry to `changelog.md` with date and categorized changes (Fixed/Added/Changed)
3. Update version history summary table at bottom of changelog
4. Compile: `npm run compile`
5. Commit with message: `v0.X.X: Brief description`
6. Push to GitHub
7. Package: `vsce package`
8. Publish: `vsce publish` (or upload .vsix manually to Marketplace)

**WSL Note:** `vsce publish` may fail with auth errors in WSL. Run from PowerShell instead:
```powershell
cd "C:\Users\Cybersader\Documents\1 Projects, Workspaces\mcp-workflow-and-tech-stack\tools\terminal-workspaces"
vsce publish
```

### Adding a New Command

1. Define command in package.json `contributes.commands`
2. Add menu binding in package.json `contributes.menus`
3. Register handler in extension.ts activate()
4. Add to context.subscriptions
5. Update README.md and docs/user-guide.md
6. Add to changelog.md under appropriate version

### Adding a New Profile Type

1. Add to `ShellType` union in types.ts
2. Add to `BUILTIN_PROFILES` if built-in
3. Update `ConfigManager.generateCommand()` for shell-specific logic
4. Document in docs/configuration.md

### Modifying Config Schema

1. Update interfaces in types.ts
2. Update DEFAULT_CONFIG
3. Increment version in DEFAULT_CONFIG
4. Add migration logic in ConfigManager.loadConfig() if needed
5. Regenerate tasks.json format if needed

### Fixing Terminal State Issues

Terminal active status is checked in `isTerminalActive()` in terminalWorkspacesProvider.ts:
- Takes raw taskName AND optional sanitizedTmuxName
- Checks VS Code terminal list for multiple naming patterns
- Sanitized name = `taskName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)`

## Testing Guidance

### CRITICAL: WSL vs Windows Mode Debugging

**The extension only loads in ONE extension host.** When you press F5, the Extension Development Host runs in the same mode as your main VS Code window.

| To Test This Mode | How to Start VS Code |
|-------------------|---------------------|
| **WSL Remote** | `code .` from WSL terminal |
| **Windows Local** | Open VS Code from Windows Start Menu, open Windows path |

**Common Mistake:** Starting in WSL mode, then clicking "Show Local" in Extension Development Host. The extension WON'T reload - close VS Code completely and reopen in the target mode.

See `dev-docs/building.md` for full testing instructions.

### Manual Testing Checklist
- [ ] Add task via Explorer context menu
- [ ] Add task via sidebar + button
- [ ] Run single task, folder of tasks, all tasks
- [ ] Edit task (path, profile, overrides)
- [ ] Delete task and folder (with confirmation)
- [ ] Move task to folder
- [ ] Create nested folder structure
- [ ] Import tmux session
- [ ] Import zellij session
- [ ] Kill tmux session (verify green indicator clears)
- [ ] Kill zellij session (verify green indicator clears)
- [ ] Terminal location: panel vs editor
- [ ] Hover/inline buttons appear for both active and inactive tasks
- [ ] **Test in BOTH WSL Remote and Windows Local modes**

### Edge Cases
- Empty workspace (no .vscode folder)
- Invalid terminal-workspaces.json (malformed JSON)
- Path doesn't exist (with experimentalPathValidation on/off)
- WSL path conversion (Windows host, WSL target)
- tmux/zellij not available (non-WSL/Linux environment)
- tmux/zellij installed to `~/.local/bin/` (won't work in Windows Local mode)
- Name collision when importing tmux/zellij session

### VS Code API Gotchas
- Terminal CWD not exposed directly (use browse/workspace folders)
- TreeDataProvider.getChildren() is async (await config operations)
- FileSystemWatcher fires for external changes (handle config reloads)
- Terminal.dispose() closes VS Code terminal, not underlying tmux session
- Tree item caching: refresh() fires onDidChangeTreeData to force re-render

## Dependencies

### Production
- `vscode` ^1.85.0 (extension API)

### Development
- TypeScript 5.3.0
- ESLint + TypeScript ESLint plugin
- @types/node, @types/vscode

**No npm production dependencies** - Only VS Code API and Node.js built-ins.

## Key Files to Read First

When onboarding to this codebase:
1. **types.ts** - Understand the data model (15 min)
2. **dev-docs/architecture.md** - Data flow and design decisions (10 min)
3. **extension.ts** lines 113-600 - Command patterns and execution (20 min)
4. **configManager.ts** - Config CRUD and tasks.json generation (15 min)

## AI Agent Collaboration Notes

### When Working with Claude Code / AI Agents

**Good Prompts**:
- "Add a command to export all tasks to a shareable JSON file"
- "Make the tree view show task counts for each folder"
- "Add validation to prevent duplicate task names"

**Provide Context**:
- Point to types.ts when asking about data structures
- Reference dev-docs/architecture.md for "why" questions
- Mention which command you're extending (include existing command name)

**Watch Out For**:
- Don't break discriminated union pattern (always include `type` field)
- Don't add npm dependencies without discussion (extension is dependency-free)
- Don't modify BUILTIN_PROFILES without version migration logic
- Terminal names differ: raw taskName vs `tmux: ${sanitizedName}` - check both when detecting active state

### Known Complexities

1. **Terminal name matching** - Tasks can be named with spaces/special chars, but tmux sessions are sanitized. Check both patterns.
2. **WSL vs Windows paths** - Use pathConverter.ts; /mnt/c/... <-> C:\...
3. **Context menu visibility** - Uses `viewItem` matching in package.json; use explicit OR conditions not regex
4. **Refresh timing** - Add small delay (200ms) after terminal.dispose() before refresh to let VS Code update terminal list

## Related Documentation

- [User Guide](docs/user-guide.md) - End-user features
- [Architecture](dev-docs/architecture.md) - Technical deep dive
- [Configuration](docs/configuration.md) - Settings and profiles
- [tmux Integration](docs/tmux-integration.md) - Working with tmux
- [Contributing](dev-docs/contributing.md) - Contribution workflow
- [AI Agent Workflows](docs/ai-agent-workflows.md) - Using with AI coding tools

## Future Ideas / Roadmap

### Potential Features (not committed)

1. **Multiplexer-specific indicator colors** - Instead of state-based colors (green/yellow/grey), use multiplexer-based colors:
   - Zellij: Blue shades (bright=active, dim=background, grey=inactive)
   - tmux: Yellow shades (bright=active, dim=background, grey=inactive)
   - Pro: Visual distinction of which multiplexer at a glance
   - Con: More complex, loses universal green=active meaning
   - Decision: Kept state-based for simplicity; revisit if users request

2. **Sidebar organization options** - More control over workspace ordering:
   - Choose root task position (above/below folders)
   - Custom folder ordering
   - Drag-and-drop reordering

3. **Session templates** - Save/restore window layouts within tmux/zellij sessions
