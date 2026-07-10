import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { AgentNotFoundSchema, SuccessSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";

export const SkillSummarySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  sourceUrl: z.string().exactOptional(),
  userInvocable: z.boolean().exactOptional(),
  argumentHint: z.string().exactOptional(),
  context: z.string().exactOptional(),
  agent: z.string().exactOptional(),
});

export default {
  name: "Skills RPC",
  path: "/rpc/skills",
  methods: {
    listSkills: {
      type: "query",
      input: z.object({
        agentId: z.string().exactOptional(),
        includeDisabled: z.boolean().default(true).exactOptional(),
      }),
      result: z.discriminatedUnion("status", [
        SuccessSchema.extend({
          skills: z.array(SkillSummarySchema),
        }),
        AgentNotFoundSchema,
      ]),
    },
    streamEnabledSkills: {
      type: "stream",
      input: z.object({
        agentId: z.string(),
      }),
      result: z.discriminatedUnion("status", [
        SuccessSchema.extend({
          skills: z.array(z.string()),
        }),
        AgentNotFoundSchema,
      ]),
    },
    enableSkill: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        name: z.string().min(1),
      }),
      result: z.discriminatedUnion("status", [
        SuccessSchema.extend({
          skill: SkillSummarySchema,
        }),
        AgentNotFoundSchema,
      ]),
    },
    disableSkill: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        name: z.string().min(1),
      }),
      result: z.discriminatedUnion("status", [
        SuccessSchema.extend({
          skill: SkillSummarySchema,
        }),
        AgentNotFoundSchema,
      ]),
    },
    downloadSkill: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        zipUrl: z.string().min(1),
      }),
      result: z.discriminatedUnion("status", [
        SuccessSchema.extend({
          skill: SkillSummarySchema,
        }),
        AgentNotFoundSchema,
      ]),
    },
    deleteSkill: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        name: z.string().min(1),
      }),
      result: z.discriminatedUnion("status", [
        SuccessSchema.extend({
          success: z.boolean(),
          message: z.string(),
        }),
        AgentNotFoundSchema,
      ]),
    },
    resetSkill: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        name: z.string().min(1),
      }),
      result: z.discriminatedUnion("status", [
        SuccessSchema.extend({
          skill: SkillSummarySchema,
        }),
        AgentNotFoundSchema,
      ]),
    },
  },
} satisfies RPCSchema;
