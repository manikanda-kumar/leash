# Leash 🔒

**Security guardrails for AI coding agents.** Sandboxes file system access, blocks dangerous commands (rm, mv, chmod) outside project directory, prevents command injection attacks.

## Why Leash?

AI coding agents are powerful but unpredictable. A single hallucination or misunderstood instruction can lead to:

- Deleted files outside your project
- Modified system configurations
- Exposed sensitive data
- Corrupted home directory

Leash acts as a security layer between the AI agent and your system, ensuring all file operations stay within your project boundaries.

## Quick Start

### Pi Coding Agent - [more info](https://shittycodingagent.ai)

```bash
git clone https://github.com/melihmucuk/leash.git ~/leash
```

Add to `~/.pi/agent/settings.json`:

```json
{
  "hooks": ["~/leash/dist/pi/leash.js"]
}
```

Restart Pi — done!

### OpenCode - [more info](https://opencode.ai)

```bash
git clone https://github.com/melihmucuk/leash.git ~/leash
ln -s ~/leash/dist/opencode/leash.js ~/.config/opencode/plugin/leash.js
```

Restart OpenCode — done!

**Uninstall:** `rm ~/.config/opencode/plugin/leash.js`

### Claude Code - [more info](https://claude.com/product/claude-code)

```bash
git clone https://github.com/melihmucuk/leash.git ~/leash
```

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/leash/dist/claude-code/leash.js"
          }
        ]
      }
    ]
  }
}
```

Restart Claude Code — done!

### Factory Droid - [more info](https://factory.ai/product/cli)

```bash
git clone https://github.com/melihmucuk/leash.git ~/leash
```

Add to `~/.factory/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Execute|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/leash/dist/factory/leash.js"
          }
        ]
      }
    ]
  }
}
```

Restart Factory Droid — done!

---

**Update:** `cd ~/leash && git pull`

## Supported Platforms

| Platform      | Status     | Plugin Path                 |
| ------------- | ---------- | --------------------------- |
| Pi            | ✅ Ready   | `dist/pi/leash.js`          |
| OpenCode      | ✅ Ready   | `dist/opencode/leash.js`    |
| Claude Code   | ✅ Ready   | `dist/claude-code/leash.js` |
| Factory Droid | ✅ Ready   | `dist/factory/leash.js`     |
| AMP Code      | 🚧 Planned | Coming soon                 |

## Features

- **Path Sandboxing** — Restricts all file operations to the working directory
- **Dangerous Command Blocking** — Intercepts `rm`, `mv`, `cp`, `chmod`, `chown`, `dd`, and more
- **Symlink Resolution** — Prevents symlink-based escapes to external directories
- **Command Chain Analysis** — Parses `&&`, `||`, `;`, `|` chains for hidden threats
- **Shell Wrapper Detection** — Catches `bash -c`, `eval`, `exec` executing dangerous code
- **Interpreter Monitoring** — Detects filesystem operations in `python -c`, `node -e`, `ruby -e`
- **Variable Expansion** — Resolves `$HOME`, `~`, and environment variables before validation

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AI Agent   │────▶│    Leash    │────▶│   System    │
│             │     │  (Analyze)  │     │   (Shell)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   BLOCKED   │
                    │  (if unsafe)│
                    └─────────────┘
```

### Security Layers

1. **Pattern Detection** — Scans for dangerous patterns like command substitution `$(...)`, redirects to external paths
2. **Interpreter Analysis** — Checks inline code execution for filesystem operations
3. **Shell Wrapper Inspection** — Analyzes wrapped commands for hidden dangerous operations
4. **Path Validation** — Resolves and validates all paths against the working directory

## What Gets Blocked

```bash
# ❌ Blocked: Path outside working directory
rm -rf ~/Documents

# ❌ Blocked: Home directory reference
mv ~/.bashrc ~/.bashrc.bak

# ❌ Blocked: Absolute path escape
cp /etc/passwd ./

# ❌ Blocked: Shell wrapper with dangerous command
bash -c "rm -rf ~/*"

# ❌ Blocked: Interpreter filesystem operation
python -c "import shutil; shutil.rmtree('/home/user')"

# ❌ Blocked: Command substitution
echo $(rm -rf ~)

# ✅ Allowed: Operations within working directory
rm -rf ./node_modules
mv ./old.ts ./new.ts
cp ./template.json ./config.json
```

## Limitations

Leash is a **defense-in-depth** layer, not a complete sandbox. It cannot protect against:

- Kernel exploits or privilege escalation
- Network-based attacks (downloading and executing scripts)
- Memory-based attacks
- Commands not routed through the intercepted tools

For maximum security, combine Leash with:

- Container isolation (Docker, Podman)
- User permission restrictions
- Read-only filesystem mounts
- Network egress filtering

## Development

```bash
cd ~/leash
npm install
npm run build
```

## Contributing

Contributions are welcome! Areas where help is needed:

- [x] Plugin for Claude Code
- [x] Plugin for Factory Droid
- [ ] Additional dangerous command patterns
- [ ] Bypass testing and security audits

---

_Keep your AI agents on a leash._
