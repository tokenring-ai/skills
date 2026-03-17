import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  positionals: [{name: "name", description: "Skill name", required: true}],
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({positionals: { name }, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const skill = await agent.requireServiceByType(SkillService).resetSkill(name, agent);
  return `Reset skill "${skill.name}".`;
}

export default {
  name: "skills reset",
  description: "Reset an installed skill",
  help: `Reset an installed skill to its source state.

## Example

/skills reset my-skill`,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
