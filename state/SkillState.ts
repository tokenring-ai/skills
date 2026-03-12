import {Agent} from "@tokenring-ai/agent";
import {AgentStateSlice} from "@tokenring-ai/agent/types";
import {z} from "zod";

const serializationSchema = z.object({
  enabledSkills: z.array(z.string()).default([]),
}).prefault({});

export class SkillState extends AgentStateSlice<typeof serializationSchema> {
  enabledSkills: Set<string>;

  constructor({enabledSkills = []}: {enabledSkills?: string[]} = {}) {
    super("SkillState", serializationSchema);
    this.enabledSkills = new Set(enabledSkills);
  }

  transferStateFromParent(parent: Agent): void {
    this.enabledSkills = new Set(parent.getState(SkillState).enabledSkills);
  }

  serialize(): z.output<typeof serializationSchema> {
    return {
      enabledSkills: Array.from(this.enabledSkills),
    };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.enabledSkills = new Set(data.enabledSkills);
  }

  show(): string[] {
    return [
      `Enabled Skills: ${Array.from(this.enabledSkills).join(", ") || "None"}`,
    ];
  }
}
