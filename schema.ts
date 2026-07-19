import { SubAgentConfigSchema } from "@tokenring-ai/agent/schema";
import type { ConfigFieldMeta } from "@tokenring-ai/app/config/metadata";
import { z } from "zod";

export const SkillsAgentConfigSchema = z
  .object({
    enabledSkills: z.array(z.string()).exactOptional(),
    subAgent: SubAgentConfigSchema.exactOptional(),
  })
  .prefault({});

export const SkillsConfigSchema = z.object({
  skillsDirectory: z
    .string()
    .default(".tokenring/skills")
    .meta({ description: "Directory skills are loaded from" } satisfies ConfigFieldMeta),
  registryFile: z
    .string()
    .default(".tokenring/skills/.skills-registry.json")
    .meta({ advanced: true, description: "Path to the skills registry file" } satisfies ConfigFieldMeta),
  tempDirectory: z
    .string()
    .default("/tmp/tokenring-skills")
    .meta({ advanced: true, description: "Scratch directory used while running skills" } satisfies ConfigFieldMeta),
  defaultSkillAgentType: z
    .string()
    .default("general-purpose")
    .meta({ description: "Agent type used to run a skill when none is specified" } satisfies ConfigFieldMeta),
  agentDefaults: z
    .object({
      enabledSkills: z
        .array(z.string())
        .default([])
        .meta({ description: "Skills enabled by default for new agents" } satisfies ConfigFieldMeta),
      subAgent: SubAgentConfigSchema.prefault({}),
    })
    .prefault({})
    .meta({ label: "Agent Defaults" } satisfies ConfigFieldMeta),
}).meta({ label: "Skills", description: "Reusable skills registry for agents" } satisfies ConfigFieldMeta);

export type ParsedSkillsConfig = z.output<typeof SkillsConfigSchema>;
