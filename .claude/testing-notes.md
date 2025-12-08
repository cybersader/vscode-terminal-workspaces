# Testing Notes

Personal testing notes and environment-specific configurations.

> **Note**: This file is for local development reference and contains environment-specific details that shouldn't be committed to the public repository.

## My Testing Environment

### Setup

- Windows 11 with WSL2 (Ubuntu)
- VS Code with Remote-WSL extension
- tmux installed in WSL
- Multiple test workspaces

### Test Workspaces

Create test workspaces in non-personal directories:

```bash
# Create generic test folders
mkdir -p ~/dev-test/project-a
mkdir -p ~/dev-test/project-b
mkdir -p ~/dev-test/deep/nested/path
```

## Testing Scenarios

### Scenario 1: Fresh Install

1. Uninstall extension
2. Delete any existing `.vscode/terminal-workspaces.json`
3. Install from VSIX
4. Verify empty state appears
5. Add first task

### Scenario 2: WSL Path Handling

Test paths like:
- `/mnt/c/Users/TestUser/Projects/test` (WSL path)
- `C:\Users\TestUser\Projects\test` (Windows path)
- `/home/user/projects/test` (Native Linux path)

### Scenario 3: tmux Session Discovery

```bash
# Create test sessions
tmux new -d -s test-discover-1 -c ~/dev-test/project-a
tmux new -d -s test-discover-2 -c ~/dev-test/project-b

# Verify they appear in "Untracked Sessions"
# Test attach functionality
# Test import as task

# Cleanup
tmux kill-session -t test-discover-1
tmux kill-session -t test-discover-2
```

### Scenario 4: Path Validation (Experimental)

1. Enable `experimentalPathValidation` setting
2. Create task with valid path
3. Delete or rename the folder
4. Try to run the task
5. Verify prompt appears
6. Test "Browse for New Path"
7. Test "Run Anyway"
8. Test "Cancel"

## Known Issues to Watch

### Issue: Path with Spaces

Paths with spaces can cause issues in shell commands. Test:
- `/mnt/c/Users/Test User/My Projects/test`

### Issue: tmux Session Names

Session names with special characters may not work:
- Test: `my-session` (valid)
- Test: `my_session` (valid)
- Test: `my session` (may fail)
- Test: `my.session` (valid but unusual)

### Issue: Very Long Paths

Test display truncation with long paths:
- `/mnt/c/Users/Username/Documents/Projects/Category/Subcategory/Project/Module/Submodule`

## Performance Testing

### Large Number of Tasks

Create config with 50+ tasks to verify:
- Tree view renders quickly
- Search/filter remains responsive
- Scrolling is smooth

```bash
# Generate test config (run in node)
node -e "
const tasks = [];
for (let i = 0; i < 50; i++) {
  tasks.push({
    type: 'task',
    id: 'task-' + i,
    name: 'Test Task ' + i,
    path: '/tmp/test-' + i
  });
}
console.log(JSON.stringify({ version: '2.0.0', items: tasks }, null, 2));
" > .vscode/terminal-workspaces.json
```

### Deeply Nested Folders

Test 5+ levels of folder nesting:
- Performance impact
- UI usability
- Move operations

## Debugging Tips

### Enable Verbose Logging

Add to extension code temporarily:

```typescript
console.log('[TTM Debug]', variableName);
```

View in Output panel → "Extension Host"

### Inspect Tree Items

```typescript
console.log('[TTM Tree Item]', JSON.stringify(element.itemData, null, 2));
```

### Track Config Changes

```typescript
console.log('[TTM Config]', JSON.stringify(this.config, null, 2));
```

## Regression Checklist

Before each release, verify:

- [ ] Basic CRUD operations
- [ ] All profiles work
- [ ] tmux discovery works
- [ ] Search works
- [ ] All keyboard shortcuts work
- [ ] Context menus appear correctly
- [ ] Settings are respected
- [ ] No console errors in production

## Environment-Specific Notes

### Windows Native

- `wsl.exe` must be in PATH
- Test both with and without WSL installed
- PowerShell and CMD profiles should work without WSL

### Remote-WSL

- Extension runs inside WSL
- tmux commands work directly
- No `wsl.exe` needed
- Test path handling for mounted drives

### Linux Native

- No WSL-specific code paths
- tmux should work if installed
- Test default profile behavior

### macOS

- Similar to Linux
- tmux via Homebrew
- Test Terminal.app integration
