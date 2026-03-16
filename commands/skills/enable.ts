import Agent from "@tokenring-ai/agent/Agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const name = remainder.trim();
  if (!name) throw new CommandFailedError("Usage: /skills enable <name>");
  const skill = await agent.requireServiceByType(SkillService).enableSkill(name, agent);
  return `Enabled skill "${skill.name}".`;
}

const help = `# /skills enable <name>

Enable an installed skill.`;

export default {
  name: "skills enable",
  description: "Enable an installed skill",
  help,
  execute,
} satisfies TokenRingAgentCommand;
