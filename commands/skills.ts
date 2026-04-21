import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import list from "./skills/list.ts";

const help = `Manage TokenRing skills stored under \`.tokenring/skills\`.

## Commands

- /skills list
- /skills download <zip-url>
- /skills run <name> [prompt]
- /skills delete <name>
- /skills enable <name>
- /skills disable <name>
- /skills reset <name>

Skills that are user-invocable are also available directly as \`/skill-name [prompt]\`.`;

const inputSchema = {} as const satisfies AgentCommandInputSchema;

export default {
  name: "skills",
  description: "Manage installed skills",
  help,
  inputSchema,
  execute: async ({agent}: AgentCommandInputType<typeof inputSchema>) =>
    await list.execute({agent}),
} satisfies TokenRingAgentCommand<typeof inputSchema>;
