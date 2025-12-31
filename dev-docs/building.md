# Building & Testing

Instructions for building, testing, and packaging Terminal Workspaces.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Build](#development-build)
- [Testing](#testing)
- [Packaging](#packaging)
- [Publishing](#publishing)
- [CI/CD](#cicd)

## Prerequisites

### Required

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **VS Code** 1.85 or higher
- **Git**

### Optional (for full testing)

- **WSL** (Windows Subsystem for Linux) - for WSL features
- **tmux** - for tmux integration features

### Check Versions

```bash
node --version    # Should be 18+
npm --version     # Should be 9+
code --version    # Should be 1.85+
```

## Development Build

### Initial Setup

```bash
# Clone repository
git clone https://github.com/cybersader/vscode-terminal-workspaces.git
cd vscode-terminal-workspaces

# Install dependencies
npm install
```

### Compile

```bash
# One-time compile
npm run compile

# Watch mode (recommended during development)
npm run watch
```

### Run in Development

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. A new VS Code window opens with the extension loaded
4. Make changes, then `Ctrl+R` in the dev window to reload

### Lint

```bash
npm run lint
```

## Testing

### CRITICAL: WSL vs Windows Mode Debugging

**This is the most important thing to understand when debugging this extension.**

When you press F5 to debug, the Extension Development Host runs in the **same mode** as your main VS Code window:

| Main Window Mode | Extension Development Host Mode | tmux/zellij Detection |
|------------------|--------------------------------|----------------------|
| WSL Remote | WSL Remote | Direct Linux commands |
| Windows (Local) | Windows (Local) | Via `wsl.exe` |

**The extension only loads in ONE extension host.** If you start debugging in WSL mode and then switch to Windows mode inside the Extension Development Host (via "Show Local" or "Reopen Folder Locally"), the extension **will not reload** in the new mode.

#### To Test in WSL Remote Mode

1. Open VS Code from WSL terminal: `code .` (from a WSL path)
2. Or use "Remote-WSL: New Window" command
3. Open the terminal-workspaces project folder
4. Press F5 to debug
5. Extension Development Host will be in WSL mode

#### To Test in Windows Mode

1. **Close all VS Code windows**
2. Open VS Code from **Windows Start Menu** (NOT from WSL terminal)
3. File → Open Folder → navigate using Windows path:
   ```
   C:\Users\YourName\path\to\terminal-workspaces
   ```
4. Press F5 to debug
5. Extension Development Host will be in Windows mode

**Quick Windows mode from PowerShell:**
```powershell
cd "C:\Users\Cybersader\Documents\path\to\terminal-workspaces"
code .
# Then press F5 in VS Code
```

#### Common Mistakes

❌ **Don't:** Start in WSL, then click "Show Local" in Extension Development Host
- The extension won't reload in Windows mode
- tmux/zellij detection will fail silently

✅ **Do:** Close VS Code completely and reopen in the target mode FIRST

### Manual Testing Checklist

#### Core Features

- [ ] Add task from Explorer folder context menu
- [ ] Add task from file context menu
- [ ] Add task from terminal context menu
- [ ] Add task from sidebar button
- [ ] Browse for folder dialog works
- [ ] Create organizational folder
- [ ] Rename task
- [ ] Rename folder
- [ ] Delete task
- [ ] Delete folder with children (shows warning)
- [ ] Move task to folder
- [ ] Move task to root
- [ ] Edit task settings
- [ ] Run single task
- [ ] Run all tasks in folder
- [ ] Run all tasks
- [ ] Search and filter tasks
- [ ] Keyboard shortcuts work

#### Profile Testing

- [ ] WSL default profile creates correct terminal
- [ ] WSL tmux profile attaches/creates sessions
- [ ] WSL zellij profile attaches/creates sessions
- [ ] PowerShell profile works (Windows only)
- [ ] CMD profile works (Windows only)
- [ ] Bash profile works (Linux/macOS)
- [ ] Default profile uses VS Code's default

#### tmux Features

- [ ] tmux sessions listed under "Untracked Sessions (tmux)"
- [ ] Attach to untracked session via button
- [ ] Attach to untracked session via context menu
- [ ] Import session as task
- [ ] Import all sessions
- [ ] Attach all sessions
- [ ] Kill session
- [ ] Refresh sessions list
- [ ] Click-to-attach setting respected

#### Zellij Features

- [ ] Zellij sessions listed under "Untracked Sessions (zellij)"
- [ ] Attach to untracked session via button
- [ ] Attach to untracked session via context menu
- [ ] Import session as task
- [ ] Import all sessions
- [ ] Attach all sessions
- [ ] Kill session
- [ ] Refresh sessions list

#### Settings

- [ ] Default profile setting works
- [ ] Auto-generate tasks.json works
- [ ] Group task label setting works
- [ ] Create group task toggle works
- [ ] Click-to-attach setting works
- [ ] Experimental path validation works

#### Edge Cases

- [ ] Empty state shows welcome message
- [ ] Very long task names display correctly
- [ ] Paths with spaces work
- [ ] Special characters in paths work
- [ ] Unicode in task names works
- [ ] Deep folder nesting works

### Testing Environments

**You must test in BOTH WSL and Windows modes separately!**

| Environment | How to Enter | What to Test |
|-------------|--------------|--------------|
| Windows (native VS Code) | Open VS Code from Start Menu, open Windows path | WSL launching via `wsl.exe`, path conversion, tmux/zellij detection via WSL |
| Windows (Remote-WSL) | `code .` from WSL terminal | Native WSL paths, direct tmux/zellij detection |
| Linux | Native VS Code | Native bash, tmux/zellij |
| macOS | Native VS Code | Native bash, tmux |

### tmux/Zellij Requirements

Both tmux and Zellij are **Linux-only** tools. On Windows, they run inside WSL and the extension detects them via `wsl.exe`.

**Critical PATH requirement:** Tools must be installed to a system-wide location (`/usr/bin/` or `/usr/local/bin/`), NOT `~/.local/bin/`.

Why? When VS Code runs `wsl.exe -e which zellij`, it uses a non-interactive shell that doesn't load `~/.bashrc`, so `~/.local/bin/` isn't in PATH.

| Install Location | Works in WSL Mode | Works in Windows Mode |
|------------------|-------------------|----------------------|
| `/usr/bin/` (apt install) | ✅ | ✅ |
| `/usr/local/bin/` | ✅ | ✅ |
| `~/.local/bin/` | ✅ | ❌ |
| `~/.cargo/bin/` | ✅ | ❌ |

**Installing tmux (system-wide):**
```bash
sudo apt install tmux
```

**Installing Zellij (system-wide):**
```bash
# Download and install to /usr/local/bin/
curl -L https://github.com/zellij-org/zellij/releases/latest/download/zellij-x86_64-unknown-linux-musl.tar.gz | tar xz
sudo mv zellij /usr/local/bin/
```

### Creating Test Fixtures

```bash
# Create test workspace
mkdir -p ~/ttm-test/.vscode
cd ~/ttm-test

# Create some test folders
mkdir -p project-a project-b project-c
mkdir -p deep/nested/folder/structure

# Create test tmux sessions
tmux new -d -s test-session-1
tmux new -d -s test-session-2

# Create test zellij sessions
zellij -s test-zellij-1 &
sleep 1
zellij -s test-zellij-2 &
sleep 1

# Verify sessions exist
tmux list-sessions
zellij list-sessions
```

## Packaging

### Create VSIX Package

```bash
# Install vsce if not installed
npm install -g @vscode/vsce

# Package the extension
vsce package
```

This creates a `.vsix` file like `terminal-workspaces-0.2.0.vsix`.

### Install VSIX Locally

```bash
code --install-extension terminal-workspaces-0.2.0.vsix
```

Or in VS Code: Extensions → `...` menu → "Install from VSIX..."

### Pre-Package Checklist

- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] README.md is current
- [ ] No console.log statements in production code
- [ ] All dependencies are in `dependencies` (not `devDependencies`) if needed at runtime
- [ ] `.vscodeignore` excludes unnecessary files

## Publishing

### First-Time Setup

1. Create Azure DevOps organization at https://dev.azure.com
2. Create Personal Access Token (PAT) with "Marketplace (Manage)" scope
3. Create publisher at https://marketplace.visualstudio.com/manage

```bash
# Login to vsce
vsce login <publisher-name>
# Enter your PAT when prompted
```

### Publish to Marketplace

```bash
# Publish (creates package and publishes)
vsce publish

# Or specify version bump
vsce publish minor  # 0.2.0 -> 0.3.0
vsce publish patch  # 0.2.0 -> 0.2.1
```

### Publish Checklist

- [ ] Version number is correct
- [ ] CHANGELOG has entry for this version
- [ ] README looks good on marketplace
- [ ] Icon displays correctly
- [ ] All links work
- [ ] Extension works when installed from marketplace

### Post-Publish

1. Verify on marketplace: https://marketplace.visualstudio.com/items?itemName=cybersader.terminal-workspaces
2. Test fresh install from marketplace
3. Create GitHub release with VSIX attached
4. Announce update (if significant)

## CI/CD

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Compile
        run: npm run compile

      - name: Package
        run: |
          npm install -g @vscode/vsce
          vsce package

      - name: Upload VSIX
        uses: actions/upload-artifact@v4
        with:
          name: vsix
          path: '*.vsix'
```

### Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Package
        run: |
          npm install -g @vscode/vsce
          vsce package

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: '*.vsix'
          generate_release_notes: true
```

## Troubleshooting

### Build Errors

**"Cannot find module 'vscode'"**
```bash
npm install
```

**TypeScript errors**
```bash
npm run compile 2>&1 | head -50  # See first errors
```

### Packaging Errors

**"Missing repository"**

Add to `package.json`:
```json
"repository": {
  "type": "git",
  "url": "https://github.com/cybersader/vscode-terminal-workspaces"
}
```

**"Missing license"**

Add to `package.json`:
```json
"license": "MIT"
```

### Publishing Errors

**"Unauthorized"**
- Check PAT has "Marketplace (Manage)" scope
- PAT may have expired
- Publisher name must match

**"Invalid publisher"**
- Create publisher at marketplace.visualstudio.com/manage
- Use exact publisher name in `package.json`
