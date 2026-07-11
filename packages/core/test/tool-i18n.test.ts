import { expect, test } from "bun:test"
import { FileSystem } from "@miaopan-code/core/filesystem"
import { AbsolutePath, RelativePath } from "@miaopan-code/core/schema"
import { SkillV2 } from "@miaopan-code/core/skill"
import { ApplyPatchTool } from "@miaopan-code/core/tool/apply-patch"
import { EditTool } from "@miaopan-code/core/tool/edit"
import { GlobTool } from "@miaopan-code/core/tool/glob"
import { GrepTool } from "@miaopan-code/core/tool/grep"
import { QuestionTool } from "@miaopan-code/core/tool/question"
import { SkillTool } from "@miaopan-code/core/tool/skill"
import { WebSearchTool } from "@miaopan-code/core/tool/websearch"
import { WriteTool } from "@miaopan-code/core/tool/write"

test("Core tool model output uses the requested English locale", () => {
  expect(
    ApplyPatchTool.toModelOutput(
      ApplyPatchTool.Output.make({
        applied: [{ type: "add", resource: "new.txt", target: "/workspace/new.txt" }],
        files: [],
      }),
      "en",
    ),
  ).toBe("Applied patch sequentially:\nA new.txt")

  expect(
    EditTool.toModelOutput(
      EditTool.Output.make({
        files: [
          {
            file: "hello.txt",
            patch: "",
            status: "modified",
            additions: 1,
            deletions: 1,
          },
        ],
        replacements: 1,
      }),
      "before",
      "after",
      "en",
    ),
  ).toBe("Edited file successfully: hello.txt\nReplacements: 1\n```diff\n-before\n+after\n```")

  expect(GlobTool.toModelOutput([], "en")).toBe("No files found")
  expect(
    GlobTool.toModelOutput([FileSystem.Entry.make({ path: RelativePath.make("src/index.ts"), type: "file" })], "en"),
  ).toBe("src/index.ts")

  expect(
    GrepTool.toModelOutput(
      [
        FileSystem.Match.make({
          entry: FileSystem.Entry.make({ path: RelativePath.make("src/index.ts"), type: "file" }),
          line: 2,
          offset: 10,
          text: "const value = true",
          submatches: [],
        }),
      ],
      "en",
    ),
  ).toBe("Found 1 matches\nsrc/index.ts:\n  Line 2: const value = true")

  expect(
    QuestionTool.toModelOutput(
      [
        {
          question: "Proceed?",
          header: "Action",
          options: [{ label: "Yes", description: "Continue" }],
        },
      ],
      [[]],
      "en",
    ),
  ).toBe(
    'User has answered your questions: "Proceed?"="Unanswered". You can now continue with the user\'s answers in mind.',
  )

  expect(
    SkillTool.toModelOutput(
      SkillV2.Info.make({
        name: "effect",
        description: "Use Effect",
        location: AbsolutePath.make("/skills/effect/SKILL.md"),
        content: "Guidance",
      }),
      ["/skills/effect/reference.md"],
      "en",
    ),
  ).toContain("Base directory for this skill: /skills/effect")

  expect(
    WriteTool.toModelOutput(
      {
        operation: "write",
        target: "/workspace/new.txt",
        resource: "new.txt",
        existed: false,
      },
      "en",
    ),
  ).toBe("Created file successfully: new.txt")
  expect(WebSearchTool.noResults("en")).toBe("No search results found. Please try a different query.")
})
