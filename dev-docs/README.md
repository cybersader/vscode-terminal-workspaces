# Developer Documentation

Documentation for contributors and developers.

## Contents

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | Codebase overview and design |
| [Contributing](contributing.md) | How to contribute |
| [Building](building.md) | Build, test, and publish instructions |

## Quick Start for Contributors

```bash
# Clone and setup
git clone https://github.com/cybersader/vscode-terminal-tasks-manager.git
cd vscode-terminal-tasks-manager
npm install

# Development
npm run watch  # Auto-compile on changes
# Press F5 in VS Code to launch Extension Development Host

# Before committing
npm run lint
npm run compile
```

## Project Structure

```
src/
├── extension.ts           # Entry point
├── configManager.ts       # Config file handling
├── terminalTasksProvider.ts  # Tree view UI
├── tmuxManager.ts         # tmux integration
└── types.ts              # Type definitions
```

## Useful Links

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Tree View Guide](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
