import {AgentCommandService} from "@tokenring-ai/agent";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import type {TokenRingPlugin} from "../app/types.ts";
import commands from "./commands.ts";
import packageJSON from "./package.json" with {type: "json"};
import {SkillsConfigSchema} from "./schema.ts";
import SkillService from "./SkillService.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  skills: SkillsConfigSchema.prefault({}),
});

export default {
  name: packageJSON.name,
  displayName: "Agent Skills",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    const service = new SkillService(config.skills);
    app.addServices(service);
    app.waitForService(ChatService, (chatService) =>
      chatService.addTools(...tools),
    );
    app.waitForService(AgentCommandService, async (commandService) => {
      service.setCommandService(commandService);
      commandService.addAgentCommands(commands);
      await service.registerDynamicSkillCommands();
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
