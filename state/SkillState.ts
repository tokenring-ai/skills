import type {Agent} from "@tokenring-ai/agent";
import {type ParsedSubAgentConfig, SubAgentConfigSchema,} from "@tokenring-ai/agent/schema";
import {AgentStateSlice} from "@tokenring-ai/agent/types";
import {z} from "zod";
import type {ParsedSkillsConfig} from "../schema.ts";

const serializationSchema = z
  .object({
    enabledSkills: z.array(z.string()).default([]),
    subAgent: SubAgentConfigSchema.prefault({}),
  })
  .prefault({});

export class SkillState extends AgentStateSlice<typeof serializationSchema> {
  enabledSkills: Set<string>;
  subAgent: ParsedSubAgentConfig;

  constructor({
                enabledSkills = [],
                subAgent,
              }: ParsedSkillsConfig["agentDefaults"]) {
    super("SkillState", serializationSchema);
    this.enabledSkills = new Set(enabledSkills);
    this.subAgent = subAgent;
  }

  transferStateFromParent(parent: Agent): void {
    this.enabledSkills = new Set(parent.getState(SkillState).enabledSkills);
    this.subAgent = parent.getState(SkillState).subAgent;
  }

  serialize(): z.output<typeof serializationSchema> {
    return {
      enabledSkills: Array.from(this.enabledSkills),
      subAgent: this.subAgent,
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.enabledSkills = new Set(data.enabledSkills);
    this.subAgent = data.subAgent;
  }

  show(): string {
    return `Enabled Skills: ${Array.from(this.enabledSkills).join(", ") || "None"}`;
  }
}
