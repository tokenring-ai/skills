import Agent from "@tokenring-ai/agent/Agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const zipUrl = remainder.trim();
  if (!zipUrl) throw new CommandFailedError("Usage: /skills download <zip-url>");
  const skill = await agent.requireServiceByType(SkillService).downloadSkill(zipUrl, agent);
  return `Downloaded skill "${skill.name}" to ${skill.directory}`;
}

const help = `# /skills download <zip-url>

Download and install a skill from a zip URL.`;

export default {
  name: "skills download",
  description: "/skills download - Download and install a skill",
  help,
  execute,
} satisfies TokenRingAgentCommand;
