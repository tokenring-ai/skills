import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingToolDefinition, TokenRingToolResult} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import SkillService from "../SkillService.ts";

const name = "skills_runSkill";
const displayName = "Skills/runSkill";
const description = "Run an installed skill by name";

const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
  prompt: z
    .string()
    .optional()
    .describe("Optional prompt or arguments for the skill"),
});

async function execute(
  {name, prompt}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolResult> {
  return await agent
    .requireServiceByType(SkillService)
    .runSkill(name, prompt ?? "", agent);
}

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
