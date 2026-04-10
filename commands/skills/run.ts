import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand,} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  positionals: [{name: "name", description: "Skill name", required: true}],
  remainder: {
    name: "prompt",
    description: "Optional prompt for the skill",
    defaultValue: "Run this skill",
  },
} as const satisfies AgentCommandInputSchema;

async function execute({
                         positionals: {name},
                         remainder,
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  return await agent
    .requireServiceByType(SkillService)
    .runSkill(name, remainder, agent);
}

export default {
  name: "skills run",
  description: "Run an installed skill",
  help: `Run an installed skill with an optional prompt.

## Example

/skills run my-skill
/skills run my-skill analyze this code`,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
