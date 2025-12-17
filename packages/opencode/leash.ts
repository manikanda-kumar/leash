import type { Plugin } from "@opencode-ai/plugin";
import { CommandAnalyzer } from "../core/index.js";

export const Leash: Plugin = async ({ directory, client }) => {
  const analyzer = new CommandAnalyzer(directory);

  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.tui.showToast({
          body: { message: "🔒 Leash active", variant: "info" },
        });
      }
    },

    "tool.execute.before": async (input, output) => {
      // Shell command execution
      const shellTools = ["execute", "bash", "shell"];
      if (shellTools.includes(input.tool)) {
        const command = output.args?.command || output.args?.script || "";
        const result = analyzer.analyze(command);

        if (result.blocked) {
          throw new Error(
            `Command blocked: ${command}\n` +
              `Reason: ${result.reason}\n` +
              `Working directory: ${directory}\n` +
              `Action: Guide the user to run the command manually.`
          );
        }
      }

      // File write/edit/patch operations
      const fileTools = ["write", "edit", "patch"];
      if (fileTools.includes(input.tool)) {
        const path = output.args?.path || "";
        const result = analyzer.validatePath(path);

        if (result.blocked) {
          throw new Error(
            `File operation blocked: ${path}\n` +
              `Reason: ${result.reason}\n` +
              `Working directory: ${directory}\n` +
              `Action: Guide the user to perform this operation manually.`
          );
        }
      }
    },
  };
};

export default Leash;
