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
  const skill = await agent
    .requireServiceByType(SkillService)
    .disableSkill(name, agent);
  return `Disabled skill "${skill.name}".`;
}

export default {
  name: "skills disable",
  description: "Disable an installed skill",
  help: `Disable an installed skill.

## Example

/skills disable my-skill`,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
