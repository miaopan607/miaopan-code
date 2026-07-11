import path from "path"
import { exec } from "child_process"
import { Filesystem } from "@/util/filesystem"
import * as prompts from "@clack/prompts"
import { map, pipe, sortBy, values } from "remeda"
import { Octokit } from "@octokit/rest"
import { graphql } from "@octokit/graphql"
import * as core from "@actions/core"
import * as github from "@actions/github"
import type { Context } from "@actions/github/lib/context"
import type {
  IssueCommentEvent,
  IssuesEvent,
  PullRequestReviewCommentEvent,
  WorkflowDispatchEvent,
  WorkflowRunEvent,
  PullRequestEvent,
} from "@octokit/webhooks-types"
import { UI } from "../ui"
import { ModelsDev } from "@miaopan-code/core/models-dev"
import { InstanceRef } from "@/effect/instance-ref"
import { SessionShare } from "@/share/session"
import { Session } from "@/session/session"
import type { SessionID } from "../../session/schema"
import { MessageID, PartID } from "../../session/schema"
import { Provider } from "@/provider/provider"
import { MessageV2 } from "../../session/message-v2"
import { EventV2Bridge } from "@/event-v2-bridge"
import { EventV2 } from "@miaopan-code/core/event"
import { SessionPrompt } from "@/session/prompt"
import { Git } from "@/git"
import { setTimeout as sleep } from "node:timers/promises"
import { Process } from "@/util/process"
import { parseGitHubRemote } from "@/util/repository"
import { Effect } from "effect"
import { extractResponseText, formatPromptTooLargeError } from "./github.shared"

type GitHubAuthor = {
  login: string
  name?: string
}

type GitHubComment = {
  id: string
  databaseId: string
  body: string
  author: GitHubAuthor
  createdAt: string
}

type GitHubReviewComment = GitHubComment & {
  path: string
  line: number | null
}

type GitHubCommit = {
  oid: string
  message: string
  author: {
    name: string
    email: string
  }
}

type GitHubFile = {
  path: string
  additions: number
  deletions: number
  changeType: string
}

type GitHubReview = {
  id: string
  databaseId: string
  author: GitHubAuthor
  body: string
  state: string
  submittedAt: string
  comments: {
    nodes: GitHubReviewComment[]
  }
}

type GitHubPullRequest = {
  title: string
  body: string
  author: GitHubAuthor
  baseRefName: string
  headRefName: string
  headRefOid: string
  createdAt: string
  additions: number
  deletions: number
  state: string
  baseRepository: {
    nameWithOwner: string
  }
  headRepository: {
    nameWithOwner: string
  }
  commits: {
    totalCount: number
    nodes: Array<{
      commit: GitHubCommit
    }>
  }
  files: {
    nodes: GitHubFile[]
  }
  comments: {
    nodes: GitHubComment[]
  }
  reviews: {
    nodes: GitHubReview[]
  }
}

type GitHubIssue = {
  title: string
  body: string
  author: GitHubAuthor
  createdAt: string
  state: string
  comments: {
    nodes: GitHubComment[]
  }
}

type PullRequestQueryResponse = {
  repository: {
    pullRequest: GitHubPullRequest
  }
}

type IssueQueryResponse = {
  repository: {
    issue: GitHubIssue
  }
}

const AGENT_USERNAME = "miaopanCode-agent[bot]"
const AGENT_REACTION = "eyes"
const WORKFLOW_FILE = ".github/workflows/miaopanCode.yml"

// Event categories for routing
// USER_EVENTS: triggered by user actions, have actor/issueId, support reactions/comments
// REPO_EVENTS: triggered by automation, no actor/issueId, output to logs/PR only
const USER_EVENTS = ["issue_comment", "pull_request_review_comment", "issues", "pull_request"] as const
const REPO_EVENTS = ["schedule", "workflow_dispatch"] as const
const SUPPORTED_EVENTS = [...USER_EVENTS, ...REPO_EVENTS] as const

type UserEvent = (typeof USER_EVENTS)[number]
type RepoEvent = (typeof REPO_EVENTS)[number]

export const githubInstall = Effect.fn("Cli.github.install")(function* () {
  const maybeCtx = yield* InstanceRef
  if (!maybeCtx) return yield* Effect.die(UI.t("error.instance_ref_missing"))
  const ctx = maybeCtx
  const modelsDev = yield* ModelsDev.Service
  const gitSvc = yield* Git.Service
  yield* Effect.promise(async () => {
    {
      UI.empty()
      prompts.intro(UI.t("github.install_title"))
      const app = await getAppInfo()
      await installGitHubApp()

      const providers = await Effect.runPromise(modelsDev.get()).then((p) => {
        // TODO: add guide for copilot, for now just hide it
        delete p["github-copilot"]
        return p
      })

      const provider = await promptProvider()
      const model = await promptModel()
      //const key = await promptKey()

      await addWorkflowFiles()
      printNextSteps()

      function printNextSteps() {
        let step2
        if (provider === "amazon-bedrock") {
          step2 = UI.t("github.oidc_aws_step")
        } else {
          step2 = [
            UI.t("github.secrets_step", { owner: app.owner, repo: app.repo }),
            "",
            ...providers[provider].env.map((e) => `       - ${e}`),
          ].join("\n")
        }

        prompts.outro(
          [
            UI.t("github.next_steps"),
            "",
            UI.t("github.commit_workflow_step", { file: WORKFLOW_FILE }),
            step2,
            "",
            UI.t("github.test_agent_step"),
            "",
            UI.t("github.learn_more_step"),
          ].join("\n"),
        )
      }

      async function getAppInfo() {
        const project = ctx.project
        if (project.vcs !== "git") {
          prompts.log.error(UI.t("github.repo_required"))
          throw new UI.CancelledError()
        }

        // Get repo info
        const info = await Effect.runPromise(gitSvc.run(["remote", "get-url", "origin"], { cwd: ctx.worktree })).then(
          (x) => x.text().trim(),
        )
        const parsed = parseGitHubRemote(info)
        if (!parsed) {
          prompts.log.error(UI.t("github.repo_required"))
          throw new UI.CancelledError()
        }
        return { owner: parsed.owner, repo: parsed.repo, root: ctx.worktree }
      }

      async function promptProvider() {
        const priority: Record<string, number> = {
          miaopanCode: 0,
          anthropic: 1,
          openai: 2,
          google: 3,
        }
        let provider = await prompts.select({
          message: UI.t("github.select_provider"),
          maxItems: 8,
          options: pipe(
            providers,
            values(),
            sortBy(
              (x) => priority[x.id] ?? 99,
              (x) => x.name ?? x.id,
            ),
            map((x) => ({
              label: x.name,
              value: x.id,
              hint: priority[x.id] === 0 ? UI.t("github.recommended") : undefined,
            })),
          ),
        })

        if (prompts.isCancel(provider)) throw new UI.CancelledError()

        return provider
      }

      async function promptModel() {
        const providerData = providers[provider]!

        const model = await prompts.select({
          message: UI.t("github.select_model"),
          maxItems: 8,
          options: pipe(
            providerData.models,
            values(),
            sortBy((x) => x.name ?? x.id),
            map((x) => ({
              label: x.name ?? x.id,
              value: x.id,
            })),
          ),
        })

        if (prompts.isCancel(model)) throw new UI.CancelledError()
        return model
      }

      async function installGitHubApp() {
        const s = prompts.spinner()
        s.start(UI.t("github.installing_app"))

        // Get installation
        const installation = await getInstallation()
        if (installation) return s.stop(UI.t("github.app_installed"))

        // Open browser
        const url = "https://github.com/apps/miaopanCode-agent"
        const command =
          process.platform === "darwin"
            ? `open "${url}"`
            : process.platform === "win32"
              ? `start "" "${url}"`
              : `xdg-open "${url}"`

        exec(command, (error) => {
          if (error) {
            prompts.log.warn(UI.t("github.browser_failed", { url }))
          }
        })

        // Wait for installation
        s.message(UI.t("github.waiting_app"))
        const MAX_RETRIES = 120
        let retries = 0
        do {
          const installation = await getInstallation()
          if (installation) break

          if (retries > MAX_RETRIES) {
            s.stop(UI.t("github.app_detection_failed", { owner: app.owner, repo: app.repo }))
            throw new UI.CancelledError()
          }

          retries++
          await sleep(1000)
        } while (true) // oxlint-disable-line no-constant-condition

        s.stop(UI.t("github.app_installed_done"))

        async function getInstallation() {
          return await fetch(
            `https://api.miaopanCode.ai/get_github_app_installation?owner=${app.owner}&repo=${app.repo}`,
          )
            .then((res) => res.json())
            .then((data) => data.installation)
        }
      }

      async function addWorkflowFiles() {
        const envStr =
          provider === "amazon-bedrock"
            ? ""
            : `\n        env:${providers[provider].env.map((e) => `\n          ${e}: \${{ secrets.${e} }}`).join("")}`

        await Filesystem.write(
          path.join(app.root, WORKFLOW_FILE),
          `name: miaopanCode

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  miaopanCode:
    if: |
      contains(github.event.comment.body, ' /oc') ||
      startsWith(github.event.comment.body, '/oc') ||
      contains(github.event.comment.body, ' /miaopanCode') ||
      startsWith(github.event.comment.body, '/miaopanCode')
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      pull-requests: read
      issues: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          persist-credentials: false

      - name: Run miaopanCode
        uses: miaopan607/miaopan-code/github@latest${envStr}
        with:
          model: ${provider}/${model}`,
        )

        prompts.log.success(UI.t("github.workflow_added", { file: WORKFLOW_FILE }))
      }
    }
  })
})

export const githubRun = Effect.fn("Cli.github.run")(function* (args: { event?: string; token?: string }) {
  const ctx = yield* InstanceRef
  if (!ctx) return yield* Effect.die(UI.t("error.instance_ref_missing"))
  const gitSvc = yield* Git.Service
  const sessionSvc = yield* Session.Service
  const sessionShare = yield* SessionShare.Service
  const sessionPrompt = yield* SessionPrompt.Service
  const events = yield* EventV2Bridge.Service
  const runLocalEffect = <A, E>(effect: Effect.Effect<A, E>) =>
    Effect.runPromise(effect.pipe(Effect.provideService(InstanceRef, ctx)))
  yield* Effect.promise(async () => {
    const isMock = args.token || args.event

    const context = isMock ? (JSON.parse(args.event!) as Context) : github.context
    if (!SUPPORTED_EVENTS.includes(context.eventName as (typeof SUPPORTED_EVENTS)[number])) {
      core.setFailed(UI.t("github.event_unsupported", { event: context.eventName }))
      process.exit(1)
    }

    // Determine event category for routing
    // USER_EVENTS: have actor, issueId, support reactions/comments
    // REPO_EVENTS: no actor/issueId, output to logs/PR only
    const isUserEvent = USER_EVENTS.includes(context.eventName as UserEvent)
    const isRepoEvent = REPO_EVENTS.includes(context.eventName as RepoEvent)
    const isCommentEvent = ["issue_comment", "pull_request_review_comment"].includes(context.eventName)
    const isIssuesEvent = context.eventName === "issues"
    const isScheduleEvent = context.eventName === "schedule"
    const isWorkflowDispatchEvent = context.eventName === "workflow_dispatch"

    const { providerID, modelID } = normalizeModel()
    const variant = process.env["VARIANT"] || undefined
    const runId = normalizeRunId()
    const share = normalizeShare()
    const oidcBaseUrl = normalizeOidcBaseUrl()
    const { owner, repo } = context.repo
    // For repo events (schedule, workflow_dispatch), payload has no issue/comment data
    const payload = context.payload as
      | IssueCommentEvent
      | IssuesEvent
      | PullRequestReviewCommentEvent
      | WorkflowDispatchEvent
      | WorkflowRunEvent
      | PullRequestEvent
    const issueEvent = isIssueCommentEvent(payload) ? payload : undefined
    // workflow_dispatch has an actor (the user who triggered it), schedule does not
    const actor = isScheduleEvent ? undefined : context.actor

    const issueId = isRepoEvent
      ? undefined
      : context.eventName === "issue_comment" || context.eventName === "issues"
        ? (payload as IssueCommentEvent | IssuesEvent).issue.number
        : (payload as PullRequestEvent | PullRequestReviewCommentEvent).pull_request.number
    const runUrl = `/${owner}/${repo}/actions/runs/${runId}`
    const shareBaseUrl = isMock ? "https://dev.miaopanCode.ai" : "https://github.com/miaopan607/miaopan-code"

    let appToken: string
    let octoRest: Octokit
    let octoGraph: typeof graphql
    let gitConfig: string
    let session: { id: SessionID; title: string; version: string }
    let shareId: string | undefined
    let exitCode = 0
    type PromptFiles = Awaited<ReturnType<typeof getUserPrompt>>["promptFiles"]
    const triggerCommentId = isCommentEvent
      ? (payload as IssueCommentEvent | PullRequestReviewCommentEvent).comment.id
      : undefined
    const useGithubToken = normalizeUseGithubToken()
    const commentType = isCommentEvent
      ? context.eventName === "pull_request_review_comment"
        ? "pr_review"
        : "issue"
      : undefined
    const gitText = async (args: string[]) => {
      const result = await Effect.runPromise(gitSvc.run(args, { cwd: ctx.worktree }))
      if (result.exitCode !== 0) {
        throw new Process.RunFailedError(["git", ...args], result.exitCode, result.stdout, result.stderr)
      }
      return result.text().trim()
    }
    const gitRun = async (args: string[]) => {
      const result = await Effect.runPromise(gitSvc.run(args, { cwd: ctx.worktree }))
      if (result.exitCode !== 0) {
        throw new Process.RunFailedError(["git", ...args], result.exitCode, result.stdout, result.stderr)
      }
      return result
    }
    const gitStatus = (args: string[]) => Effect.runPromise(gitSvc.run(args, { cwd: ctx.worktree }))
    const commitChanges = async (summary: string, actor?: string) => {
      const args = ["commit", "-m", summary]
      if (actor) args.push("-m", `Co-authored-by: ${actor} <${actor}@users.noreply.github.com>`)
      await gitRun(args)
    }

    try {
      if (useGithubToken) {
        const githubToken = process.env["GITHUB_TOKEN"]
        if (!githubToken) {
          throw new Error(UI.t("github.token_required"))
        }
        appToken = githubToken
      } else {
        const actionToken = isMock ? args.token! : await getOidcToken()
        appToken = await exchangeForAppToken(actionToken)
      }
      octoRest = new Octokit({ auth: appToken })
      octoGraph = graphql.defaults({
        headers: { authorization: `token ${appToken}` },
      })

      const { userPrompt, promptFiles } = await getUserPrompt()
      if (!useGithubToken) {
        await configureGit(appToken)
      }
      // Skip permission check and reactions for repo events (no actor to check, no issue to react to)
      if (isUserEvent) {
        await assertPermissions()
        await addReaction(commentType)
      }

      // Setup miaopanCode session
      const repoData = await fetchRepo()
      session = await runLocalEffect(
        sessionSvc.create({
          permission: [
            {
              permission: "question",
              action: "deny",
              pattern: "*",
            },
          ],
        }),
      )
      await subscribeSessionEvents()
      shareId = await (async () => {
        if (share === false) return
        if (!share && repoData.data.private) return
        await runLocalEffect(sessionShare.share(session.id))
        return session.id.slice(-8)
      })()
      console.log(UI.t("github.session", { id: session.id }))

      // Handle event types:
      // REPO_EVENTS (schedule, workflow_dispatch): no issue/PR context, output to logs/PR only
      // USER_EVENTS on PR (pull_request, pull_request_review_comment, issue_comment on PR): work on PR branch
      // USER_EVENTS on Issue (issue_comment on issue, issues): create new branch, may create PR
      if (isRepoEvent) {
        // Repo event - no issue/PR context, output goes to logs
        if (isWorkflowDispatchEvent && actor) {
          console.log(UI.t("github.triggered_by", { actor }))
        }
        const branchPrefix = isWorkflowDispatchEvent ? "dispatch" : "schedule"
        const branch = await checkoutNewBranch(branchPrefix)
        const head = await gitText(["rev-parse", "HEAD"])
        const response = await chat(userPrompt, promptFiles)
        const { dirty, uncommittedChanges, switched } = await branchIsDirty(head, branch)
        if (switched) {
          // Agent switched branches (likely created its own branch/PR)
          console.log(UI.t("github.agent_managed_skip_pr"))
          console.log(UI.t("github.response"), response)
        } else if (dirty) {
          const summary = await summarize(response)
          // workflow_dispatch has an actor for co-author attribution, schedule does not
          await pushToNewBranch(summary, branch, uncommittedChanges, isScheduleEvent)
          const triggerType = isWorkflowDispatchEvent ? "workflow_dispatch" : "scheduled workflow"
          const pr = await createPR(
            repoData.data.default_branch,
            branch,
            summary,
            `${response}\n\n${UI.t("github.triggered_by_type", { type: triggerType })}${footer({ image: true })}`,
          )
          if (pr) {
            console.log(UI.t("github.created_pr", { number: pr }))
          } else {
            console.log(UI.t("github.skipped_pr"))
          }
        } else {
          console.log(UI.t("github.response"), response)
        }
      } else if (
        ["pull_request", "pull_request_review_comment"].includes(context.eventName) ||
        issueEvent?.issue.pull_request
      ) {
        const prData = await fetchPR()
        // Local PR
        if (prData.headRepository.nameWithOwner === prData.baseRepository.nameWithOwner) {
          await checkoutLocalBranch(prData)
          const head = await gitText(["rev-parse", "HEAD"])
          const dataPrompt = buildPromptDataForPR(prData)
          const response = await chat(`${userPrompt}\n\n${dataPrompt}`, promptFiles)
          const { dirty, uncommittedChanges, switched } = await branchIsDirty(head, prData.headRefName)
          if (switched) {
            console.log(UI.t("github.agent_managed_skip_push"))
          }
          if (dirty && !switched) {
            const summary = await summarize(response)
            await pushToLocalBranch(summary, uncommittedChanges)
          }
          const hasShared = prData.comments.nodes.some((c) => c.body.includes(`${shareBaseUrl}/s/${shareId}`))
          await createComment(`${response}${footer({ image: !hasShared })}`)
          await removeReaction(commentType)
        }
        // Fork PR
        else {
          const forkBranch = await checkoutForkBranch(prData)
          const head = await gitText(["rev-parse", "HEAD"])
          const dataPrompt = buildPromptDataForPR(prData)
          const response = await chat(`${userPrompt}\n\n${dataPrompt}`, promptFiles)
          const { dirty, uncommittedChanges, switched } = await branchIsDirty(head, forkBranch)
          if (switched) {
            console.log(UI.t("github.agent_managed_skip_push"))
          }
          if (dirty && !switched) {
            const summary = await summarize(response)
            await pushToForkBranch(summary, prData, uncommittedChanges)
          }
          const hasShared = prData.comments.nodes.some((c) => c.body.includes(`${shareBaseUrl}/s/${shareId}`))
          await createComment(`${response}${footer({ image: !hasShared })}`)
          await removeReaction(commentType)
        }
      }
      // Issue
      else {
        const branch = await checkoutNewBranch("issue")
        const head = await gitText(["rev-parse", "HEAD"])
        const issueData = await fetchIssue()
        const dataPrompt = buildPromptDataForIssue(issueData)
        const response = await chat(`${userPrompt}\n\n${dataPrompt}`, promptFiles)
        const { dirty, uncommittedChanges, switched } = await branchIsDirty(head, branch)
        if (switched) {
          // Agent switched branches (likely created its own branch/PR).
          // Don't push the stale infrastructure branch — just comment.
          await createComment(`${response}${footer({ image: true })}`)
          await removeReaction(commentType)
        } else if (dirty) {
          const summary = await summarize(response)
          await pushToNewBranch(summary, branch, uncommittedChanges, false)
          const pr = await createPR(
            repoData.data.default_branch,
            branch,
            summary,
            `${response}\n\n${UI.t("github.closes_issue", { id: issueId })}${footer({ image: true })}`,
          )
          if (pr) {
            await createComment(`${UI.t("github.created_pr", { number: pr })}${footer({ image: true })}`)
          } else {
            await createComment(`${response}${footer({ image: true })}`)
          }
          await removeReaction(commentType)
        } else {
          await createComment(`${response}${footer({ image: true })}`)
          await removeReaction(commentType)
        }
      }
    } catch (e: any) {
      exitCode = 1
      console.error(e instanceof Error ? e.message : String(e))
      let msg = e
      if (e instanceof Process.RunFailedError) {
        msg = e.stderr.toString()
      } else if (e instanceof Error) {
        msg = e.message
      }
      if (isUserEvent) {
        await createComment(`${msg}${footer()}`)
        await removeReaction(commentType)
      }
      core.setFailed(msg)
      // Also output the clean error message for the action to capture
      //core.setOutput("prepare_error", e.message);
    } finally {
      if (!useGithubToken) {
        await restoreGitConfig()
        await revokeAppToken()
      }
    }
    process.exit(exitCode)

    function normalizeModel() {
      const value = process.env["MODEL"]
      if (!value) throw new Error(UI.t("github.env_missing", { name: "MODEL" }))

      const { providerID, modelID } = Provider.parseModel(value)

      if (!providerID.length || !modelID.length) throw new Error(UI.t("github.model_invalid", { value }))
      return { providerID, modelID }
    }

    function normalizeRunId() {
      const value = process.env["GITHUB_RUN_ID"]
      if (!value) throw new Error(UI.t("github.env_missing", { name: "GITHUB_RUN_ID" }))
      return value
    }

    function normalizeShare() {
      const value = process.env["SHARE"]
      if (!value) return undefined
      if (value === "true") return true
      if (value === "false") return false
      throw new Error(UI.t("github.boolean_invalid", { name: "share", value }))
    }

    function normalizeUseGithubToken() {
      const value = process.env["USE_GITHUB_TOKEN"]
      if (!value) return false
      if (value === "true") return true
      if (value === "false") return false
      throw new Error(UI.t("github.boolean_invalid", { name: "use_github_token", value }))
    }

    function normalizeOidcBaseUrl(): string {
      const value = process.env["OIDC_BASE_URL"]
      if (!value) return "https://api.miaopanCode.ai"
      return value.replace(/\/+$/, "")
    }

    function isIssueCommentEvent(
      event:
        | IssueCommentEvent
        | IssuesEvent
        | PullRequestReviewCommentEvent
        | WorkflowDispatchEvent
        | WorkflowRunEvent
        | PullRequestEvent,
    ): event is IssueCommentEvent {
      return "issue" in event && "comment" in event
    }

    function getReviewCommentContext() {
      if (context.eventName !== "pull_request_review_comment") {
        return null
      }

      const reviewPayload = payload as PullRequestReviewCommentEvent
      return {
        file: reviewPayload.comment.path,
        diffHunk: reviewPayload.comment.diff_hunk,
        line: reviewPayload.comment.line,
        originalLine: reviewPayload.comment.original_line,
        position: reviewPayload.comment.position,
        commitId: reviewPayload.comment.commit_id,
        originalCommitId: reviewPayload.comment.original_commit_id,
      }
    }

    async function getUserPrompt() {
      const customPrompt = process.env["PROMPT"]
      // For repo events and issues events, PROMPT is required since there's no comment to extract from
      if (isRepoEvent || isIssuesEvent) {
        if (!customPrompt) {
          const eventType = isRepoEvent ? "scheduled and workflow_dispatch" : "issues"
          throw new Error(UI.t("github.prompt_required", { event: eventType }))
        }
        return { userPrompt: customPrompt, promptFiles: [] }
      }

      if (customPrompt) {
        return { userPrompt: customPrompt, promptFiles: [] }
      }

      const reviewContext = getReviewCommentContext()
      const mentions = (process.env["MENTIONS"] || "/miaopanCode,/oc")
        .split(",")
        .map((m) => m.trim().toLowerCase())
        .filter(Boolean)
      let prompt = (() => {
        if (!isCommentEvent) {
          return UI.t("github.review_pr_prompt")
        }
        const body = (payload as IssueCommentEvent | PullRequestReviewCommentEvent).comment.body.trim()
        const bodyLower = body.toLowerCase()
        if (mentions.some((m) => bodyLower === m)) {
          if (reviewContext) {
            return UI.t("github.review_diff_prompt", {
              file: reviewContext.file,
              line: String(reviewContext.line),
              diff: reviewContext.diffHunk,
            })
          }
          return UI.t("github.summarize_thread_prompt")
        }
        if (mentions.some((m) => bodyLower.includes(m))) {
          if (reviewContext) {
            return UI.t("github.comment_context_prompt", {
              body,
              file: reviewContext.file,
              line: String(reviewContext.line),
              diff: reviewContext.diffHunk,
            })
          }
          return body
        }
        throw new Error(
          UI.t("github.comment_mention_required", { mentions: mentions.map((m) => "`" + m + "`").join(" or ") }),
        )
      })()

      // Handle images
      const imgData: {
        filename: string
        mime: string
        content: string
        start: number
        end: number
        replacement: string
      }[] = []

      // Search for files
      // ie. <img alt="Image" src="https://github.com/user-attachments/assets/xxxx" />
      // ie. [api.json](https://github.com/user-attachments/files/21433810/api.json)
      // ie. ![Image](https://github.com/user-attachments/assets/xxxx)
      const mdMatches = prompt.matchAll(/!?\[.*?\]\((https:\/\/github\.com\/user-attachments\/[^)]+)\)/gi)
      const tagMatches = prompt.matchAll(/<img .*?src="(https:\/\/github\.com\/user-attachments\/[^"]+)" \/>/gi)
      const matches = [...mdMatches, ...tagMatches].sort((a, b) => a.index - b.index)
      console.log(UI.t("github.images"), JSON.stringify(matches, null, 2))

      let offset = 0
      for (const m of matches) {
        const tag = m[0]
        const url = m[1]
        const start = m.index
        const filename = path.basename(url)

        // Download image
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${appToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        })
        if (!res.ok) {
          console.error(UI.t("github.image_download_failed", { url }))
          continue
        }

        // Replace img tag with file path, ie. @image.png
        const replacement = `@${filename}`
        prompt = prompt.slice(0, start + offset) + replacement + prompt.slice(start + offset + tag.length)
        offset += replacement.length - tag.length

        const contentType = res.headers.get("content-type")
        imgData.push({
          filename,
          mime: contentType?.startsWith("image/") ? contentType : "text/plain",
          content: Buffer.from(await res.arrayBuffer()).toString("base64"),
          start,
          end: start + replacement.length,
          replacement,
        })
      }

      return { userPrompt: prompt, promptFiles: imgData }
    }

    async function subscribeSessionEvents() {
      const TOOL: Record<string, [string, string]> = {
        todowrite: ["Todo", UI.Style.TEXT_WARNING_BOLD],
        bash: ["Shell", UI.Style.TEXT_DANGER_BOLD],
        edit: ["Edit", UI.Style.TEXT_SUCCESS_BOLD],
        glob: ["Glob", UI.Style.TEXT_INFO_BOLD],
        grep: ["Grep", UI.Style.TEXT_INFO_BOLD],
        list: ["List", UI.Style.TEXT_INFO_BOLD],
        read: ["Read", UI.Style.TEXT_HIGHLIGHT_BOLD],
        write: ["Write", UI.Style.TEXT_SUCCESS_BOLD],
        websearch: ["Search", UI.Style.TEXT_DIM_BOLD],
      }

      function printEvent(color: string, type: string, title: string) {
        UI.println(
          color + `|`,
          UI.Style.TEXT_NORMAL + UI.Style.TEXT_DIM + ` ${type.padEnd(7, " ")}`,
          "",
          UI.Style.TEXT_NORMAL + title,
        )
      }

      let text = ""
      await runLocalEffect(
        events.listen((evt) => {
          if (evt.type !== MessageV2.Event.PartUpdated.type) return Effect.void
          const data = evt.data as EventV2.Data<typeof MessageV2.Event.PartUpdated>
          if (data.part.sessionID !== session.id) return Effect.void
          //if (evt.properties.part.messageID === messageID) return
          const part = data.part

          if (part.type === "tool" && part.state.status === "completed") {
            const [tool, color] = TOOL[part.tool] ?? [part.tool, UI.Style.TEXT_INFO_BOLD]
            const title =
              part.state.title || Object.keys(part.state.input).length > 0
                ? JSON.stringify(part.state.input)
                : "Unknown"
            console.log()
            printEvent(color, tool, title)
          }

          if (part.type === "text") {
            text = part.text

            if (part.time?.end) {
              UI.empty()
              UI.println(UI.markdown(text))
              UI.empty()
              text = ""
              return Effect.void
            }
          }
          return Effect.void
        }),
      )
    }

    async function summarize(response: string) {
      try {
        return await chat(UI.t("github.summarize_prompt", { response }))
      } catch {
        const title = issueEvent
          ? issueEvent.issue.title
          : (payload as PullRequestReviewCommentEvent).pull_request.title
        return UI.t("github.fix_issue_title", { title })
      }
    }

    async function chat(message: string, files: PromptFiles = []) {
      console.log(UI.t("github.sending_message"))

      return runLocalEffect(
        Effect.gen(function* () {
          const prompt = sessionPrompt
          const result = yield* prompt.prompt({
            sessionID: session.id,
            messageID: MessageID.ascending(),
            variant,
            model: {
              providerID,
              modelID,
            },
            // agent is omitted - server will use default_agent from config or fall back to "build"
            parts: [
              {
                id: PartID.ascending(),
                type: "text",
                text: message,
              },
              ...files.flatMap((f) => [
                {
                  id: PartID.ascending(),
                  type: "file" as const,
                  mime: f.mime,
                  url: `data:${f.mime};base64,${f.content}`,
                  filename: f.filename,
                  source: {
                    type: "file" as const,
                    text: {
                      value: f.replacement,
                      start: f.start,
                      end: f.end,
                    },
                    path: f.filename,
                  },
                },
              ]),
            ],
          })

          if (result.info.role === "assistant" && result.info.error) {
            const err = result.info.error
            console.error(UI.t("github.agent_error", { error: String(err) }), err)
            if (err.name === "ContextOverflowError") throw new Error(formatPromptTooLargeError(files))
            const message = "message" in err.data ? err.data.message : ""
            throw new Error(`${err.name}: ${message}`)
          }

          const text = extractResponseText(result.parts)
          if (text) return text

          console.log(UI.t("github.requesting_summary"))
          const summary = yield* prompt.prompt({
            sessionID: session.id,
            messageID: MessageID.ascending(),
            variant,
            model: {
              providerID,
              modelID,
            },
            tools: { "*": false },
            parts: [
              {
                id: PartID.ascending(),
                type: "text",
                text: UI.t("github.summarize_actions_prompt"),
              },
            ],
          })

          if (summary.info.role === "assistant" && summary.info.error) {
            const err = summary.info.error
            console.error(UI.t("github.summary_error", { error: String(err) }), err)
            if (err.name === "ContextOverflowError") throw new Error(formatPromptTooLargeError(files))
            const message = "message" in err.data ? err.data.message : ""
            throw new Error(`${err.name}: ${message}`)
          }

          const summaryText = extractResponseText(summary.parts)
          if (!summaryText) throw new Error(UI.t("github.summary_failed"))
          return summaryText
        }),
      )
    }

    async function getOidcToken() {
      try {
        return await core.getIDToken("miaopanCode-github-action")
      } catch (error) {
        console.error(UI.t("github.oidc_error", { error: String(error instanceof Error ? error.message : error) }))
        throw new Error(UI.t("github.oidc_token_failed_hint"), { cause: error })
      }
    }

    async function exchangeForAppToken(token: string) {
      const response = token.startsWith("github_pat_")
        ? await fetch(`${oidcBaseUrl}/exchange_github_app_token_with_pat`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ owner, repo }),
          })
        : await fetch(`${oidcBaseUrl}/exchange_github_app_token`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

      if (!response.ok) {
        const responseJson = (await response.json()) as { error?: string }
        throw new Error(
          UI.t("github.app_token_failed", {
            status: response.status,
            statusText: response.statusText,
            error: responseJson.error,
          }),
        )
      }

      const responseJson = (await response.json()) as { token: string }
      return responseJson.token
    }

    async function configureGit(appToken: string) {
      // Do not change git config when running locally
      if (isMock) return

      console.log(UI.t("github.configuring_git"))
      const config = "http.https://github.com/.extraheader"
      // actions/checkout@v6 no longer stores credentials in .git/config,
      // so this may not exist - use nothrow() to handle gracefully
      const ret = await gitStatus(["config", "--local", "--get", config])
      if (ret.exitCode === 0) {
        gitConfig = ret.stdout.toString().trim()
        await gitRun(["config", "--local", "--unset-all", config])
      }

      const newCredentials = Buffer.from(`x-access-token:${appToken}`, "utf8").toString("base64")

      await gitRun(["config", "--local", config, `AUTHORIZATION: basic ${newCredentials}`])
      await gitRun(["config", "--global", "user.name", AGENT_USERNAME])
      await gitRun(["config", "--global", "user.email", `${AGENT_USERNAME}@users.noreply.github.com`])
    }

    async function restoreGitConfig() {
      if (gitConfig === undefined) return
      const config = "http.https://github.com/.extraheader"
      await gitRun(["config", "--local", config, gitConfig])
    }

    async function checkoutNewBranch(type: "issue" | "schedule" | "dispatch") {
      console.log(UI.t("github.checkout_new_branch"))
      const branch = generateBranchName(type)
      await gitRun(["checkout", "-b", branch])
      return branch
    }

    async function checkoutLocalBranch(pr: GitHubPullRequest) {
      console.log(UI.t("github.checkout_local_branch"))

      const branch = pr.headRefName
      const depth = Math.max(pr.commits.totalCount, 20)

      await gitRun(["fetch", "origin", `--depth=${depth}`, branch])
      await gitRun(["checkout", branch])
    }

    async function checkoutForkBranch(pr: GitHubPullRequest) {
      console.log(UI.t("github.checkout_fork_branch"))

      const remoteBranch = pr.headRefName
      const localBranch = generateBranchName("pr")
      const depth = Math.max(pr.commits.totalCount, 20)

      await gitRun(["remote", "add", "fork", `https://github.com/${pr.headRepository.nameWithOwner}.git`])
      await gitRun(["fetch", "fork", `--depth=${depth}`, remoteBranch])
      await gitRun(["checkout", "-b", localBranch, `fork/${remoteBranch}`])
      return localBranch
    }

    function generateBranchName(type: "issue" | "pr" | "schedule" | "dispatch") {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:-]/g, "")
        .replace(/\.\d{3}Z/, "")
        .split("T")
        .join("")
      if (type === "schedule" || type === "dispatch") {
        const hex = crypto.randomUUID().slice(0, 6)
        return `miaopan-code/${type}-${hex}-${timestamp}`
      }
      return `miaopan-code/${type}${issueId}-${timestamp}`
    }

    async function pushToNewBranch(summary: string, branch: string, commit: boolean, isSchedule: boolean) {
      console.log(UI.t("github.push_new_branch"))
      if (commit) {
        await gitRun(["add", "."])
        if (isSchedule) {
          await commitChanges(summary)
        } else {
          await commitChanges(summary, actor)
        }
      }
      await gitRun(["push", "-u", "origin", branch])
    }

    async function pushToLocalBranch(summary: string, commit: boolean) {
      console.log(UI.t("github.push_local_branch"))
      if (commit) {
        await gitRun(["add", "."])
        await commitChanges(summary, actor)
      }
      await gitRun(["push"])
    }

    async function pushToForkBranch(summary: string, pr: GitHubPullRequest, commit: boolean) {
      console.log(UI.t("github.push_fork_branch"))

      const remoteBranch = pr.headRefName

      if (commit) {
        await gitRun(["add", "."])
        await commitChanges(summary, actor)
      }
      await gitRun(["push", "fork", `HEAD:${remoteBranch}`])
    }

    async function branchIsDirty(originalHead: string, expectedBranch: string) {
      console.log(UI.t("github.checking_dirty"))
      // Detect if the agent switched branches during chat (e.g. created
      // its own branch, committed, and possibly pushed/created a PR).
      const current = await gitText(["rev-parse", "--abbrev-ref", "HEAD"])
      if (current !== expectedBranch) {
        console.log(UI.t("github.branch_changed", { expected: expectedBranch, current }))
        return { dirty: true, uncommittedChanges: false, switched: true }
      }

      const ret = await gitStatus(["status", "--porcelain"])
      const status = ret.stdout.toString().trim()
      if (status.length > 0) {
        return { dirty: true, uncommittedChanges: true, switched: false }
      }
      const head = await gitText(["rev-parse", "HEAD"])
      return {
        dirty: head !== originalHead,
        uncommittedChanges: false,
        switched: false,
      }
    }

    // Verify commits exist between base ref and a branch using rev-list.
    // Falls back to fetching from origin when local refs are missing
    // (common in shallow clones from actions/checkout).
    async function hasNewCommits(base: string, head: string) {
      const result = await gitStatus(["rev-list", "--count", `${base}..${head}`])
      if (result.exitCode !== 0) {
        console.log(UI.t("github.fetching_origin", { base }))
        await gitStatus(["fetch", "origin", base, "--depth=1"])
        const retry = await gitStatus(["rev-list", "--count", `origin/${base}..${head}`])
        if (retry.exitCode !== 0) return true // assume dirty if we can't tell
        return parseInt(retry.stdout.toString().trim()) > 0
      }
      return parseInt(result.stdout.toString().trim()) > 0
    }

    async function assertPermissions() {
      // Only called for non-schedule events, so actor is defined
      console.log(UI.t("github.assert_permissions", { actor }))

      let permission
      try {
        const response = await octoRest.repos.getCollaboratorPermissionLevel({
          owner,
          repo,
          username: actor!,
        })

        permission = response.data.permission
        console.log(UI.t("github.permission", { permission }))
      } catch (error) {
        console.error(UI.t("github.permission_error", { error: String(error) }))
        throw new Error(UI.t("github.permission_check_failed", { actor, error: String(error) }), { cause: error })
      }

      if (!["admin", "write"].includes(permission)) throw new Error(UI.t("github.write_permission_missing", { actor }))
    }

    async function addReaction(commentType?: "issue" | "pr_review") {
      // Only called for non-schedule events, so triggerCommentId is defined
      console.log(UI.t("github.adding_reaction"))
      if (triggerCommentId) {
        if (commentType === "pr_review") {
          return await octoRest.rest.reactions.createForPullRequestReviewComment({
            owner,
            repo,
            comment_id: triggerCommentId!,
            content: AGENT_REACTION,
          })
        }
        return await octoRest.rest.reactions.createForIssueComment({
          owner,
          repo,
          comment_id: triggerCommentId!,
          content: AGENT_REACTION,
        })
      }
      return await octoRest.rest.reactions.createForIssue({
        owner,
        repo,
        issue_number: issueId!,
        content: AGENT_REACTION,
      })
    }

    async function removeReaction(commentType?: "issue" | "pr_review") {
      // Only called for non-schedule events, so triggerCommentId is defined
      console.log(UI.t("github.removing_reaction"))
      if (triggerCommentId) {
        if (commentType === "pr_review") {
          const reactions = await octoRest.rest.reactions.listForPullRequestReviewComment({
            owner,
            repo,
            comment_id: triggerCommentId!,
            content: AGENT_REACTION,
          })

          const eyesReaction = reactions.data.find((r) => r.user?.login === AGENT_USERNAME)
          if (!eyesReaction) return

          return await octoRest.rest.reactions.deleteForPullRequestComment({
            owner,
            repo,
            comment_id: triggerCommentId!,
            reaction_id: eyesReaction.id,
          })
        }

        const reactions = await octoRest.rest.reactions.listForIssueComment({
          owner,
          repo,
          comment_id: triggerCommentId!,
          content: AGENT_REACTION,
        })

        const eyesReaction = reactions.data.find((r) => r.user?.login === AGENT_USERNAME)
        if (!eyesReaction) return

        return await octoRest.rest.reactions.deleteForIssueComment({
          owner,
          repo,
          comment_id: triggerCommentId!,
          reaction_id: eyesReaction.id,
        })
      }

      const reactions = await octoRest.rest.reactions.listForIssue({
        owner,
        repo,
        issue_number: issueId!,
        content: AGENT_REACTION,
      })

      const eyesReaction = reactions.data.find((r) => r.user?.login === AGENT_USERNAME)
      if (!eyesReaction) return

      await octoRest.rest.reactions.deleteForIssue({
        owner,
        repo,
        issue_number: issueId!,
        reaction_id: eyesReaction.id,
      })
    }

    async function createComment(body: string) {
      // Only called for non-schedule events, so issueId is defined
      console.log(UI.t("github.creating_comment"))
      return await octoRest.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueId!,
        body,
      })
    }

    async function createPR(base: string, branch: string, title: string, body: string): Promise<number | null> {
      console.log(UI.t("github.creating_pr"))

      // Check if an open PR already exists for this head→base combination
      // This handles the case where the agent created a PR via gh pr create during its run
      try {
        const existing = await withRetry(() =>
          octoRest.rest.pulls.list({
            owner,
            repo,
            head: `${owner}:${branch}`,
            base,
            state: "open",
          }),
        )

        if (existing.data.length > 0) {
          console.log(UI.t("github.pr_exists", { number: existing.data[0].number, branch }))
          return existing.data[0].number
        }
      } catch (e) {
        // If the check fails, proceed to create - we'll get a clear error if a PR already exists
        console.log(UI.t("github.pr_check_failed", { error: String(e) }))
      }

      // Verify there are commits between base and head before creating the PR.
      // In shallow clones, the branch can appear dirty but share the same
      // commit as the base, causing a 422 from GitHub.
      if (!(await hasNewCommits(base, branch))) {
        console.log(UI.t("github.no_commits", { base, branch }))
        return null
      }

      try {
        const pr = await withRetry(() =>
          octoRest.rest.pulls.create({
            owner,
            repo,
            head: branch,
            base,
            title,
            body,
          }),
        )
        return pr.data.number
      } catch (e: unknown) {
        // Handle "No commits between X and Y" validation error from GitHub.
        // This can happen when the branch was pushed but has no new commits
        // relative to the base (e.g. shallow clone edge cases).
        if (e instanceof Error && e.message.includes("No commits between")) {
          console.log(UI.t("github.rejected_pr", { error: e.message }))
          return null
        }
        throw e
      }
    }

    async function withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 5000): Promise<T> {
      try {
        return await fn()
      } catch (e) {
        if (retries > 0) {
          console.log(UI.t("github.retrying", { delay: delayMs }))
          await sleep(delayMs)
          return withRetry(fn, retries - 1, delayMs)
        }
        throw e
      }
    }

    function footer(opts?: { image?: boolean }) {
      const image = (() => {
        if (!shareId) return ""
        if (!opts?.image) return ""

        const titleAlt = encodeURIComponent(session.title.substring(0, 50))
        const title64 = Buffer.from(session.title.substring(0, 700), "utf8").toString("base64")

        return `<a href="${shareBaseUrl}/s/${shareId}"><img width="200" alt="${titleAlt}" src="https://social-cards.sst.dev/miaopanCode-share/${title64}.png?model=${providerID}/${modelID}&version=${session.version}&id=${shareId}" /></a>\n`
      })()
      const shareUrl = shareId ? `[miaopanCode session](${shareBaseUrl}/s/${shareId})&nbsp;&nbsp;|&nbsp;&nbsp;` : ""
      return `\n\n${image}${shareUrl}[github run](${runUrl})`
    }

    async function fetchRepo() {
      return await octoRest.rest.repos.get({ owner, repo })
    }

    async function fetchIssue() {
      console.log(UI.t("github.fetch_issue_prompt"))
      const issueResult = await octoGraph<IssueQueryResponse>(
        `
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $number) {
      title
      body
      author {
        login
      }
      createdAt
      state
      comments(first: 100) {
        nodes {
          id
          databaseId
          body
          author {
            login
          }
          createdAt
        }
      }
    }
  }
}`,
        {
          owner,
          repo,
          number: issueId,
        },
      )

      const issue = issueResult.repository.issue
      if (!issue) throw new Error(UI.t("github.issue_not_found", { id: issueId }))

      return issue
    }

    function buildPromptDataForIssue(issue: GitHubIssue) {
      // Only called for non-schedule events, so payload is defined
      const comments = (issue.comments?.nodes || [])
        .filter((c) => {
          const id = parseInt(c.databaseId)
          return id !== triggerCommentId
        })
        .map((c) =>
          UI.t("github.context_comment", {
            prefix: "  - ",
            author: c.author.login,
            createdAt: c.createdAt,
            body: c.body,
          }),
        )

      return [
        "<github_action_context>",
        UI.t("github.action_context"),
        "</github_action_context>",
        "",
        UI.t("github.context_read_only"),
        "<issue>",
        UI.t("github.context_title", { value: issue.title }),
        UI.t("github.context_body", { value: issue.body }),
        UI.t("github.context_author", { value: issue.author.login }),
        UI.t("github.context_created_at", { value: issue.createdAt }),
        UI.t("github.context_state", { value: issue.state }),
        ...(comments.length > 0 ? ["<issue_comments>", ...comments, "</issue_comments>"] : []),
        "</issue>",
      ].join("\n")
    }

    async function fetchPR() {
      console.log(UI.t("github.fetch_pr_prompt"))
      const prResult = await octoGraph<PullRequestQueryResponse>(
        `
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      title
      body
      author {
        login
      }
      baseRefName
      headRefName
      headRefOid
      createdAt
      additions
      deletions
      state
      baseRepository {
        nameWithOwner
      }
      headRepository {
        nameWithOwner
      }
      commits(first: 100) {
        totalCount
        nodes {
          commit {
            oid
            message
            author {
              name
              email
            }
          }
        }
      }
      files(first: 100) {
        nodes {
          path
          additions
          deletions
          changeType
        }
      }
      comments(first: 100) {
        nodes {
          id
          databaseId
          body
          author {
            login
          }
          createdAt
        }
      }
      reviews(first: 100) {
        nodes {
          id
          databaseId
          author {
            login
          }
          body
          state
          submittedAt
          comments(first: 100) {
            nodes {
              id
              databaseId
              body
              path
              line
              author {
                login
              }
              createdAt
            }
          }
        }
      }
    }
  }
}`,
        {
          owner,
          repo,
          number: issueId,
        },
      )

      const pr = prResult.repository.pullRequest
      if (!pr) throw new Error(UI.t("github.pr_not_found", { id: issueId }))

      return pr
    }

    function buildPromptDataForPR(pr: GitHubPullRequest) {
      // Only called for non-schedule events, so payload is defined
      const comments = (pr.comments?.nodes || [])
        .filter((c) => {
          const id = parseInt(c.databaseId)
          return id !== triggerCommentId
        })
        .map((c) =>
          UI.t("github.context_comment", {
            prefix: "- ",
            author: c.author.login,
            createdAt: c.createdAt,
            body: c.body,
          }),
        )

      const files = (pr.files.nodes || []).map((f) =>
        UI.t("github.context_file", {
          path: f.path,
          changeType: f.changeType,
          additions: f.additions,
          deletions: f.deletions,
        }),
      )
      const reviewData = (pr.reviews.nodes || []).map((r) => {
        const comments = (r.comments.nodes || []).map((c) => `    - ${c.path}:${c.line ?? "?"}: ${c.body}`)
        return [
          UI.t("github.context_review", { author: r.author.login, submittedAt: r.submittedAt }),
          UI.t("github.context_review_body", { body: r.body }),
          ...(comments.length > 0 ? [UI.t("github.context_comments"), ...comments] : []),
        ]
      })

      return [
        "<github_action_context>",
        UI.t("github.action_context"),
        "</github_action_context>",
        "",
        UI.t("github.context_read_only"),
        "<pull_request>",
        UI.t("github.context_title", { value: pr.title }),
        UI.t("github.context_body", { value: pr.body }),
        UI.t("github.context_author", { value: pr.author.login }),
        UI.t("github.context_created_at", { value: pr.createdAt }),
        UI.t("github.context_base_branch", { value: pr.baseRefName }),
        UI.t("github.context_head_branch", { value: pr.headRefName }),
        UI.t("github.context_state", { value: pr.state }),
        UI.t("github.context_additions", { value: pr.additions }),
        UI.t("github.context_deletions", { value: pr.deletions }),
        UI.t("github.context_total_commits", { value: pr.commits.totalCount }),
        UI.t("github.context_changed_files", { count: pr.files.nodes.length }),
        ...(comments.length > 0 ? ["<pull_request_comments>", ...comments, "</pull_request_comments>"] : []),
        ...(files.length > 0 ? ["<pull_request_changed_files>", ...files, "</pull_request_changed_files>"] : []),
        ...(reviewData.length > 0 ? ["<pull_request_reviews>", ...reviewData, "</pull_request_reviews>"] : []),
        "</pull_request>",
      ].join("\n")
    }

    async function revokeAppToken() {
      if (!appToken) return

      await fetch("https://api.github.com/installation/token", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${appToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })
    }
  })
})
