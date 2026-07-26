import { AgentManager } from "@tokenring-ai/agent";
import { createAgentStateSliceStream } from "@tokenring-ai/agent/rpc/createAgentStateStream";
import type TokenRingApp from "@tokenring-ai/app";
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";
import { stripUndefinedKeys } from "@tokenring-ai/utility/object/stripObject";
import type { SkillDefinition } from "../SkillService.ts";
import SkillService from "../SkillService.ts";
import { SkillState } from "../state/SkillState.ts";
import SkillsRpcSchema from "./schema.ts";

function toSkillSummary(skill: SkillDefinition) {
  return stripUndefinedKeys({
    name: skill.name,
    slug: skill.slug,
    description: skill.description,
    enabled: skill.enabled,
    sourceUrl: skill.sourceUrl,
    userInvocable: skill.frontmatter.userInvocable,
    argumentHint: skill.frontmatter.argumentHint,
    context: skill.frontmatter.context,
    agent: skill.frontmatter.agent,
  });
}

const streamEnabledSkills = createAgentStateSliceStream({
  SliceClass: SkillState,
  project: state => ({
    status: "success" as const,
    skills: state.enabledSkills.valuesArray(),
  }),
});

export default createRPCEndpoint(SkillsRpcSchema, {
  async listSkills(args, app: TokenRingApp) {
    const skillService = app.requireService(SkillService);

    if (args.agentId) {
      const agent = app.requireService(AgentManager).getAgent(args.agentId);
      if (!agent) {
        return { status: "agentNotFound" };
      }
      const skills = await skillService.listSkills(agent, { includeDisabled: args.includeDisabled ?? true });
      return { status: "success", skills: skills.map(toSkillSummary) };
    }

    const installed = await skillService.listInstalledSkills();
    const skills = installed.map(skill => ({
      ...toSkillSummary(skill),
      enabled: false,
    }));
    return { status: "success", skills };
  },

  streamEnabledSkills,

  async enableSkill(args, app: TokenRingApp) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) {
      return { status: "agentNotFound" };
    }
    const skill = await app.requireService(SkillService).enableSkill(args.name, agent);
    return { status: "success", skill: toSkillSummary(skill) };
  },

  async disableSkill(args, app: TokenRingApp) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) {
      return { status: "agentNotFound" };
    }
    const skill = await app.requireService(SkillService).disableSkill(args.name, agent);
    return { status: "success", skill: toSkillSummary(skill) };
  },

  async downloadSkill(args, app: TokenRingApp) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) {
      return { status: "agentNotFound" };
    }
    const skill = await app.requireService(SkillService).downloadSkill(args.zipUrl, agent);
    return { status: "success", skill: toSkillSummary(skill) };
  },

  async deleteSkill(args, app: TokenRingApp) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) {
      return { status: "agentNotFound" };
    }
    await app.requireService(SkillService).deleteSkill(args.name, agent);
    return { status: "success", success: true, message: `Skill "${args.name}" deleted` };
  },

  async resetSkill(args, app: TokenRingApp) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) {
      return { status: "agentNotFound" };
    }
    const skill = await app.requireService(SkillService).resetSkill(args.name, agent);
    return { status: "success", skill: toSkillSummary(skill) };
  },
});
