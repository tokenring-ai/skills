import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  prompt: {
    description: "Skill name",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const name = prompt.trim();
  if (!name) throw new CommandFailedError("Usage: /skills reset <name>");
  const skill = await agent.requireServiceByType(SkillService).resetSkill(name, agent);
  return `Reset skill "${skill.name}".`;
}

const help = `# /skills reset <name>

Reset an installed skill to its source state.`;

export default {
  name: "skills reset",
  description: "Reset an installed skill",
  help,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
