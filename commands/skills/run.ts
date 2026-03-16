import Agent from "@tokenring-ai/agent/Agent";
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import SkillService from "../../SkillService.ts";

async function execute(remainder: string, agent: Agent): Promise<string> {
  const [name, ...promptParts] = remainder.trim().split(/\s+/);
  if (!name) throw new CommandFailedError("Usage: /skills run <name> [prompt]");
  return await agent.requireServiceByType(SkillService).runSkill(name, promptParts.join(" "), agent);
}

const help = `# /skills run <name> [prompt]

Run an installed skill with an optional prompt.`;

export default {
  name: "skills run",
  description: "Run an installed skill",
  help,
  execute,
} satisfies TokenRingAgentCommand;
