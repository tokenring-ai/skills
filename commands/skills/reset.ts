import Agent from "@tokenring-ai/agent/Agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const name = remainder.trim();
  if (!name) throw new CommandFailedError("Usage: /skills reset <name>");
  const skill = await agent.requireServiceByType(SkillService).resetSkill(name, agent);
  return `Reset skill "${skill.name}".`;
}

const help = `# /skills reset <name>

Reset an installed skill to its source state.`;

export default {
  name: "skills reset",
  description: "/skills reset - Reset an installed skill",
  help,
  execute,
} satisfies TokenRingAgentCommand;
