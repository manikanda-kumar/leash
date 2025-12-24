import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

function getVersion(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  // dist/platform (bundled) -> 2 levels up
  // packages/core/lib (source) -> 3 levels up
  const candidates = [
    join(__dirname, "..", "..", "package.json"),
    join(__dirname, "..", "..", "..", "package.json"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const pkg = JSON.parse(readFileSync(path, "utf-8"));
        if (pkg.name === "@melihmucuk/leash") {
          return pkg.version;
        }
      } catch {}
    }
  }

  return "0.0.0";
}

export const CURRENT_VERSION: string = getVersion();

const NPM_REGISTRY_URL = "https://registry.npmjs.org/@melihmucuk/leash/latest";

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion: string;
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  try {
    const response = await fetch(NPM_REGISTRY_URL);
    if (!response.ok) {
      return { hasUpdate: false, currentVersion: CURRENT_VERSION };
    }
    const data = (await response.json()) as { version: string };
    return {
      hasUpdate: data.version !== CURRENT_VERSION,
      latestVersion: data.version,
      currentVersion: CURRENT_VERSION,
    };
  } catch {
    return { hasUpdate: false, currentVersion: CURRENT_VERSION };
  }
}
