import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import SkillService from "../SkillService.ts";

const name = "skills_resetSkill";
const displayName = "Skills/resetSkill";
const description =
  "Reset an installed skill to its downloaded state if possible";

const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
});

async function execute({name}: z.output<typeof inputSchema>, agent: Agent) {
  const skill = await agent
    .requireServiceByType(SkillService)
    .resetSkill(name, agent);
  return {
    type: "json" as const,
    data: {
      name: skill.name,
      enabled: skill.enabled,
      sourceUrl: skill.sourceUrl,
    },
  };
}

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
