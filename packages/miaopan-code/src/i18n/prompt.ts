import type { Language } from "@miaopan-code/core/i18n"
import AGENT_GENERATE_EN from "../agent/generate.txt"
import AGENT_GENERATE_ZH_CN from "../agent/generate.zh-CN.txt"
import AGENT_COMPACTION_EN from "../agent/prompt/compaction.txt"
import AGENT_COMPACTION_ZH_CN from "../agent/prompt/compaction.zh-CN.txt"
import AGENT_EXPLORE_EN from "../agent/prompt/explore.txt"
import AGENT_EXPLORE_ZH_CN from "../agent/prompt/explore.zh-CN.txt"
import AGENT_SUMMARY_EN from "../agent/prompt/summary.txt"
import AGENT_SUMMARY_ZH_CN from "../agent/prompt/summary.zh-CN.txt"
import AGENT_TITLE_EN from "../agent/prompt/title.txt"
import AGENT_TITLE_ZH_CN from "../agent/prompt/title.zh-CN.txt"
import COMMAND_CODEX_REVIEW_EN from "../command/template/codex-review.txt"
import COMMAND_CODEX_REVIEW_ZH_CN from "../command/template/codex-review.zh-CN.txt"
import COMMAND_INITIALIZE_EN from "../command/template/initialize.txt"
import COMMAND_INITIALIZE_ZH_CN from "../command/template/initialize.zh-CN.txt"
import COMMAND_GOAL_EN from "../command/template/goal.txt"
import COMMAND_GOAL_ZH_CN from "../command/template/goal.zh-CN.txt"
import COMMAND_REVIEW_EN from "../command/template/review.txt"
import COMMAND_REVIEW_ZH_CN from "../command/template/review.zh-CN.txt"
import SESSION_ANTHROPIC_EN from "../session/prompt/anthropic.txt"
import SESSION_ANTHROPIC_ZH_CN from "../session/prompt/anthropic.zh-CN.txt"
import SESSION_BEAST_EN from "../session/prompt/beast.txt"
import SESSION_BEAST_ZH_CN from "../session/prompt/beast.zh-CN.txt"
import SESSION_BUILD_SWITCH_EN from "../session/prompt/build-switch.txt"
import SESSION_BUILD_SWITCH_ZH_CN from "../session/prompt/build-switch.zh-CN.txt"
import SESSION_CODEX_EN from "../session/prompt/codex.txt"
import SESSION_CODEX_ZH_CN from "../session/prompt/codex.zh-CN.txt"
import SESSION_COPILOT_GPT_5_EN from "../session/prompt/copilot-gpt-5.txt"
import SESSION_COPILOT_GPT_5_ZH_CN from "../session/prompt/copilot-gpt-5.zh-CN.txt"
import SESSION_DEFAULT_EN from "../session/prompt/default.txt"
import SESSION_DEFAULT_ZH_CN from "../session/prompt/default.zh-CN.txt"
import SESSION_GEMINI_EN from "../session/prompt/gemini.txt"
import SESSION_GEMINI_ZH_CN from "../session/prompt/gemini.zh-CN.txt"
import SESSION_GPT_EN from "../session/prompt/gpt.txt"
import SESSION_GPT_ZH_CN from "../session/prompt/gpt.zh-CN.txt"
import SESSION_KIMI_EN from "../session/prompt/kimi.txt"
import SESSION_KIMI_ZH_CN from "../session/prompt/kimi.zh-CN.txt"
import SESSION_META_EN from "../session/prompt/meta.txt"
import SESSION_META_ZH_CN from "../session/prompt/meta.zh-CN.txt"
import SESSION_PLAN_MODE_EN from "../session/prompt/plan-mode.txt"
import SESSION_PLAN_MODE_ZH_CN from "../session/prompt/plan-mode.zh-CN.txt"
import SESSION_TRINITY_EN from "../session/prompt/trinity.txt"
import SESSION_TRINITY_ZH_CN from "../session/prompt/trinity.zh-CN.txt"
import TOOL_APPLY_PATCH_EN from "../tool/apply_patch.txt"
import TOOL_APPLY_PATCH_ZH_CN from "../tool/apply_patch.zh-CN.txt"
import TOOL_EDIT_EN from "../tool/edit.txt"
import TOOL_EDIT_ZH_CN from "../tool/edit.zh-CN.txt"
import TOOL_GLOB_EN from "../tool/glob.txt"
import TOOL_GLOB_ZH_CN from "../tool/glob.zh-CN.txt"
import TOOL_GREP_EN from "../tool/grep.txt"
import TOOL_GREP_ZH_CN from "../tool/grep.zh-CN.txt"
import TOOL_LSP_EN from "../tool/lsp.txt"
import TOOL_LSP_ZH_CN from "../tool/lsp.zh-CN.txt"
import TOOL_REQUEST_USER_INPUT_EN from "../tool/request-user-input.txt"
import TOOL_REQUEST_USER_INPUT_ZH_CN from "../tool/request-user-input.zh-CN.txt"
import TOOL_QUESTION_EN from "../tool/question.txt"
import TOOL_QUESTION_ZH_CN from "../tool/question.zh-CN.txt"
import TOOL_READ_EN from "../tool/read.txt"
import TOOL_READ_ZH_CN from "../tool/read.zh-CN.txt"
import TOOL_SHELL_EN from "../tool/shell/shell.txt"
import TOOL_SHELL_ZH_CN from "../tool/shell/shell.zh-CN.txt"
import TOOL_SKILL_EN from "../tool/skill.txt"
import TOOL_SKILL_ZH_CN from "../tool/skill.zh-CN.txt"
import TOOL_TASK_EN from "../tool/task.txt"
import TOOL_TASK_ZH_CN from "../tool/task.zh-CN.txt"
import TOOL_TODOWRITE_EN from "../tool/todowrite.txt"
import TOOL_TODOWRITE_ZH_CN from "../tool/todowrite.zh-CN.txt"
import TOOL_WEBFETCH_EN from "../tool/webfetch.txt"
import TOOL_WEBFETCH_ZH_CN from "../tool/webfetch.zh-CN.txt"
import TOOL_WEBSEARCH_EN from "../tool/websearch.txt"
import TOOL_WEBSEARCH_ZH_CN from "../tool/websearch.zh-CN.txt"
import TOOL_WRITE_EN from "../tool/write.txt"
import TOOL_WRITE_ZH_CN from "../tool/write.zh-CN.txt"

export const messages = {
  "agent.generate": { "zh-CN": AGENT_GENERATE_ZH_CN, en: AGENT_GENERATE_EN },
  "agent.compaction": { "zh-CN": AGENT_COMPACTION_ZH_CN, en: AGENT_COMPACTION_EN },
  "agent.explore": { "zh-CN": AGENT_EXPLORE_ZH_CN, en: AGENT_EXPLORE_EN },
  "agent.summary": { "zh-CN": AGENT_SUMMARY_ZH_CN, en: AGENT_SUMMARY_EN },
  "agent.title": { "zh-CN": AGENT_TITLE_ZH_CN, en: AGENT_TITLE_EN },
  "command.initialize": { "zh-CN": COMMAND_INITIALIZE_ZH_CN, en: COMMAND_INITIALIZE_EN },
  "command.goal": { "zh-CN": COMMAND_GOAL_ZH_CN, en: COMMAND_GOAL_EN },
  "command.codex_review": { "zh-CN": COMMAND_CODEX_REVIEW_ZH_CN, en: COMMAND_CODEX_REVIEW_EN },
  "command.review": { "zh-CN": COMMAND_REVIEW_ZH_CN, en: COMMAND_REVIEW_EN },
  "session.anthropic": { "zh-CN": SESSION_ANTHROPIC_ZH_CN, en: SESSION_ANTHROPIC_EN },
  "session.beast": { "zh-CN": SESSION_BEAST_ZH_CN, en: SESSION_BEAST_EN },
  "session.build_switch": { "zh-CN": SESSION_BUILD_SWITCH_ZH_CN, en: SESSION_BUILD_SWITCH_EN },
  "session.codex": { "zh-CN": SESSION_CODEX_ZH_CN, en: SESSION_CODEX_EN },
  "session.copilot_gpt_5": { "zh-CN": SESSION_COPILOT_GPT_5_ZH_CN, en: SESSION_COPILOT_GPT_5_EN },
  "session.default": { "zh-CN": SESSION_DEFAULT_ZH_CN, en: SESSION_DEFAULT_EN },
  "session.gemini": { "zh-CN": SESSION_GEMINI_ZH_CN, en: SESSION_GEMINI_EN },
  "session.gpt": { "zh-CN": SESSION_GPT_ZH_CN, en: SESSION_GPT_EN },
  "session.kimi": { "zh-CN": SESSION_KIMI_ZH_CN, en: SESSION_KIMI_EN },
  "session.meta": { "zh-CN": SESSION_META_ZH_CN, en: SESSION_META_EN },
  "session.plan_mode": { "zh-CN": SESSION_PLAN_MODE_ZH_CN, en: SESSION_PLAN_MODE_EN },
  "session.trinity": { "zh-CN": SESSION_TRINITY_ZH_CN, en: SESSION_TRINITY_EN },
  "tool.apply_patch": { "zh-CN": TOOL_APPLY_PATCH_ZH_CN, en: TOOL_APPLY_PATCH_EN },
  "tool.edit": { "zh-CN": TOOL_EDIT_ZH_CN, en: TOOL_EDIT_EN },
  "tool.glob": { "zh-CN": TOOL_GLOB_ZH_CN, en: TOOL_GLOB_EN },
  "tool.grep": { "zh-CN": TOOL_GREP_ZH_CN, en: TOOL_GREP_EN },
  "tool.lsp": { "zh-CN": TOOL_LSP_ZH_CN, en: TOOL_LSP_EN },
  "tool.request_user_input": { "zh-CN": TOOL_REQUEST_USER_INPUT_ZH_CN, en: TOOL_REQUEST_USER_INPUT_EN },
  "tool.question": { "zh-CN": TOOL_QUESTION_ZH_CN, en: TOOL_QUESTION_EN },
  "tool.read": { "zh-CN": TOOL_READ_ZH_CN, en: TOOL_READ_EN },
  "tool.shell": { "zh-CN": TOOL_SHELL_ZH_CN, en: TOOL_SHELL_EN },
  "tool.skill": { "zh-CN": TOOL_SKILL_ZH_CN, en: TOOL_SKILL_EN },
  "tool.task": { "zh-CN": TOOL_TASK_ZH_CN, en: TOOL_TASK_EN },
  "tool.todowrite": { "zh-CN": TOOL_TODOWRITE_ZH_CN, en: TOOL_TODOWRITE_EN },
  "tool.webfetch": { "zh-CN": TOOL_WEBFETCH_ZH_CN, en: TOOL_WEBFETCH_EN },
  "tool.websearch": { "zh-CN": TOOL_WEBSEARCH_ZH_CN, en: TOOL_WEBSEARCH_EN },
  "tool.write": { "zh-CN": TOOL_WRITE_ZH_CN, en: TOOL_WRITE_EN },
} as const

export type PromptKey = keyof typeof messages

export function text(language: Language | undefined, key: PromptKey) {
  return messages[key][language === "en" ? "en" : "zh-CN"]
}

export * as PromptI18n from "./prompt"
