import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import markdownTable from "../../../utility/string/markdownTable.ts";
import SkillService from "../../SkillService.ts";

async function execute(_remainder: string, agent: Agent): Promise<string> {
  const skills = await agent.requireServiceByType(SkillService).listSkills(agent, {includeDisabled: true});
  if (skills.length === 0) return "No skills installed. Use /skills download <zip-url> to add one.";

  return `
Installed skills:

${markdownTable(
  ["Name", "Enabled", "Description", "Source"],
  skills.map(skill => [
    skill.name,
    skill.enabled ? "yes" : "no",
    skill.description,
    skill.sourceUrl ?? "",
  ]),
)}
  `.trim();
}

const help = `# /skills list

List installed Token Ring skills, including disabled ones.`;

export default {
  name: "skills list",
  description: "List installed skills",
  help,
  execute,
} satisfies TokenRingAgentCommand;
