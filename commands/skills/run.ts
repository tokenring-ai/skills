import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  positionals: [
    {name: "name", description: "Skill name", required: true},
    {name: "prompt", description: "Optional prompt for the skill", required: false, defaultValue: "Run this skill", greedy: true},
  ],
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({positionals: { name, prompt }, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  return await agent.requireServiceByType(SkillService).runSkill(name, prompt, agent);
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
