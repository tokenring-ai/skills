import Agent from "@tokenring-ai/agent/Agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const name = remainder.trim();
  if (!name) throw new CommandFailedError("Usage: /skills delete <name>");
  await agent.requireServiceByType(SkillService).deleteSkill(name, agent);
  return `Deleted skill "${name}".`;
}

const help = `# /skills delete <name>

Delete an installed skill.`;

export default {
  name: "skills delete",
  description: "/skills delete - Delete an installed skill",
  help,
  execute,
} satisfies TokenRingAgentCommand;
