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
  if (!name) throw new CommandFailedError("Usage: /skills disable <name>");
  const skill = await agent.requireServiceByType(SkillService).disableSkill(name, agent);
  return `Disabled skill "${skill.name}".`;
}

const help = `# /skills disable <name>

Disable an installed skill.`;

export default {
  name: "skills disable",
  description: "Disable an installed skill",
  help,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
