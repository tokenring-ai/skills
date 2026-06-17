import skills from "./commands/skills.ts";
import remove from "./commands/skills/delete.ts";
import disable from "./commands/skills/disable.ts";
import download from "./commands/skills/download.ts";
import enable from "./commands/skills/enable.ts";
import list from "./commands/skills/list.ts";
import reset from "./commands/skills/reset.ts";
import run from "./commands/skills/run.ts";

export default [skills, list, download, run, remove, enable, disable, reset];
