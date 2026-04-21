import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import SkillService from "../SkillService.ts";

const name = "skills_deleteSkill";
const displayName = "Skills/deleteSkill";
const description = "Delete an installed skill";

const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
});

async function execute({ name }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  await agent.requireServiceByType(SkillService).deleteSkill(name, agent);
  return `Deleted skill ${name}`;
}

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
