import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand,} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  positionals: [{name: "name", description: "Skill name", required: true}],
} as const satisfies AgentCommandInputSchema;

async function execute({
                         positionals: {name},
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  await agent.requireServiceByType(SkillService).deleteSkill(name, agent);
  return `Deleted skill "${name}".`;
}

export default {
  name: "skills delete",
  description: "Delete an installed skill",
  help: `Delete an installed skill.

## Example

/skills delete my-skill`,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
