import { Plugin } from "./index.js"
import { tool } from "./tool.js"
import { resolveLanguage, t } from "./i18n.js"

export const ExamplePlugin: Plugin = async (_ctx, options) => {
  const language = resolveLanguage(options?.language)
  return {
    tool: {
      mytool: tool({
        description: t(language, "example_tool_description"),
        args: {
          foo: tool.schema.string().describe("foo"),
        },
        async execute(args) {
          return t(language, "example_tool_greeting", { name: args.foo })
        },
      }),
    },
  }
}
