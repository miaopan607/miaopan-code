import { $ } from "bun"

await $`bun ./scripts/copy-icons.ts ${process.env.MIAOPAN_CODE_CHANNEL ?? "dev"}`

await $`cd ../miaopanCode && bun script/build-node.ts`
