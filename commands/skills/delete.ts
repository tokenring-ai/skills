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
  if (!name) throw new CommandFailedError("Usage: /skills delete <name>");
  await agent.requireServiceByType(SkillService).deleteSkill(name, agent);
  return `Deleted skill "${name}".`;
}

const help = `# /skills delete <name>

Delete an installed skill.`;

export default {
  name: "skills delete",
  description: "Delete an installed skill",
  help,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
