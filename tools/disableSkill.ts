import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import SkillService from "../SkillService.ts";

const name = "skills_disableSkill";
const displayName = "Skills/disableSkill";
const description = "Disable an installed skill";

const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
});

async function execute({ name }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const skill = await agent.requireServiceByType(SkillService).disableSkill(name, agent);
  return `Disabled skill ${skill.name}`;
}

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
