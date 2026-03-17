import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  positionals: [{name: "name", description: "Skill name", required: true}],
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({positionals: { name }, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const skill = await agent.requireServiceByType(SkillService).enableSkill(name, agent);
  return `Enabled skill "${skill.name}".`;
}

export default {
  name: "skills enable",
  description: "Enable an installed skill",
  help: `Enable an installed skill.

## Example

/skills enable my-skill`,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
