import { t } from "@miaopan-code/core/i18n"
import type { JSX } from "@opentui/solid"
import { Locale } from "../util/locale"
import { useDialog } from "../ui/dialog"
import { DialogPrompt } from "../ui/dialog-prompt"
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select"

type ReviewTarget = "base" | "uncommitted" | "commit" | "custom"

function tr(key: Parameters<typeof t>[1], params?: Record<string, string>) {
  return t(Locale.language(), key, params)
}

export function DialogReview(props: { directory: string; onSelect: (arguments_: string) => void }) {
  const dialog = useDialog()
  const options: DialogSelectOption<ReviewTarget>[] = [
    {
      title: tr("cli.run.review_base_branch"),
      description: tr("cli.run.review_base_branch_description"),
      value: "base",
    },
    {
      title: tr("cli.run.review_uncommitted"),
      description: tr("cli.run.review_uncommitted_description"),
      value: "uncommitted",
    },
    {
      title: tr("cli.run.review_commit"),
      description: tr("cli.run.review_commit_description"),
      value: "commit",
    },
    {
      title: tr("cli.run.review_custom"),
      description: tr("cli.run.review_custom_description"),
      value: "custom",
    },
  ]

  function select(arguments_: string) {
    dialog.clear()
    props.onSelect(arguments_)
  }

  function open(target: ReviewTarget) {
    if (target === "uncommitted") {
      select(tr("cli.run.review_uncommitted_prompt"))
      return
    }
    if (target === "base") {
      loadGit(dialog, props.directory, ["branch", "--format=%(refname:short)"], (branches) => (
        <DialogReviewBranches branches={branches} onSelect={select} />
      ))
      return
    }
    if (target === "commit") {
      loadGit(dialog, props.directory, ["log", "--format=%h%x09%s", "-100"], (lines) => (
        <DialogReviewCommits
          commits={lines.map((line) => {
            const [commit, ...title] = line.split("\t")
            return { commit, title: title.join("\t") }
          })}
          onSelect={select}
        />
      ))
      return
    }
    void DialogPrompt.show(dialog, tr("cli.run.review_custom"), {
      placeholder: tr("cli.run.review_custom_placeholder"),
    }).then((value) => {
      const instructions = value?.trim()
      if (instructions) select(instructions)
    })
  }

  return (
    <DialogSelect title={tr("cli.run.review_select")} options={options} onSelect={(option) => open(option.value)} />
  )
}

function loadGit(
  dialog: ReturnType<typeof useDialog>,
  directory: string,
  args: string[],
  render: (lines: string[]) => JSX.Element,
) {
  const process = Bun.spawn(["git", ...args], { cwd: directory, stdout: "pipe", stderr: "ignore" })
  let completed = false
  let cancelled = false
  dialog.replace(
    () => <DialogSelect title={tr("dialog.loading")} options={[]} locked />,
    () => {
      if (completed) return
      cancelled = true
      process.kill()
    },
  )
  void Promise.all([new Response(process.stdout).text(), process.exited]).then(([output, exitCode]) => {
    completed = true
    if (cancelled) return
    const lines = exitCode === 0 ? output.trim().split("\n").filter(Boolean) : []
    dialog.replace(() => render(lines))
  })
}

function DialogReviewBranches(props: { branches: string[]; onSelect: (arguments_: string) => void }) {
  return (
    <DialogSelect
      title={tr("cli.run.review_select_branch")}
      options={props.branches.map((branch) => ({ title: branch, value: branch }))}
      emptyView={tr("cli.run.review_no_targets")}
      onSelect={(option) => props.onSelect(tr("cli.run.review_base_branch_prompt", { branch: option.value }))}
    />
  )
}

function DialogReviewCommits(props: {
  commits: { commit: string; title: string }[]
  onSelect: (arguments_: string) => void
}) {
  return (
    <DialogSelect
      title={tr("cli.run.review_select_commit")}
      options={props.commits.map((commit) => ({
        title: commit.title,
        description: commit.commit,
        value: commit,
      }))}
      emptyView={tr("cli.run.review_no_targets")}
      onSelect={(option) => props.onSelect(tr("cli.run.review_commit_prompt", option.value))}
    />
  )
}
