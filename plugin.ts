import { AgentCommandService } from "@tokenring-ai/agent";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { RpcService } from "@tokenring-ai/rpc";
import { z } from "zod";
import commands from "./commands.ts";
import packageJSON from "./package.json" with { type: "json" };
import skillsRPC from "./rpc/skills.ts";
import SkillService from "./SkillService.ts";
import { SkillsConfigSchema } from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  skills: SkillsConfigSchema.prefault({}),
});

export default {
  name: packageJSON.name,
  displayName: "Agent Skills",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app) {
    const service = new SkillService();
    app.addServices(service);
    app.waitForService(ChatService, chatService => chatService.addTools(...tools));
    app.waitForService(AgentCommandService, async commandService => {
      service.setCommandService(commandService);
      commandService.addAgentCommands(commands);
      await service.registerDynamicSkillCommands();
    });
    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(skillsRPC);
    });
  },
  reconfigure(app, config) {
    app.requireService(SkillService).reconfigure(config.skills);
  },
  configSchema: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
