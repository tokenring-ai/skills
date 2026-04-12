import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingToolDefinition, TokenRingToolResult} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import SkillService from "../SkillService.ts";

const name = "skills_downloadSkill";
const displayName = "Skills/downloadSkill";
const description = "Download and install a skill from a zip file URL";

const inputSchema = z.object({
  zipUrl: z
    .string()
    .url()
    .describe("URL to a zip archive containing a skill with SKILL.md"),
});

async function execute({zipUrl}: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const skill = await agent
    .requireServiceByType(SkillService)
    .downloadSkill(zipUrl, agent);
  return `Downloaded and installed skill ${skill.name} to directory ${skill.directory}`;
}

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
