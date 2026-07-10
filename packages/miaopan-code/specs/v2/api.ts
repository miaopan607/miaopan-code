// @ts-nocheck

import { MiaopanCode } from "@miaopan-code/core"
import { ReadTool } from "@miaopan-code/core/tools"

const miaopanCode = MiaopanCode.make({})

miaopanCode.tool.add(ReadTool)

miaopanCode.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

miaopanCode.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

miaopanCode.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await miaopanCode.session.create({
  agent: "build",
})

miaopanCode.subscribe((event) => {
  console.log(event)
})

await miaopanCode.session.prompt({
  sessionID,
  text: "hey what is up",
})

await miaopanCode.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await miaopanCode.session.wait()

console.log(await miaopanCode.session.messages(sessionID))
