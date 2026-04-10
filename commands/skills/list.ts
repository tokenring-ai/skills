import type {AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand,} from "@tokenring-ai/agent/types";
import markdownTable from "../../../utility/string/markdownTable.ts";
import SkillService from "../../SkillService.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({
                         agent,
                       }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const skills = await agent
    .requireServiceByType(SkillService)
    .listSkills(agent, {includeDisabled: true});
  if (skills.length === 0)
    return "No skills installed. Use /skills download <zip-url> to add one.";

  return `
Installed skills:

${markdownTable(
    ["Name", "Enabled", "Description", "Source"],
    skills.map((skill) => [
      skill.name,
      skill.enabled ? "yes" : "no",
      skill.description,
      skill.sourceUrl ?? "",
    ]),
)}
  `.trim();
}

const help = `List installed TokenRing skills, including disabled ones.`;

export default {
  name: "skills list",
  description: "List installed skills",
  help,
  inputSchema,
  execute,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
