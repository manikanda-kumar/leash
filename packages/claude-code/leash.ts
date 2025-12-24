#!/usr/bin/env node
import { CommandAnalyzer, checkForUpdates } from "../core/index.js";

interface ClaudeCodeHookInput {
  hook_event_name: string;
  tool_name?: string;
  tool_input?: {
    command?: string;
    file_path?: string;
  };
  cwd: string;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function main() {
  let input: ClaudeCodeHookInput;

  try {
    const raw = await readStdin();
    input = JSON.parse(raw);
  } catch {
    console.error("Failed to parse input JSON");
    process.exit(1);
  }

  const { hook_event_name, tool_name, tool_input, cwd } = input;

  // SessionStart: show activation message and check for updates
  if (hook_event_name === "SessionStart") {
    const messages: string[] = ["🔒 Leash active"];

    const update = await checkForUpdates();
    if (update.hasUpdate) {
      messages.push(
        `🔄 Leash ${update.latestVersion} available. Run: leash --update`
      );
    }

    console.log(JSON.stringify({ systemMessage: messages.join("\n") }));
    process.exit(0);
  }

  // PreToolUse: security checks
  const analyzer = new CommandAnalyzer(cwd);

  // Shell command execution
  if (tool_name === "Bash") {
    const command = tool_input?.command || "";
    const result = analyzer.analyze(command);

    if (result.blocked) {
      console.error(
        `🚫 Command blocked: ${command}\n` +
          `Reason: ${result.reason}\n` +
          `Working directory: ${cwd}\n` +
          `Action: Guide the user to run the command manually.`
      );
      process.exit(2);
    }
  }

  // File write/edit operations
  if (tool_name === "Write" || tool_name === "Edit") {
    const path = tool_input?.file_path || "";
    const result = analyzer.validatePath(path);

    if (result.blocked) {
      console.error(
        `🚫 File operation blocked: ${path}\n` +
          `Reason: ${result.reason}\n` +
          `Working directory: ${cwd}\n` +
          `Action: Guide the user to perform this operation manually.`
      );
      process.exit(2);
    }
  }

  // Allow operation
  process.exit(0);
}

main();
