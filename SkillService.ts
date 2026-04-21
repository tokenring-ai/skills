import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { type AgentCommandService, SubAgentService } from "@tokenring-ai/agent";
import type Agent from "@tokenring-ai/agent/Agent";
import { CommandFailedError } from "@tokenring-ai/agent/AgentError";
import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import ChatService from "@tokenring-ai/chat/ChatService";
import runChat from "@tokenring-ai/chat/runChat";
import { getChatAnalytics } from "@tokenring-ai/chat/util/getChatAnalytics";
import deepMerge from "@tokenring-ai/utility/object/deepMerge";
import markdownList from "@tokenring-ai/utility/string/markdownList";
import type { z } from "zod";
import type { TokenRingService } from "../app/types.ts";
import { SkillsAgentConfigSchema, type SkillsConfigSchema } from "./schema.ts";
import { SkillState } from "./state/SkillState.ts";

export type SkillFrontmatter = {
  name?: string | undefined;
  description?: string | undefined;
  argumentHint?: string | undefined;
  disableModelInvocation?: boolean | undefined;
  userInvocable?: boolean | undefined;
  context?: string | undefined;
  agent?: string | undefined;
};

export type SkillDefinition = {
  slug: string;
  name: string;
  description: string;
  directory: string;
  file: string;
  enabled: boolean;
  frontmatter: SkillFrontmatter;
  body: string;
  sourceUrl?: string | undefined;
};

type SkillRegistryEntry = {
  url?: string | undefined;
  installedAt: string;
  updatedAt: string;
};

export default class SkillService implements TokenRingService {
  readonly name = "SkillService";
  description = "Service for managing and running Token Ring skills";

  private commandService?: AgentCommandService;
  private registeredDynamicCommands = new Set<string>();

  constructor(readonly options: z.output<typeof SkillsConfigSchema>) {}

  attach(agent: Agent): void {
    const config = deepMerge(this.options.agentDefaults, agent.getAgentConfigSlice("skills", SkillsAgentConfigSchema));

    agent.initializeState(SkillState, config);
  }

  async start(): Promise<void> {
    await fs.mkdir(this.resolveSkillsDirectory(), { recursive: true });
    await fs.mkdir(this.options.tempDirectory, { recursive: true });
    await this.ensureRegistryFile();
  }

  setCommandService(commandService: AgentCommandService): void {
    this.commandService = commandService;
  }

  async registerDynamicSkillCommands(): Promise<void> {
    if (!this.commandService) return;
    const skills = await this.listInstalledSkills();
    for (const skill of skills) {
      if (skill.frontmatter.userInvocable === false) continue;
      if (this.registeredDynamicCommands.has(skill.name)) continue;
      this.commandService.addAgentCommands(this.createSkillCommand(skill.name));
      this.registeredDynamicCommands.add(skill.name);
    }
  }

  async listSkills(agent: Agent, { includeDisabled = true }: { includeDisabled?: boolean | undefined } = {}): Promise<SkillDefinition[]> {
    const skills = await this.listInstalledSkills();
    const enabledSkills = agent.getState(SkillState).enabledSkills;
    const resolvedSkills = skills.map(skill => ({
      ...skill,
      enabled: enabledSkills.has(skill.name),
    }));

    return includeDisabled ? resolvedSkills : resolvedSkills.filter(skill => skill.enabled);
  }

  async getSkill(name: string, agent: Agent): Promise<SkillDefinition> {
    const skills = await this.listSkills(agent, { includeDisabled: true });
    const skill = skills.find(item => item.name === name || item.slug === name);
    if (!skill) throw new CommandFailedError(`Skill "${name}" not found.`);
    return skill;
  }

  async downloadSkill(zipUrl: string, agent: Agent): Promise<SkillDefinition> {
    if (!zipUrl.trim()) throw new CommandFailedError("zipUrl is required");
    const tempRoot = await fs.mkdtemp(path.join(this.options.tempDirectory || path.join(tmpdir(), "tokenring-skills"), "download-"));
    const zipFile = path.join(tempRoot, "skill.zip");
    try {
      const response = await fetch(zipUrl);
      if (!response.ok) throw new Error(`Failed to download skill archive (${response.status})`);
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(zipFile, buffer);

      const extractDir = path.join(tempRoot, "extract");
      await fs.mkdir(extractDir, { recursive: true });
      await this.unzip(zipFile, extractDir);

      const skillEntryDir = await this.findExtractedSkillDirectory(extractDir);
      const skillFile = path.join(skillEntryDir, "SKILL.md");
      const parsed = await this.readSkillFromFile(skillEntryDir, skillFile, zipUrl);
      const slug = this.slugify(parsed.name || path.basename(skillEntryDir));
      const targetDir = path.join(this.resolveSkillsDirectory(), slug);

      await fs.rm(targetDir, { recursive: true, force: true });
      await fs.mkdir(path.dirname(targetDir), { recursive: true });
      await fs.cp(skillEntryDir, targetDir, { recursive: true });
      await this.writeRegistryEntry(slug, {
        url: zipUrl,
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      agent.mutateState(SkillState, state => {
        state.enabledSkills.add(parsed.name);
      });

      const installed = await this.getSkill(slug, agent);
      await this.registerDynamicSkillCommands();
      return installed;
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  }

  async deleteSkill(name: string, agent: Agent): Promise<void> {
    const skill = await this.getSkill(name, agent);
    await fs.rm(skill.directory, { recursive: true, force: true });
    await this.deleteRegistryEntry(skill.slug);
    agent.mutateState(SkillState, state => {
      state.enabledSkills.delete(skill.name);
    });
  }

  async enableSkill(name: string, agent: Agent): Promise<SkillDefinition> {
    const skill = await this.getSkill(name, agent);
    agent.mutateState(SkillState, state => {
      state.enabledSkills.add(skill.name);
    });
    await this.registerDynamicSkillCommands();
    return await this.getSkill(name, agent);
  }

  async disableSkill(name: string, agent: Agent): Promise<SkillDefinition> {
    const skill = await this.getSkill(name, agent);
    agent.mutateState(SkillState, state => {
      state.enabledSkills.delete(skill.name);
    });
    return await this.getSkill(name, agent);
  }

  async resetSkill(name: string, agent: Agent): Promise<SkillDefinition> {
    const skill = await this.getSkill(name, agent);
    const registry = await this.readRegistry();
    const entry = registry[skill.slug];
    if (entry?.url) {
      return await this.downloadSkill(entry.url, agent);
    }
    agent.mutateState(SkillState, state => {
      state.enabledSkills.add(skill.name);
    });
    return await this.getSkill(name, agent);
  }

  async runSkill(name: string, prompt: string, agent: Agent): Promise<string> {
    const skill = await this.getSkill(name, agent);
    if (!skill.enabled) throw new CommandFailedError(`Skill "${name}" is disabled.`);

    const rendered = this.renderSkillPrompt(skill, prompt, agent);

    const { subAgent: options } = agent.getState(SkillState);

    if (skill.frontmatter.context === "fork") {
      const subAgentService = agent.requireServiceByType(SubAgentService);
      const result = await subAgentService.runSubAgent({
        agentType: skill.frontmatter.agent ?? this.options.defaultSkillAgentType,
        headless: agent.headless,
        from: `Skill ${name}`,
        steps: [`/work ${rendered}`],
        parentAgent: agent,
        options,
      });

      if (result.status !== "success") {
        throw new CommandFailedError(result.response || `Skill "${name}" failed`);
      }
      return result.response;
    }

    const chatService = agent.requireServiceByType(ChatService);
    const chatConfig = chatService.getChatConfig(agent);
    const response = await runChat({ input: rendered, chatConfig, agent });
    return `Skill ${name} complete\n${markdownList(getChatAnalytics(response))}`;
  }

  private async listInstalledSkills(): Promise<SkillDefinition[]> {
    const skillsDir = this.resolveSkillsDirectory();
    await fs.mkdir(skillsDir, { recursive: true });
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const registry = await this.readRegistry();
    const skills: SkillDefinition[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const directory = path.join(skillsDir, entry.name);
      const skillFile = path.join(directory, "SKILL.md");
      if (!(await this.pathExists(skillFile))) continue;
      const skill = await this.readSkillFromFile(directory, skillFile, registry[entry.name]?.url);
      skills.push(skill);
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  private createSkillCommand(name: string): TokenRingAgentCommand<any> {
    const inputSchema = {
      args: {},
      remainder: {
        name: "prompt",
        description: "Skill prompt",
        defaultValue: "Run this skill",
      },
    } as const satisfies AgentCommandInputSchema;

    return {
      name,
      description: `/${name} - Run the ${name} skill`,
      help: `Run the ${name} skill with an optional prompt.`,
      inputSchema,
      execute: async ({ remainder, agent }: AgentCommandInputType<typeof inputSchema>) => await this.runSkill(name, remainder, agent),
    } satisfies TokenRingAgentCommand<typeof inputSchema>;
  }

  private renderSkillPrompt(skill: SkillDefinition, prompt: string, agent: Agent): string {
    const args = prompt.trim().length > 0 ? prompt.trim().split(/\s+/) : [];
    let body = skill.body;
    body = body.replace(/\$ARGUMENTS\b/g, prompt.trim());
    body = body.replace(/\$ARGUMENTS\[(\d+)\]/g, (_match, index) => args[Number(index)] ?? "");
    body = body.replace(/\$(\d+)\b/g, (_match, index) => args[Number(index)] ?? "");
    body = body.replace(/\$\{TOKENRING_SKILL_DIR\}/g, skill.directory);
    body = body.replace(/\$\{TOKENRING_SESSION_ID\}/g, agent.id);

    if (!/\$ARGUMENTS|\$\d+\b/.test(skill.body) && prompt.trim()) {
      body = `${body}\n\nARGUMENTS: ${prompt.trim()}`;
    }

    return body;
  }

  private async readSkillFromFile(directory: string, skillFile: string, sourceUrl?: string): Promise<SkillDefinition> {
    const content = await fs.readFile(skillFile, "utf8");
    const { frontmatter, body } = this.parseSkill(content);
    const slug = this.slugify(frontmatter.name || path.basename(directory));
    const description = frontmatter.description || body.split(/\n\s*\n/)[0]?.trim() || `Skill ${slug}`;

    return {
      slug,
      name: this.slugify(frontmatter.name || path.basename(directory)),
      description,
      directory,
      file: skillFile,
      enabled: true,
      frontmatter,
      body,
      sourceUrl,
    };
  }

  private parseSkill(content: string): {
    frontmatter: SkillFrontmatter;
    body: string;
  } {
    const lines = content.split(/\r?\n/);
    if (lines[0]?.trim() !== "---") {
      return { frontmatter: {}, body: content.trim() };
    }

    const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    if (endIndex === -1) return { frontmatter: {}, body: content.trim() };

    const frontmatterLines = lines.slice(1, endIndex);
    const body = lines
      .slice(endIndex + 1)
      .join("\n")
      .trim();
    const frontmatter: SkillFrontmatter = {};

    for (const line of frontmatterLines) {
      const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (!match) continue;
      const rawKey = match[1].trim();
      const rawValue = match[2].trim();
      const key = rawKey.toLowerCase();
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      switch (key) {
        case "name":
          frontmatter.name = this.slugify(value);
          break;
        case "description":
          frontmatter.description = value;
          break;
        case "argument-hint":
          frontmatter.argumentHint = value;
          break;
        case "disable-model-invocation":
          frontmatter.disableModelInvocation = value === "true";
          break;
        case "user-invocable":
          frontmatter.userInvocable = value !== "false";
          break;
        case "context":
          frontmatter.context = value;
          break;
        case "agent":
          frontmatter.agent = value;
          break;
      }
    }

    return { frontmatter, body };
  }

  private slugify(value: string): string {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "skill"
    );
  }

  private resolveSkillsDirectory(): string {
    return path.resolve(process.cwd(), this.options.skillsDirectory);
  }

  private async ensureRegistryFile(): Promise<void> {
    const registryFile = path.resolve(process.cwd(), this.options.registryFile);
    await fs.mkdir(path.dirname(registryFile), { recursive: true });
    if (!(await this.pathExists(registryFile))) {
      await fs.writeFile(registryFile, "{}\n");
    }
  }

  private async readRegistry(): Promise<Record<string, SkillRegistryEntry>> {
    await this.ensureRegistryFile();
    const registryFile = path.resolve(process.cwd(), this.options.registryFile);
    const raw = await fs.readFile(registryFile, "utf8");
    return JSON.parse(raw || "{}") as Record<string, SkillRegistryEntry>;
  }

  private async writeRegistry(registry: Record<string, SkillRegistryEntry>): Promise<void> {
    const registryFile = path.resolve(process.cwd(), this.options.registryFile);
    await fs.writeFile(registryFile, `${JSON.stringify(registry, null, 2)}\n`);
  }

  private async writeRegistryEntry(skill: string, entry: SkillRegistryEntry): Promise<void> {
    const registry = await this.readRegistry();
    registry[skill] = entry;
    await this.writeRegistry(registry);
  }

  private async deleteRegistryEntry(skill: string): Promise<void> {
    const registry = await this.readRegistry();
    delete registry[skill];
    await this.writeRegistry(registry);
  }

  private async pathExists(file: string): Promise<boolean> {
    try {
      await fs.access(file);
      return true;
    } catch {
      return false;
    }
  }

  private async unzip(zipFile: string, destination: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("unzip", ["-q", zipFile, "-d", destination], {
        stdio: "ignore",
      });
      child.on("error", reject);
      child.on("exit", code => {
        if (code === 0) resolve();
        else reject(new Error(`unzip failed with exit code ${code}`));
      });
    });
  }

  private async findExtractedSkillDirectory(root: string): Promise<string> {
    const queue = [root];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "__MACOSX") continue;
        const fullPath = path.join(current, entry.name);
        if (entry.isFile() && entry.name === "SKILL.md") {
          return current;
        }
        if (entry.isDirectory()) {
          queue.push(fullPath);
        }
      }
    }
    throw new Error("Downloaded archive did not contain a SKILL.md file");
  }
}
