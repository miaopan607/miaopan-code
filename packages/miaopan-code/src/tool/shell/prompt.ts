import { Schema } from "effect"
import { PositiveInt } from "@miaopan-code/core/schema"
import { t } from "@miaopan-code/core/i18n"
import { Global } from "@miaopan-code/core/global"
import { ShellID } from "./id"
import type { Language } from "@miaopan-code/core/i18n"
import { PromptI18n } from "@/i18n/prompt"

const PS = new Set(["powershell", "pwsh"])
const CMD = new Set(["cmd"])

export type Limits = {
  maxLines: number
  maxBytes: number
}

export function parameterSchema(language: Language = "zh-CN") {
  return Schema.Struct({
    command: Schema.String.annotate({ description: t(language, "tool.param.shell_command") }),
    timeout: Schema.optional(PositiveInt).annotate({ description: t(language, "tool.param.shell_timeout") }),
    workdir: Schema.optional(Schema.String).annotate({
      description: t(language, "tool.param.shell_workdir"),
    }),
  })
}

export const Parameters = parameterSchema()
export type Parameters = Schema.Schema.Type<typeof Parameters>

function renderPrompt(template: string, values: Record<string, string>, language: Language) {
  return template.replace(/\$\{(\w+)\}/g, (_, key: string) => {
    const value = values[key]
    if (value === undefined) throw new Error(t(language, "error.shell_prompt_missing", { key }))
    return value
  })
}

function shellDisplayName(name: string) {
  if (name === "pwsh") return "PowerShell (7+)"
  if (name === "powershell") return "Windows PowerShell (5.1)"
  if (name === "cmd") return "cmd.exe"
  return name
}

function chainGuidance(name: string, language: Language) {
  if (name === "powershell") return t(language, "tool.shell.chain_powershell")
  if (PS.has(name)) return t(language, "tool.shell.chain_powershell7")
  if (CMD.has(name)) return t(language, "tool.shell.chain_cmd")
  return t(language, "tool.shell.chain_bash")
}

function commandSectionKey(name: string) {
  if (name === "pwsh") return "tool.shell.command_section_pwsh" as const
  if (name === "powershell") return "tool.shell.command_section_powershell" as const
  if (CMD.has(name)) return "tool.shell.command_section_cmd" as const
  return "tool.shell.command_section_bash" as const
}

function directoryCheck(name: string, language: Language) {
  if (PS.has(name)) return t(language, "tool.shell.directory_check_powershell")
  if (CMD.has(name)) return t(language, "tool.shell.directory_check_cmd")
  return t(language, "tool.shell.directory_check_bash")
}

function commandSection(
  name: string,
  platform: NodeJS.Platform,
  chain: string,
  limits: Limits,
  defaultTimeoutMs: number,
  language: Language,
) {
  return t(language, commandSectionKey(name), {
    shell: PS.has(name) ? "PowerShell" : CMD.has(name) ? "cmd.exe" : "Bash",
    directoryCheck: directoryCheck(name, language),
    tools: t(language, "tool.shell.tool_priority"),
    chain,
    defaultTimeoutMs,
    maxLines: limits.maxLines,
    maxBytes: limits.maxBytes,
    pathSep: platform === "win32" ? "\\" : "/",
  })
}

function profile(
  name: string,
  platform: NodeJS.Platform,
  limits: Limits,
  defaultTimeoutMs: number,
  language: Language,
) {
  const isPowerShell = PS.has(name)
  const chain = chainGuidance(name, language)
  if (CMD.has(name)) {
    return {
      intro: t(language, "tool.shell.intro", { shell: shellDisplayName(name) }),
      workdirSection: t(language, "tool.shell.workdir"),
      commandSection: commandSection(name, platform, chain, limits, defaultTimeoutMs, language),
      gitCommands: t(language, "tool.shell.git_commands"),
      gitCommandRestriction: t(language, "tool.shell.git_commands"),
      createPrInstruction: t(language, "tool.shell.create_pr_cmd"),
      createPrExample: t(language, "tool.shell.create_pr_example_cmd"),
    }
  }
  if (isPowerShell) {
    return {
      intro: t(language, "tool.shell.intro", { shell: shellDisplayName(name) }),
      workdirSection: t(language, "tool.shell.workdir"),
      commandSection: commandSection(name, platform, chain, limits, defaultTimeoutMs, language),
      gitCommands: t(language, "tool.shell.git_commands"),
      gitCommandRestriction: t(language, "tool.shell.git_commands"),
      createPrInstruction: t(language, "tool.shell.create_pr_powershell"),
      createPrExample: t(language, "tool.shell.create_pr_example_powershell"),
    }
  }
  return {
    intro: t(language, "tool.shell.intro_bash"),
    workdirSection: t(language, "tool.shell.workdir_bash"),
    commandSection: commandSection(name, platform, chain, limits, defaultTimeoutMs, language),
    gitCommands: t(language, "tool.shell.bash_commands"),
    gitCommandRestriction: t(language, "tool.shell.git_bash_commands"),
    createPrInstruction: t(language, "tool.shell.create_pr_bash"),
    createPrExample: t(language, "tool.shell.create_pr_example_bash"),
  }
}

export function render(
  name: string,
  platform: NodeJS.Platform,
  limits: Limits,
  defaultTimeoutMs: number,
  language: Language = "zh-CN",
) {
  const selected = profile(name, platform, limits, defaultTimeoutMs, language)
  return {
    description: renderPrompt(
      PromptI18n.text(language, "tool.shell"),
      {
        intro: selected.intro,
        os: platform,
        shell: name,
        tmp: Global.Path.tmp,
        workdirSection: selected.workdirSection,
        commandSection: selected.commandSection,
        gitCommands: selected.gitCommands,
        toolName: ShellID.ToolID,
        gitCommandRestriction: selected.gitCommandRestriction,
        createPrInstruction: selected.createPrInstruction,
        createPrExample: selected.createPrExample,
      },
      language,
    ),
    parameters: parameterSchema(language),
  }
}

export * as ShellPrompt from "./prompt"
