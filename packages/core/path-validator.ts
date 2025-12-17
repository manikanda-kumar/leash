import { resolve, relative } from "path";
import { homedir } from "os";
import { realpathSync, lstatSync } from "fs";

export class PathValidator {
  constructor(private workingDirectory: string) {}

  /** Expand ~ and environment variables in path */
  private expand(path: string): string {
    return path
      .replace(/^~(?=\/|$)/, homedir())
      .replace(/\$\{?(\w+)\}?/g, (_, name) => {
        if (name === "HOME") return homedir();
        if (name === "PWD") return this.workingDirectory;
        return process.env[name] || "";
      });
  }

  /** Resolve path following symlinks */
  private resolveReal(path: string): string {
    const expanded = this.expand(path);
    const resolved = resolve(this.workingDirectory, expanded);

    try {
      const stats = lstatSync(resolved);
      if (stats.isSymbolicLink()) {
        return realpathSync(resolved);
      }
    } catch {
      // Path doesn't exist yet, use resolved path
    }

    return resolved;
  }

  /** Check if path is within working directory */
  isWithinWorkingDir(path: string): boolean {
    try {
      const realPath = this.resolveReal(path);
      const realWorkDir = realpathSync(this.workingDirectory);

      if (realPath === realWorkDir) {
        return true;
      }

      const rel = relative(realWorkDir, realPath);
      return !!rel && !rel.startsWith("..") && !rel.startsWith("/");
    } catch {
      return false;
    }
  }
}
