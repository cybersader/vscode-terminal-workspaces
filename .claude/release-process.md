# Release Process

Checklist and steps for publishing new versions of Terminal Workspaces.

## Pre-Release Checklist

- [ ] All changes committed and pushed to GitHub
- [ ] CHANGELOG.md updated with new version section
- [ ] package.json version matches what you're about to publish
- [ ] `npm run compile` succeeds with no errors
- [ ] `vsce package` succeeds (creates .vsix file)
- [ ] Test the .vsix locally if major changes

## Version Sync Gotcha

**IMPORTANT**: The marketplace and GitHub badges pull from different sources:

- **Marketplace badge** - pulls from VS Code Marketplace (updates after `vsce publish`)
- **GitHub repo** - shows whatever is in `package.json` on main branch

**If badges look wrong:**
1. Make sure `package.json` version matches what's published
2. Shields.io caches badges for ~5 minutes
3. After `vsce publish`, wait a few minutes then hard-refresh GitHub

## Publishing Steps

### 1. Update Version

Either manually edit `package.json` or use vsce:

```bash
# Auto-bump and publish in one command
vsce publish patch   # 0.2.1 → 0.2.2
vsce publish minor   # 0.2.1 → 0.3.0
vsce publish major   # 0.2.1 → 1.0.0

# Or manually bump then publish
# Edit package.json version
vsce publish
```

### 2. Update CHANGELOG

Add entry at top of CHANGELOG.md:

```markdown
## [0.2.2] - 2024-XX-XX

### Added
- New feature

### Changed
- Updated thing

### Fixed
- Bug fix
```

### 3. Commit and Push

```bash
git add -A
git commit -m "Release v0.2.2"
git push
```

### 4. Create GitHub Release (Optional)

```bash
gh release create v0.2.2 --title "v0.2.2" --notes "See CHANGELOG.md"
```

## Credentials

### vsce Login

If your PAT expires:

1. Go to https://dev.azure.com → User Settings → Personal access tokens
2. Create new token:
   - **Organization**: All accessible organizations
   - **Scopes**: Marketplace → Manage, Member Entitlement Management → Read
3. Run `vsce login cybersader` and paste token

### Publisher

Publisher must exist at https://marketplace.visualstudio.com/manage

Publisher ID in package.json must match: `"publisher": "cybersader"`

## Common Issues

### "Publisher doesn't exist"
Create publisher at https://marketplace.visualstudio.com/manage/createpublisher

### "Icon must be at least 128x128"
Icon must be PNG, minimum 128x128px, referenced correctly in package.json

### Badge shows wrong version
- Shields.io caches for ~5 min
- Hard refresh GitHub page
- Check that package.json version is committed and pushed

### PAT permission error
Ensure PAT has:
- Organization: "All accessible organizations"
- Marketplace → Manage
- Member Entitlement Management → Read

## Quick Release Script

For routine releases:

```bash
# From project root
npm run compile && vsce publish patch && git add -A && git commit -m "Release $(node -p "require('./package.json').version")" && git push
```
