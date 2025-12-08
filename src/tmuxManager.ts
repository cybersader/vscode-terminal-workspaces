import * as vscode from 'vscode';
import { execSync } from 'child_process';

export interface TmuxSession {
    /** Session name */
    name: string;
    /** Working directory of the active pane */
    path: string;
    /** Number of windows in session */
    windowCount: number;
    /** Whether session is attached */
    attached: boolean;
    /** Creation timestamp */
    created: Date;
}

export class TmuxManager {
    /**
     * Check if tmux is available
     */
    static isAvailable(): boolean {
        try {
            if (this.isRemoteWSL()) {
                execSync('which tmux', { encoding: 'utf8', stdio: 'pipe' });
            } else if (process.platform === 'win32') {
                execSync('wsl.exe -e which tmux', { encoding: 'utf8', stdio: 'pipe' });
            } else {
                execSync('which tmux', { encoding: 'utf8', stdio: 'pipe' });
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get all tmux sessions with their working directories
     */
    static getSessions(): TmuxSession[] {
        try {
            // Format: session_name:pane_current_path:window_count:session_attached:session_created
            const format = '#{session_name}\t#{pane_current_path}\t#{session_windows}\t#{session_attached}\t#{session_created}';
            let output: string;

            if (this.isRemoteWSL()) {
                // Already in WSL
                output = execSync(`tmux list-sessions -F "${format}" 2>/dev/null || true`, {
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
            } else if (process.platform === 'win32') {
                // On Windows, run through WSL
                output = execSync(`wsl.exe -e bash -c "tmux list-sessions -F '${format}' 2>/dev/null || true"`, {
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
            } else {
                // Native Linux/macOS
                output = execSync(`tmux list-sessions -F "${format}" 2>/dev/null || true`, {
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
            }

            if (!output.trim()) {
                return [];
            }

            return output.trim().split('\n').map(line => {
                const [name, path, windowCount, attached, created] = line.split('\t');
                return {
                    name: name || 'unnamed',
                    path: path || '~',
                    windowCount: parseInt(windowCount) || 1,
                    attached: attached === '1',
                    created: new Date(parseInt(created) * 1000)
                };
            });
        } catch (error) {
            console.error('Failed to get tmux sessions:', error);
            return [];
        }
    }

    /**
     * Get sessions that aren't tracked as tasks
     */
    static getUntrackedSessions(trackedSessionNames: string[]): TmuxSession[] {
        const allSessions = this.getSessions();
        const trackedSet = new Set(trackedSessionNames.map(n => n.toLowerCase()));

        return allSessions.filter(session =>
            !trackedSet.has(session.name.toLowerCase())
        );
    }

    /**
     * Attach to a tmux session (returns command string)
     */
    static getAttachCommand(sessionName: string): string {
        return `tmux attach-session -t '${sessionName}'`;
    }

    /**
     * Convert WSL path to Windows path if needed
     */
    static normalizePathForDisplay(wslPath: string): string {
        // Convert /mnt/c/... to C:\... for display on Windows
        const mntMatch = wslPath.match(/^\/mnt\/([a-z])\/?(.*)/i);
        if (mntMatch) {
            const drive = mntMatch[1].toUpperCase();
            const subPath = mntMatch[2]?.replace(/\//g, '\\') || '';
            return `${drive}:\\${subPath}`;
        }
        return wslPath;
    }

    private static isRemoteWSL(): boolean {
        return vscode.env.remoteName === 'wsl';
    }
}
