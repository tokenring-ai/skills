import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

const inputSchema = {
  args: {},
  prompt: {
    description: "Skill ZIP URL",
    required: true,
  },
  allowAttachments: false,
} as const satisfies AgentCommandInputSchema;

async function execute({prompt, agent}: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const zipUrl = prompt.trim();
  if (!zipUrl) throw new CommandFailedError("Usage: /skills download <zip-url>");
  const skill = await agent.requireServiceByType(SkillService).downloadSkill(zipUrl, agent);
  return `Downloaded skill "${skill.name}" to ${skill.directory}`;
}

const help = `# /skills download <zip-url>

Download and install a skill from a zip URL.`;

export default {
  name: "skills download",
  description: "Download and install a skill",
  help,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
