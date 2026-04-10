import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand,} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  positionals: [
    {name: "zipUrl", description: "Skill ZIP URL", required: true},
  ],
} as const satisfies AgentCommandInputSchema;

async function execute({
                         positionals: {zipUrl},
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const skill = await agent
    .requireServiceByType(SkillService)
    .downloadSkill(zipUrl, agent);
  return `Downloaded skill "${skill.name}" to ${skill.directory}`;
}

export default {
  name: "skills download",
  description: "Download and install a skill",
  help: `Download and install a skill from a zip URL.

## Example

/skills download https://example.com/my-skill.zip`,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
