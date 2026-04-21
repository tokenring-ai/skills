import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import SkillService from "../SkillService.ts";

const name = "skills_listSkills";
const displayName = "Skills/listSkills";
const description = "List installed Token Ring skills";

const inputSchema = z.object({
  includeDisabled: z.boolean().default(true).exactOptional(),
});

async function execute({ includeDisabled }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const skills = await agent.requireServiceByType(SkillService).listSkills(agent, { includeDisabled });
  const skillList = skills.map(skill => ({ name: skill.name, description: skill.description, enabled: skill.enabled, sourceUrl: skill.sourceUrl }));
  return JSON.stringify(skillList);
}

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
