/** @jsxImportSource @opentui/solid */
import { describe, expect, test } from "bun:test"
import { tmpdir } from "../../../fixture/fixture"
import { json, mount, wait } from "./sync-fixture"
import type { GlobalEvent } from "@miaopan/sdk/v2"

const sessionID = "ses_new_review"
const session = {
  id: sessionID,
  slug: "review",
  projectID: "proj_test",
  title: "review",
  time: { created: 1, updated: 1 },
  version: "1.15.13",
  directory: "/tmp/miaopanCode/packages/tui",
}

function sessionEvent(type: "session.created" | "session.updated" | "session.deleted", info = session): GlobalEvent {
  return {
    directory: "/tmp/other",
    project: "proj_test",
    payload: {
      id: `evt_${type}`,
      type,
      properties: { sessionID: info.id, info },
    },
  }
}

function branchEvent(branch: string, workspace?: string): GlobalEvent {
  return {
    directory: "/tmp/other",
    project: "proj_test",
    workspace,
    payload: {
      id: `evt_vcs_${branch}`,
      type: "vcs.branch.updated",
      properties: { branch },
    },
  }
}

describe("tui sync", () => {
  test("refresh scopes sessions by default and lists project sessions when disabled", async () => {
    await using tmp = await tmpdir()
    await Bun.write(`${tmp.path}/kv.json`, "{}")
    const { app, kv, sync, session } = await mount(undefined, tmp.path)

    try {
      expect(kv.get("session_directory_filter_enabled", true)).toBe(true)
      expect(session.at(-1)?.searchParams.get("roots")).toBeNull()
      expect(session.at(-1)?.searchParams.get("scope")).toBeNull()
      expect(session.at(-1)?.searchParams.get("path")).toBe("packages/tui")

      kv.set("session_directory_filter_enabled", false)
      await sync.session.refresh()

      expect(session.at(-1)?.searchParams.get("scope")).toBe("project")
      expect(session.at(-1)?.searchParams.get("path")).toBeNull()
      expect(session.at(-1)?.searchParams.get("roots")).toBeNull()
    } finally {
      app.renderer.destroy()
    }
  })

  test("vcs branch updates only apply for the active workspace", async () => {
    await using tmp = await tmpdir()
    await Bun.write(`${tmp.path}/kv.json`, "{}")
    const { app, emit, project, sync } = await mount(undefined, tmp.path)

    try {
      expect(sync.data.vcs?.branch).toBe("main")

      project.workspace.set("ws_a")
      emit(branchEvent("other", "ws_b"))
      await Bun.sleep(30)

      expect(sync.data.vcs?.branch).toBe("main")

      emit(branchEvent("feature", "ws_a"))
      await wait(() => sync.data.vcs?.branch === "feature")

      expect(sync.data.vcs?.branch).toBe("feature")
    } finally {
      app.renderer.destroy()
    }
  })

  test("stale session lists preserve sessions hydrated after the request started", async () => {
    await using tmp = await tmpdir()
    await Bun.write(`${tmp.path}/kv.json`, "{}")

    let resolveList!: (response: Response) => void
    const list = new Promise<Response>((resolve) => {
      resolveList = resolve
    })
    let requested = false
    let resolved = false
    const { app, sync } = await mount(
      (url) => {
        if (url.pathname === "/session") {
          requested = true
          return list
        }
        if (url.pathname === `/session/${sessionID}`) return json(session)
        if (
          url.pathname === `/session/${sessionID}/message` ||
          url.pathname === `/session/${sessionID}/todo` ||
          url.pathname === `/session/${sessionID}/diff`
        )
          return json([])
        return undefined
      },
      tmp.path,
      { waitForComplete: false },
    )

    try {
      await wait(() => requested && sync.status === "partial")
      await sync.session.sync(sessionID)
      expect(sync.session.get(sessionID)?.title).toBe("review")

      resolved = true
      resolveList(json([]))
      await wait(() => sync.status === "complete")

      expect(sync.session.get(sessionID)?.title).toBe("review")
    } finally {
      if (!resolved) resolveList(json([]))
      app.renderer.destroy()
    }
  })

  test("session events win over stale lists without duplicating or reviving sessions", async () => {
    await using tmp = await tmpdir()
    await Bun.write(`${tmp.path}/kv.json`, "{}")

    let resolveList!: (response: Response) => void
    const list = new Promise<Response>((resolve) => {
      resolveList = resolve
    })
    let requested = false
    let resolved = false
    const { app, emit, sync } = await mount(
      (url) => {
        if (url.pathname !== "/session") return undefined
        requested = true
        return list
      },
      tmp.path,
      { waitForComplete: false },
    )

    try {
      await wait(() => requested && sync.status === "partial")
      const deleted = { ...session, id: "ses_deleted_review", title: "deleted" }
      emit(sessionEvent("session.created"))
      emit(sessionEvent("session.updated", { ...session, title: "updated", time: { created: 1, updated: 2 } }))
      emit(sessionEvent("session.created", deleted))
      emit(sessionEvent("session.deleted", deleted))
      await wait(() => sync.session.get(sessionID)?.title === "updated")
      expect(sync.data.session.filter((item) => item.id === sessionID)).toHaveLength(1)
      await wait(() => sync.session.get(deleted.id) === undefined)

      resolved = true
      resolveList(json([{ ...session, title: "stale" }, deleted]))
      await wait(() => sync.status === "complete")

      expect(sync.session.get(sessionID)?.title).toBe("updated")
      expect(sync.data.session.filter((item) => item.id === sessionID)).toHaveLength(1)
      expect(sync.session.get(deleted.id)).toBeUndefined()
    } finally {
      if (!resolved) resolveList(json([]))
      app.renderer.destroy()
    }
  })
})
