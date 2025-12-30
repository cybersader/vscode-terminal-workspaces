import * as vscode from 'vscode';
import { execSync } from 'child_process';

export interface ZellijSession {
    /** Session name */
    name: string;
    /** Working directory (if available) */
    path?: string;
}

export class ZellijManager {
    /**
     * Check if zellij is available
     */
    static isAvailable(): boolean {
        try {
            if (this.isRemoteWSL()) {
                execSync('which zellij', { encoding: 'utf8', stdio: 'pipe' });
            } else if (process.platform === 'win32') {
                execSync('wsl.exe -e which zellij', { encoding: 'utf8', stdio: 'pipe' });
            } else {
                execSync('which zellij', { encoding: 'utf8', stdio: 'pipe' });
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get all zellij sessions
     * Note: Zellij's list-sessions output is simpler than tmux - just session names with ANSI colors
     */
    static getSessions(): ZellijSession[] {
        try {
            let output: string;

            if (this.isRemoteWSL()) {
                // Already in WSL
                output = execSync('zellij list-sessions 2>/dev/null || true', {
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
            } else if (process.platform === 'win32') {
                // On Windows, run through WSL
                output = execSync('wsl.exe -e bash -c "zellij list-sessions 2>/dev/null || true"', {
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
            } else {
                // Native Linux/macOS
                output = execSync('zellij list-sessions 2>/dev/null || true', {
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
            }

            if (!output.trim()) {
                return [];
            }

            // Strip ANSI color codes and parse session names
            // Zellij output format is typically: session_name (with optional ANSI colors)
            return output.trim().split('\n')
                .map(line => {
                    // Strip ANSI escape codes
                    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
                    // Zellij may show status info after session name, extract just the name
                    // Format can be: "session_name" or "session_name (EXITED - ...)"
                    const match = cleanLine.match(/^([^\s(]+)/);
                    const name = match ? match[1] : cleanLine;
                    if (!name) return null;
                    return {
                        name
                    };
                })
                .filter((s): s is ZellijSession => s !== null && s.name.length > 0);
        } catch (error) {
            console.error('Failed to get zellij sessions:', error);
            return [];
        }
    }

    /**
     * Get sessions that aren't tracked as tasks
     */
    static getUntrackedSessions(trackedSessionNames: string[]): ZellijSession[] {
        const allSessions = this.getSessions();
        const trackedSet = new Set(trackedSessionNames.map(n => n.toLowerCase()));

        return allSessions.filter(session =>
            !trackedSet.has(session.name.toLowerCase())
        );
    }

    /**
     * Get command to attach to a zellij session
     */
    static getAttachCommand(sessionName: string): string {
        return `zellij attach '${sessionName}'`;
    }

    /**
     * Get command to create a new zellij session
     */
    static getNewSessionCommand(sessionName: string): string {
        return `zellij -s '${sessionName}'`;
    }

    /**
     * Get command to attach or create a zellij session
     * Zellij doesn't have a direct equivalent to tmux's -A flag,
     * so we use a shell conditional
     */
    static getAttachOrCreateCommand(sessionName: string): string {
        return `zellij attach '${sessionName}' 2>/dev/null || zellij -s '${sessionName}'`;
    }

    /**
     * Get command to kill a zellij session
     */
    static getKillCommand(sessionName: string): string {
        return `zellij kill-session '${sessionName}'`;
    }

    private static isRemoteWSL(): boolean {
        return vscode.env.remoteName === 'wsl';
    }
}
