import { SubAgentConfigSchema } from "@tokenring-ai/agent/schema";
import { z } from "zod";

export const SkillsAgentConfigSchema = z
  .object({
    enabledSkills: z.array(z.string()).exactOptional(),
    subAgent: SubAgentConfigSchema.exactOptional(),
  })
  .prefault({});

export const SkillsConfigSchema = z.object({
  skillsDirectory: z.string().default(".tokenring/skills"),
  registryFile: z.string().default(".tokenring/skills/.skills-registry.json"),
  tempDirectory: z.string().default("/tmp/tokenring-skills"),
  defaultSkillAgentType: z.string().default("general-purpose"),
  agentDefaults: z
    .object({
      enabledSkills: z.array(z.string()).default([]),
      subAgent: SubAgentConfigSchema.prefault({}),
    })
    .prefault({}),
});

export type ParsedSkillsConfig = z.output<typeof SkillsConfigSchema>;
