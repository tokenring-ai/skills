import type { Agent } from "@tokenring-ai/agent";
import { type ParsedSubAgentConfig, SubAgentConfigSchema } from "@tokenring-ai/agent/schema";
import { AgentStateSlice } from "@tokenring-ai/agent/types";
import deepClone from "@tokenring-ai/utility/object/deepClone";
import EnhancedSet from "@tokenring-ai/utility/set/enhancedSet";
import { z } from "zod";
import type { ParsedSkillsConfig } from "../schema.ts";

const serializationSchema = z
  .object({
    enabledSkills: z.array(z.string()).default([]),
    subAgent: SubAgentConfigSchema.prefault({}),
  })
  .prefault({});

export class SkillState extends AgentStateSlice<typeof serializationSchema> {
  enabledSkills: EnhancedSet<string>;
  subAgent: ParsedSubAgentConfig;

  constructor(readonly initialConfig: ParsedSkillsConfig["agentDefaults"]) {
    super("SkillState", serializationSchema);
    this.enabledSkills = new EnhancedSet(initialConfig.enabledSkills);
    this.subAgent = deepClone(initialConfig.subAgent);
  }

  transferStateFromParent(parent: Agent): void {
    this.enabledSkills = new EnhancedSet(parent.getState(SkillState).enabledSkills);
    this.subAgent = deepClone(parent.getState(SkillState).subAgent);
  }

  serialize(): z.output<typeof serializationSchema> {
    return {
      enabledSkills: this.enabledSkills.valuesArray(),
      subAgent: this.subAgent,
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.enabledSkills = new EnhancedSet(data.enabledSkills);
    this.subAgent = data.subAgent;
  }

  show(): string {
    return `Enabled Skills: ${this.enabledSkills.join(", ") || "None"}`;
  }
}
