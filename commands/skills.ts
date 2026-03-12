import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import list from "./skills/list.ts";

const help = `# /skills

Manage Token Ring skills stored under \`.tokenring/skills\`.

## Commands

- /skills list
- /skills download <zip-url>
- /skills run <name> [prompt]
- /skills delete <name>
- /skills enable <name>
- /skills disable <name>
- /skills reset <name>

Skills that are user-invocable are also available directly as \`/skill-name [prompt]\`.`;

export default {
  name: "skills",
  description: "/skills - Manage installed skills",
  help,
  execute: async (_remainder: string, agent: Agent) => await list.execute("", agent),
} satisfies TokenRingAgentCommand;
