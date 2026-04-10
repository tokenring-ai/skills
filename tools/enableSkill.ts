import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import SkillService from "../SkillService.ts";

const name = "skills_enableSkill";
const displayName = "Skills/enableSkill";
const description = "Enable an installed skill";

const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
});

async function execute({name}: z.output<typeof inputSchema>, agent: Agent) {
  const skill = await agent
    .requireServiceByType(SkillService)
    .enableSkill(name, agent);
  return {
    type: "json" as const,
    data: {name: skill.name, enabled: skill.enabled},
  };
}

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
