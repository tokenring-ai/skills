import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import SkillService from "../SkillService.ts";

const name = "skills_downloadSkill";
const displayName = "Skills/downloadSkill";
const description = "Download and install a skill from a zip file URL";

const inputSchema = z.object({
  zipUrl: z.string().url().describe("URL to a zip archive containing a skill with SKILL.md"),
});

async function execute({zipUrl}: z.output<typeof inputSchema>, agent: Agent) {
  const skill = await agent.requireServiceByType(SkillService).downloadSkill(zipUrl, agent);
  return {type: "json" as const, data: {
    name: skill.name,
    directory: skill.directory,
    enabled: skill.enabled,
    sourceUrl: skill.sourceUrl,
  }};
}

export default {name, displayName, description, inputSchema, execute} satisfies TokenRingToolDefinition<typeof inputSchema>;
