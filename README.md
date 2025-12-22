# Leash 🔒

**Security guardrails for AI coding agents.** Sandboxes file system access, blocks dangerous commands outside project directory, prevents destructive git operations, catches agent hallucinations before they cause damage.

## Why Leash?

AI agents can hallucinate dangerous commands. Leash sandboxes them:

- Blocks `rm`, `mv`, `cp`, `chmod` outside working directory
- Blocks `git reset --hard`, `push --force`, `clean -f`
- Resolves symlinks to prevent directory escapes
- Analyzes command chains (`&&`, `||`, `;`, `|`)

![Claude Code](assets/claude-code.png)

## Quick Start

```bash
git clone https://github.com/melihmucuk/leash.git ~/leash
```

<details>
<summary><b>Pi Coding Agent</b> - <a href="https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/hooks.md">docs</a></summary>

Add to `~/.pi/agent/settings.json`:

```json
{
  "hooks": ["~/leash/dist/pi/leash.js"]
}
```

</details>

<details>
<summary><b>OpenCode</b> - <a href="https://opencode.ai/docs/plugins/">docs</a></summary>

```bash
ln -s ~/leash/dist/opencode/leash.js ~/.config/opencode/plugin/leash.js
```

</details>

<details>
<summary><b>Claude Code</b> - <a href="https://code.claude.com/docs/en/hooks-guide">docs</a></summary>

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

</details>

<details>
<summary><b>Factory Droid</b> - <a href="https://docs.factory.ai/cli/configuration/hooks-guide">docs</a></summary>

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

</details>

Restart your agent. Done! Update anytime with `cd ~/leash && git pull`.

## What Gets Blocked

```bash
# Dangerous commands outside working directory
rm -rf ~/Documents                # ❌ Delete outside working dir
mv ~/.bashrc /tmp/                # ❌ Move from outside
echo "data" > ~/file.txt          # ❌ Redirect to home

# Dangerous git commands (blocked everywhere)
git reset --hard                  # ❌ Destroys uncommitted changes
git push --force                  # ❌ Destroys remote history
git clean -fd                     # ❌ Removes untracked files

# File operations via Write/Edit tools
~/.bashrc                         # ❌ Home directory file
../../../etc/hosts                # ❌ Path traversal
```

## What's Allowed

```bash
rm -rf ./node_modules             # ✅ Working directory
rm -rf /tmp/build-cache           # ✅ Temp directory
git commit -m "message"           # ✅ Safe git commands
git push origin main              # ✅ Normal push (no --force)
```

<details>

<summary><b>Detailed Examples</b></summary>

### Dangerous Commands

```bash
rm -rf ~/Documents           # ❌ Delete outside working dir
mv ~/.bashrc /tmp/           # ❌ Move from outside
cp ./secrets ~/leaked        # ❌ Copy to outside
chmod 777 /etc/hosts         # ❌ Permission change outside
chown user ~/file            # ❌ Ownership change outside
ln -s ./file ~/link          # ❌ Symlink to outside
dd if=/dev/zero of=~/file    # ❌ Write outside
truncate -s 0 ~/file         # ❌ Truncate outside
```

### Dangerous Git Commands

```bash
git checkout -- .            # ❌ Discards uncommitted changes
git restore src/file.ts      # ❌ Discards uncommitted changes
git reset --hard             # ❌ Destroys all uncommitted changes
git reset --hard HEAD~1      # ❌ Destroys commits and changes
git reset --merge            # ❌ Can lose uncommitted changes
git clean -f                 # ❌ Removes untracked files permanently
git clean -fd                # ❌ Removes untracked files and directories
git push --force             # ❌ Destroys remote history
git push -f origin main      # ❌ Destroys remote history
git branch -D feature        # ❌ Force-deletes branch without merge check
git stash drop               # ❌ Permanently deletes stashed changes
git stash clear              # ❌ Deletes ALL stashed changes
```

### Redirects

```bash
echo "data" > ~/file.txt     # ❌ Redirect to home
echo "log" >> ~/app.log      # ❌ Append to home
cat secrets > "/tmp/../~/x"  # ❌ Path traversal in redirect
```

### Command Chains

```bash
echo ok && rm ~/file         # ❌ Dangerous command after &&
false || rm -rf ~/           # ❌ Dangerous command after ||
ls; rm ~/file                # ❌ Dangerous command after ;
cat x | rm ~/file            # ❌ Dangerous command in pipe
```

### Wrapper Commands

```bash
sudo rm -rf ~/dir            # ❌ sudo + dangerous command
env rm ~/file                # ❌ env + dangerous command
command rm ~/file            # ❌ command + dangerous command
```

### Compound Patterns

```bash
find ~ -name "*.tmp" -delete          # ❌ find -delete outside
find ~ -exec rm {} \;                 # ❌ find -exec rm outside
find ~/logs | xargs rm                # ❌ xargs rm outside
find ~ | xargs -I{} mv {} /tmp        # ❌ xargs mv outside
rsync -av --delete ~/src/ ~/dst/      # ❌ rsync --delete outside
```

### File Operations (Write/Edit tools)

```bash
/etc/passwd                  # ❌ System file
~/.bashrc                    # ❌ Home directory file
/home/user/.ssh/id_rsa       # ❌ Absolute path outside
../../../etc/hosts           # ❌ Path traversal
```

### What's Allowed (Full List)

```bash
# Working directory operations
rm -rf ./node_modules
mv ./old.ts ./new.ts
cp ./src/config.json ./dist/
find . -name "*.bak" -delete
find ./logs | xargs rm

# Temp directory operations
rm -rf /tmp/build-cache
echo "data" > /tmp/output.txt
rsync -av --delete ./src/ /tmp/backup/

# Device paths
echo "x" > /dev/null
truncate -s 0 /dev/null

# Read from anywhere (safe)
cp /etc/hosts ./local-hosts
cat /etc/passwd

# Safe git commands
git status
git add .
git commit -m "message"
git push origin main
git checkout main
git checkout -b feature/new
git branch -d merged-branch      # lowercase -d is safe
git reset --soft HEAD~1          # soft reset is safe
git restore --staged .           # unstaging is safe
git stash
git stash pop
```

</details>

## Performance

Near-zero latency impact on your workflow:

| Platform    | Latency per tool call | Notes                                    |
| ----------- | --------------------- | ---------------------------------------- |
| OpenCode    | **~20µs**             | In-process plugin, near-zero overhead    |
| Pi          | **~20µs**             | In-process hook, near-zero overhead      |
| Claude Code | **~31ms**             | External process (~30ms Node.js startup) |
| Factory     | **~31ms**             | External process (~30ms Node.js startup) |

For context: LLM API calls typically take 2-10+ seconds. Even the slower external process hook adds less than 0.3% to total response time.

## Limitations

Leash is a **defense-in-depth** layer, not a complete sandbox. It cannot protect against:

- Kernel exploits or privilege escalation
- Network-based attacks (downloading and executing scripts)
- Commands not routed through the intercepted tools

For maximum security, combine Leash with container isolation (Docker), user permission restrictions, or read-only filesystem mounts.

## Development

```bash
cd ~/leash
npm install
npm run build
```

## Contributing

Contributions are welcome! Areas where help is needed:

- [ ] Plugin for AMP Code
- [ ] Protect sensitive files in project directory (`.env`, `.git/config`, keys)
- [ ] Additional dangerous command patterns
- [ ] Bypass testing and security audits

---

_Keep your AI agents on a leash._
