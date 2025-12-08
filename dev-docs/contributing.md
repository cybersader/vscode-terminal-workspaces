# Contributing

Guidelines for contributing to Terminal Workspaces.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Feature Requests](#feature-requests)

## Getting Started

### Prerequisites

- Node.js 18+
- VS Code 1.85+
- Git
- (Optional) WSL for testing WSL features
- (Optional) tmux for testing tmux features

### Quick Start

```bash
# Clone the repository
git clone https://github.com/cybersader/vscode-terminal-workspaces.git
cd vscode-terminal-workspaces

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Open in VS Code
code .
```

### Running the Extension

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. The extension will be active in the new VS Code window

## Development Setup

### Project Structure

```
src/
├── extension.ts           # Entry point
├── configManager.ts       # Config file management
├── terminalTasksProvider.ts  # Tree view and dialogs
├── tmuxManager.ts         # tmux integration
└── types.ts              # Type definitions
```

### Build Commands

```bash
# Compile TypeScript
npm run compile

# Watch mode (recompile on changes)
npm run watch

# Lint
npm run lint
```

### Debugging

1. Set breakpoints in TypeScript files
2. Press `F5` to start debugging
3. Use Debug Console for output
4. Reload Extension Development Host (`Ctrl+R`) to test changes

### Testing Changes

Since this extension modifies `tasks.json`, test in a dedicated workspace:

1. Create a test folder with `.vscode/` directory
2. Add some folders to test with
3. Test all CRUD operations
4. Test tmux features if tmux is available

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over callbacks
- Add JSDoc comments for public APIs
- Use descriptive variable names

### File Organization

- One class per file (when practical)
- Group related functions together
- Export types from `types.ts`
- Keep `extension.ts` focused on command registration

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `ConfigManager` |
| Functions | camelCase | `loadConfig` |
| Variables | camelCase | `taskItem` |
| Constants | UPPER_SNAKE | `BUILTIN_PROFILES` |
| Interfaces | PascalCase | `TerminalTaskItem` |
| Type aliases | PascalCase | `TaskItem` |

### Error Handling

```typescript
// Good: Specific error messages
try {
  await fs.promises.readFile(configPath);
} catch (error) {
  vscode.window.showErrorMessage(`Failed to load config: ${error}`);
}

// Bad: Silent failures
try {
  await fs.promises.readFile(configPath);
} catch {
  // Nothing
}
```

### VS Code API Usage

```typescript
// Good: Use VS Code APIs consistently
const config = vscode.workspace.getConfiguration('terminalWorkspaces');
const value = config.get<boolean>('settingName', defaultValue);

// Bad: Direct settings access
const value = vscode.workspace.getConfiguration().get('terminalWorkspaces.settingName');
```

## Pull Request Process

### Before Submitting

1. **Test thoroughly** - Run the extension and test affected features
2. **Update documentation** - If you change behavior, update docs
3. **Follow code style** - Run `npm run lint` and fix issues
4. **Write clear commit messages** - Describe what and why

### PR Title Format

```
type: brief description

Examples:
feat: add folder color customization
fix: handle missing tmux sessions gracefully
docs: update configuration examples
refactor: simplify profile loading
```

### PR Description Template

```markdown
## Summary
Brief description of changes.

## Changes
- Change 1
- Change 2

## Testing
How did you test these changes?

## Screenshots (if applicable)
Before/after screenshots for UI changes.
```

### Review Process

1. Create PR against `main` branch
2. Automated checks run (lint, compile)
3. Maintainer reviews code
4. Address feedback
5. Maintainer merges when approved

## Issue Guidelines

### Bug Reports

Use this template:

```markdown
## Description
What happened?

## Expected Behavior
What should have happened?

## Steps to Reproduce
1. Step one
2. Step two
3. ...

## Environment
- VS Code version:
- Extension version:
- OS:
- WSL (if applicable):
- tmux version (if applicable):

## Additional Context
Logs, screenshots, etc.
```

### Where to Find Logs

1. Open Output panel (`Ctrl+Shift+U`)
2. Select "Terminal Workspaces" from dropdown
3. Copy relevant log entries

## Feature Requests

### What Makes a Good Feature Request

- **Specific use case** - What problem does it solve?
- **Proposed solution** - How should it work?
- **Alternatives considered** - What else could work?
- **Scope** - Is it a small enhancement or major feature?

### Feature Request Template

```markdown
## Use Case
Describe the problem or workflow improvement.

## Proposed Solution
How should the feature work?

## Alternatives
What other approaches could solve this?

## Additional Context
Mockups, similar features in other tools, etc.
```

### Feature Priorities

Features are prioritized by:
1. Impact on core workflow
2. Number of users affected
3. Implementation complexity
4. Alignment with project goals

## Development Tips

### Quick Iteration

1. Use `npm run watch` for auto-compilation
2. Press `Ctrl+R` in Extension Development Host to reload
3. Check Output panel for errors

### Testing tmux Features

```bash
# Create test sessions
tmux new -d -s test-session-1
tmux new -d -s test-session-2

# List sessions
tmux list-sessions

# Clean up
tmux kill-server
```

### Testing WSL Features

- Open VS Code in Windows (not Remote-WSL)
- Test path conversion logic
- Verify `wsl.exe` commands work

### Debugging Tree View

Add console.log statements:

```typescript
console.log('Tree item:', element);
console.log('Item data:', element.itemData);
```

View output in Debug Console when running via `F5`.

## Questions?

- Open a GitHub issue for bugs or features
- Start a discussion for general questions
- Check existing issues before creating new ones
