import { EOL } from "os"
import { cmd } from "../cmd"
import { UI } from "@/cli/ui"

export const StartupCommand = cmd({
  command: "startup",
  describe: UI.t("cli.show_debug"),
  builder: (yargs) => yargs,
  handler() {
    process.stdout.write(performance.now().toString() + EOL)
  },
})
