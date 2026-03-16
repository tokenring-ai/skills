import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  prompt: {
    description: "Skill name and optional prompt",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const [name, ...promptParts] = prompt.trim().split(/\s+/);
  if (!name) throw new CommandFailedError("Usage: /skills run <name> [prompt]");
  return await agent.requireServiceByType(SkillService).runSkill(name, promptParts.join(" "), agent);
}

const help = `# /skills run <name> [prompt]

Run an installed skill with an optional prompt.`;

export default {
  name: "skills run",
  description: "Run an installed skill",
  help,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
