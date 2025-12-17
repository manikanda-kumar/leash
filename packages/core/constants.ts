/** Commands that modify filesystem - blocked outside working directory */
export const DANGEROUS_COMMANDS = new Set([
  // Delete
  "rm",
  "rmdir",
  "unlink",
  "shred",
  // Move/Copy
  "mv",
  "cp",
  // Permissions
  "chmod",
  "chown",
  "chgrp",
  // Write
  "truncate",
  "dd",
  // Links
  "ln",
]);

/** Pattern to detect redirects to external paths */
export const REDIRECT_PATTERN = />\s*([~\/][^\s;|&>]*)/g;

/** Safe device paths that should never be blocked */
export const SAFE_DEVICE_PATHS = new Set([
  "/dev/null",
  "/dev/stdin",
  "/dev/stdout",
  "/dev/stderr",
]);
