# @tokenring-ai/skills

Agent skills system for Token Ring that provides a framework for creating, managing, and executing AI-powered skills. Skills are stored as markdown files with frontmatter metadata and can be downloaded, enabled/disabled, and invoked through both chat tools and agent commands.

## Overview

The `@tokenring-ai/skills` package implements a skill management system that allows Token Ring agents to extend their capabilities through downloadable skill packages. Each skill is a self-contained module with its own prompt template, configuration, and execution context.

### Key Features

- **Download and Install Skills**: Download and install skills from zip file URLs
- **Enable/Disable Skills**: Enable or disable individual skills per agent
- **Direct Skill Invocation**: Invoke skills directly via `/skill-name [prompt]` commands
- **Chat Tools**: Manage skills through 7 chat tools for programmatic access
- **Agent Commands**: Full-featured `/skills` command with 8 subcommands
- **Automatic Command Registration**: User-invocable skills are automatically registered as agent commands
- **State Persistence**: Enabled skills persist across agent sessions via `SkillState`
- **Dual Execution Contexts**: Support for both chat-based and sub-agent execution

## Installation

```bash
bun add @tokenring-ai/skills
```

### Dependencies

- `@tokenring-ai/agent` - Core agent system
- `@tokenring-ai/app` - Application framework
- `@tokenring-ai/chat` - Chat service and tool system
- `@tokenring-ai/utility` - Shared utilities
- `zod` - Schema validation

## Configuration

The package accepts the following configuration options via `SkillsConfigSchema`:

```typescript
import {SkillsConfigSchema} from "@tokenring-ai/skills";

const config = {
  skills: {
    // Directory where skills are stored (default: ".tokenring/skills")
    skillsDirectory: ".tokenring/skills",
    
    // Registry file for tracking downloaded skills (default: ".tokenring/skills/.skills-registry.json")
    registryFile: ".tokenring/skills/.skills-registry.json",
    
    // Temporary directory for skill downloads (default: "/tmp/tokenring-skills")
    tempDirectory: "/tmp/tokenring-skills",
    
    // Default agent type for skill execution (default: "general-purpose")
    defaultSkillAgentType: "general-purpose",
    
    // Agent configuration defaults for skills
    agentDefaults: {
      enabledSkills: [] // Array of skill names to enable by default
    }
  }
};
```

## Core Components

### SkillService

The main service class that manages skill lifecycle, storage, and execution.

**Key Methods:**

#### `listSkills(agent: Agent, {includeDisabled?}): Promise<SkillDefinition[]>`

List all installed skills with their enabled status.

```typescript
const skills = await agent.requireServiceByType(SkillService).listSkills(agent, {includeDisabled: true});
```

**Returns:** Array of `SkillDefinition` objects containing:

- `slug` - URL-safe identifier
- `name` - Human-readable skill name
- `description` - Skill description
- `directory` - File system path
- `file` - Path to SKILL.md file
- `enabled` - Whether skill is currently enabled
- `frontmatter` - Skill metadata
- `body` - Skill prompt template
- `sourceUrl` - Original download URL (if applicable)

#### `getSkill(name: string, agent: Agent): Promise<SkillDefinition>`

Retrieve a specific skill by name or slug.

```typescript
const skill = await agent.requireServiceByType(SkillService).getSkill("code-review", agent);
```

#### `downloadSkill(zipUrl: string, agent: Agent): Promise<SkillDefinition>`

Download and install a skill from a zip file URL.

```typescript
const skill = await agent.requireServiceByType(SkillService).downloadSkill("https://example.com/skills/code-review.zip", agent);
```

**Process:**

1. Downloads zip file to temporary directory
2. Extracts to find SKILL.md file
3. Parses frontmatter and body
4. Copies to skills directory
5. Updates registry with source URL
6. Enables skill by default
7. Registers dynamic commands

#### `deleteSkill(name: string, agent: Agent): Promise<void>`

Remove a skill from the system.

```typescript
await agent.requireServiceByType(SkillService).deleteSkill("code-review", agent);
```

#### `enableSkill(name: string, agent: Agent): Promise<SkillDefinition>`

Enable a disabled skill.

```typescript
const skill = await agent.requireServiceByType(SkillService).enableSkill("code-review", agent);
```

#### `disableSkill(name: string, agent: Agent): Promise<SkillDefinition>`

Disable a skill without removing it.

```typescript
const skill = await agent.requireServiceByType(SkillService).disableSkill("code-review", agent);
```

#### `resetSkill(name: string, agent: Agent): Promise<SkillDefinition>`

Reset a skill to its downloaded state (re-downloads if source URL available).

```typescript
const skill = await agent.requireServiceByType(SkillService).resetSkill("code-review", agent);
```

#### `runSkill(name: string, prompt: string, agent: Agent): Promise<string>`

Execute a skill with the given prompt.

```typescript
const result = await agent.requireServiceByType(SkillService).runSkill("code-review", "Review this pull request", agent);
```

**Execution Modes:**

- **Context: "fork"** - Runs in a sub-agent with specified agent type
- **Default** - Runs through the main chat service

### SkillState

State slice for tracking enabled skills per agent.

```typescript
import {SkillState} from "@tokenring-ai/skills";

// Access enabled skills
const enabledSkills = agent.getState(SkillState).enabledSkills;

// Modify enabled skills
agent.mutateState(SkillState, (state) => {
  state.enabledSkills.add("code-review");
});
```

## Skill Definition Format

Skills are stored as markdown files with YAML-style frontmatter.

### SKILL.md Structure

```markdown
---
name: code-review
description: Reviews code changes and provides suggestions
argument-hint: "file-path or code snippet"
user-invocable: true
context: fork
agent: general-purpose
---

# Code Review Skill

You are an expert code reviewer. Analyze the provided code and:

1. Identify potential bugs and issues
2. Suggest improvements
3. Check for best practices

$ARGUMENTS

## Context Variables

- `${TOKENRING_SKILL_DIR}` - Path to skill directory
- `${TOKENRING_SESSION_ID}` - Current agent session ID

## Argument Placeholders

- `$ARGUMENTS` - Full prompt text
- `$ARGUMENTS[0]` - First argument
- `$ARGUMENTS[1]` - Second argument
- `$0`, `$1` - Alternative argument syntax
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Skill name (slugified if not provided) |
| `description` | string | No | Skill description |
| `argument-hint` | string | No | Hint for command usage |
| `disable-model-invocation` | boolean | No | Disable AI model invocation |
| `user-invocable` | boolean | No | Whether to register as agent command (default: true) |
| `context` | string | No | Execution context ("fork" for sub-agent, default for chat) |
| `agent` | string | No | Agent type for fork context (default from config) |

## Chat Tools

The package provides 7 chat tools for programmatic skill management:

### `skills_listSkills`

List all installed skills.

```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";

const inputSchema = z.object({
  includeDisabled: z.boolean().default(true).optional(),
});

// Usage
const result = await tools.skills_listSkills.execute({includeDisabled: true}, agent);
```

**Returns:** Array of skill objects with name, description, enabled status, and source URL.

### `skills_downloadSkill`

Download and install a skill from a zip URL.

```typescript
const inputSchema = z.object({
  zipUrl: z.string().url().describe("URL to a zip archive containing a skill with SKILL.md"),
});

// Usage
const result = await tools.skills_downloadSkill.execute(
  {zipUrl: "https://example.com/skills/code-review.zip"},
  agent
);
```

**Returns:** Skill object with name, directory, enabled status, and source URL.

### `skills_runSkill`

Execute a skill with a prompt.

```typescript
const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
  prompt: z.string().optional().describe("Optional prompt or arguments for the skill"),
});

// Usage
const result = await tools.skills_runSkill.execute(
  {name: "code-review", prompt: "Review this PR"},
  agent
);
```

**Returns:** Skill execution result string.

### `skills_deleteSkill`

Remove a skill.

```typescript
const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
});

// Usage
const result = await tools.skills_deleteSkill.execute({name: "code-review"}, agent);
```

**Returns:** Confirmation string.

### `skills_enableSkill`

Enable a disabled skill.

```typescript
const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
});

// Usage
const result = await tools.skills_enableSkill.execute({name: "code-review"}, agent);
```

**Returns:** Skill object with updated enabled status.

### `skills_disableSkill`

Disable a skill.

```typescript
const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
});

// Usage
const result = await tools.skills_disableSkill.execute({name: "code-review"}, agent);
```

**Returns:** Skill object with updated enabled status.

### `skills_resetSkill`

Reset a skill to its downloaded state.

```typescript
const inputSchema = z.object({
  name: z.string().min(1).describe("Installed skill name"),
});

// Usage
const result = await tools.skills_resetSkill.execute({name: "code-review"}, agent);
```

**Returns:** Skill object with source URL and enabled status.

## Agent Commands

The package registers both static and dynamic agent commands.

### Static Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/skills` | Show help and available commands | `/skills` |
| `/skills list` | List all installed skills | `/skills list` |
| `/skills download <zip-url>` | Download and install a skill | `/skills download https://example.com/skill.zip` |
| `/skills run <name> [prompt]` | Run a skill with optional prompt | `/skills run code-review` |
| `/skills delete <name>` | Delete a skill | `/skills delete code-review` |
| `/skills enable <name>` | Enable a skill | `/skills enable code-review` |
| `/skills disable <name>` | Disable a skill | `/skills disable code-review` |
| `/skills reset <name>` | Reset a skill to source | `/skills reset code-review` |

### Dynamic Commands

User-invocable skills (where `user-invocable: true` in frontmatter) are automatically registered as direct commands:

```
/skill-name [prompt]
```

Example:

```
/code-review Review this pull request
```

## Plugin Registration

### Installation via Plugin System

```typescript
import {App} from "@tokenring-ai/app";
import skillsPlugin from "@tokenring-ai/skills/plugin";

const app = new App();

app.install(skillsPlugin, {
  skills: {
    skillsDirectory: ".tokenring/skills",
    registryFile: ".tokenring/skills/.skills-registry.json",
    tempDirectory: "/tmp/tokenring-skills",
    defaultSkillAgentType: "general-purpose",
    agentDefaults: {
      enabledSkills: ["code-review", "documentation"]
    }
  }
});
```

### Service Registration

The plugin automatically registers:

- `SkillService` - Main skill management service
- Chat tools via `ChatService`
- Agent commands via `AgentCommandService`

## State Management

Skills maintain state through the `SkillState` class:

```typescript
// Initialize state (automatic via plugin)
agent.initializeState(SkillState, {
  enabledSkills: ["code-review", "documentation"]
});

// Access state
const state = agent.getState(SkillState);
console.log(state.enabledSkills); // Set<string>

// Modify state
agent.mutateState(SkillState, (state) => {
  state.enabledSkills.add("new-skill");
  state.enabledSkills.delete("old-skill");
});
```

**Serialization:** State is automatically serialized to agent checkpoints and restored on reload.

## Integration Patterns

### Creating a Custom Skill

1. Create a directory with `SKILL.md`:

```bash
mkdir .tokenring/skills/my-skill
```

1. Add `SKILL.md` with frontmatter:

```markdown
---
name: my-skill
description: My custom skill
user-invocable: true
---

# My Custom Skill

This skill does something useful.

$ARGUMENTS
```

1. The skill is automatically registered and available as `/my-skill [prompt]`

### Downloading Skills Programmatically

```typescript
import SkillService from "@tokenring-ai/skills/SkillService";

async function installSkill(agent: Agent, url: string) {
  const skillService = agent.requireServiceByType(SkillService);
  const skill = await skillService.downloadSkill(url, agent);
  console.log(`Installed skill: ${skill.name}`);
  return skill;
}
```

### Checking Skill Status

```typescript
const skillService = agent.requireServiceByType(SkillService);
const skills = await skillService.listSkills(agent, {includeDisabled: true});

const codeReview = skills.find(s => s.name === "code-review");
if (codeReview) {
  console.log(`Enabled: ${codeReview.enabled}`);
  console.log(`Source: ${codeReview.sourceUrl}`);
}
```

## Best Practices

1. **Skill Naming:** Use descriptive, lowercase names with hyphens (e.g., `code-review`, `doc-generator`)

2. **Frontmatter:** Always include `name` and `description` in frontmatter for better discoverability

3. **User Invocability:** Set `user-invocable: false` for skills meant only for internal agent use

4. **Execution Context:** Use `context: fork` for skills that need isolated agent execution

5. **Argument Handling:** Use `$ARGUMENTS` for full prompt or `$ARGUMENTS[0]`, `$0`, etc. for specific arguments

6. **Error Handling:** Skills should handle missing arguments gracefully in their prompt templates

7. **State Management:** Use agent state for skill-specific persistence when needed

## Testing

```bash
cd pkg/skills
bun test
```

### Development

```bash
bun run test:watch
bun run test:coverage
bun run build
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/agent` | 0.2.0 | Core agent system |
| `@tokenring-ai/app` | 0.2.0 | Application framework |
| `@tokenring-ai/chat` | 0.2.0 | Chat service and tools |
| `@tokenring-ai/utility` | 0.2.0 | Shared utilities |
| `zod` | ^4.3.6 | Schema validation |

## Related Components

- `@tokenring-ai/agent` - Core agent system
- `@tokenring-ai/chat` - Chat service and tool system
- `@tokenring-ai/app` - Application framework and plugin system

## License

MIT License - see LICENSE file for details.
