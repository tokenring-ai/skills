import Agent from "@tokenring-ai/agent/Agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const name = remainder.trim();
  if (!name) throw new CommandFailedError("Usage: /skills disable <name>");
  const skill = await agent.requireServiceByType(SkillService).disableSkill(name, agent);
  return `Disabled skill "${skill.name}".`;
}

const help = `# /skills disable <name>

Disable an installed skill.`;

export default {
  name: "skills disable",
  description: "Disable an installed skill",
  help,
  execute,
} satisfies TokenRingAgentCommand;
