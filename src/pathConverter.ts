/**
 * Handles path conversion between Windows and WSL formats
 */
export class PathConverter {
    /**
     * Convert a path based on the target template
     */
    convert(inputPath: string, template: string): string {
        switch (template) {
            case 'wsl-connected':
                return this.toWslPath(inputPath);
            case 'wsl-from-windows':
                return this.toWindowsPath(inputPath);
            case 'powershell':
                return this.toWindowsPath(inputPath);
            case 'bash':
                return this.toWslPath(inputPath);
            default:
                return inputPath;
        }
    }

    /**
     * Convert Windows path to WSL /mnt/c/ format
     * Examples:
     *   C:\Users\Name\Documents -> /mnt/c/Users/Name/Documents
     *   \\wsl$\Ubuntu\home\user -> /home/user
     *   /mnt/c/Users/Name -> /mnt/c/Users/Name (unchanged)
     */
    toWslPath(inputPath: string): string {
        // Already a WSL path
        if (inputPath.startsWith('/')) {
            return inputPath;
        }

        // Handle UNC path to WSL (\\wsl$\...)
        const wslUncMatch = inputPath.match(/^\\\\wsl\$\\([^\\]+)\\?(.*)/i);
        if (wslUncMatch) {
            const distro = wslUncMatch[1];
            const subPath = wslUncMatch[2]?.replace(/\\/g, '/') || '';
            return '/' + subPath;
        }

        // Handle Windows drive path (C:\...)
        const driveMatch = inputPath.match(/^([A-Za-z]):\\?(.*)/);
        if (driveMatch) {
            const drive = driveMatch[1].toLowerCase();
            const subPath = driveMatch[2]?.replace(/\\/g, '/') || '';
            return `/mnt/${drive}/${subPath}`;
        }

        // Handle Windows path without drive (relative or UNC)
        return inputPath.replace(/\\/g, '/');
    }

    /**
     * Convert WSL path to Windows format
     * Examples:
     *   /mnt/c/Users/Name/Documents -> C:\Users\Name\Documents
     *   /home/user/project -> \\wsl$\Ubuntu\home\user\project
     *   C:\Users\Name -> C:\Users\Name (unchanged)
     */
    toWindowsPath(inputPath: string): string {
        // Already a Windows path
        if (/^[A-Za-z]:/.test(inputPath) || inputPath.startsWith('\\\\')) {
            return inputPath;
        }

        // Handle /mnt/X/ paths
        const mntMatch = inputPath.match(/^\/mnt\/([a-z])\/?(.*)/i);
        if (mntMatch) {
            const drive = mntMatch[1].toUpperCase();
            const subPath = mntMatch[2]?.replace(/\//g, '\\') || '';
            return `${drive}:\\${subPath}`;
        }

        // Handle other WSL paths (assume default distro)
        if (inputPath.startsWith('/')) {
            const subPath = inputPath.replace(/\//g, '\\');
            return `\\\\wsl$\\Ubuntu${subPath}`;
        }

        return inputPath.replace(/\//g, '\\');
    }

    /**
     * Escape a path for use in shell commands
     * Handles spaces and special characters
     */
    escapeForShell(inputPath: string, shellType: 'bash' | 'cmd' | 'powershell' = 'bash'): string {
        switch (shellType) {
            case 'bash':
                // Single quotes are safest for bash, but we need to escape existing single quotes
                if (inputPath.includes("'")) {
                    return `'${inputPath.replace(/'/g, "'\\''")}'`;
                }
                return `'${inputPath}'`;

            case 'cmd':
                // Double quotes for cmd, escape existing double quotes
                return `"${inputPath.replace(/"/g, '""')}"`;

            case 'powershell':
                // Double quotes for PowerShell, escape with backtick
                return `"${inputPath.replace(/"/g, '`"')}"`;

            default:
                return inputPath;
        }
    }

    /**
     * Get the folder name from a path
     */
    getFolderName(inputPath: string): string {
        // Normalize to forward slashes
        const normalized = inputPath.replace(/\\/g, '/');
        // Remove trailing slash
        const trimmed = normalized.replace(/\/$/, '');
        // Get last segment
        const parts = trimmed.split('/');
        return parts[parts.length - 1] || 'Untitled';
    }
}
