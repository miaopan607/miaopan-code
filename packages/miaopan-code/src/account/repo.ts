import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { eq } from "drizzle-orm"
import { serviceUse } from "@miaopan-code/core/effect/service-use"
import { resolveLanguage, type Language } from "@miaopan-code/core/i18n"
import { Effect, Layer, Option, Schema, Context } from "effect"

import { Database } from "@miaopan-code/core/database/database"
import { AccountStateTable, AccountTable } from "@miaopan-code/core/account/sql"
import { AccessToken, AccountID, AccountRepoError, Info, OrgID, RefreshToken } from "./schema"
import { normalizeServerUrl } from "./url"

export type AccountRow = (typeof AccountTable)["$inferSelect"]

const ACCOUNT_STATE_ID = 1

export interface Interface {
  readonly active: (language?: Language) => Effect.Effect<Option.Option<Info>, AccountRepoError>
  readonly list: (language?: Language) => Effect.Effect<Info[], AccountRepoError>
  readonly remove: (accountID: AccountID, language?: Language) => Effect.Effect<void, AccountRepoError>
  readonly use: (
    accountID: AccountID,
    orgID: Option.Option<OrgID>,
    language?: Language,
  ) => Effect.Effect<void, AccountRepoError>
  readonly getRow: (
    accountID: AccountID,
    language?: Language,
  ) => Effect.Effect<Option.Option<AccountRow>, AccountRepoError>
  readonly persistToken: (input: {
    accountID: AccountID
    accessToken: AccessToken
    refreshToken: RefreshToken
    expiry: Option.Option<number>
    language?: Language
  }) => Effect.Effect<void, AccountRepoError>
  readonly persistAccount: (input: {
    id: AccountID
    email: string
    url: string
    accessToken: AccessToken
    refreshToken: RefreshToken
    expiry: number
    orgID: Option.Option<OrgID>
    language?: Language
  }) => Effect.Effect<void, AccountRepoError>
}

export class Service extends Context.Service<Service, Interface>()("@miaopan-code/AccountRepo") {}

export const use = serviceUse(Service)

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const defaultLanguage = resolveLanguage(process.env.MIAOPAN_CODE_LANGUAGE)
    const { db } = yield* Database.Service
    const decode = Schema.decodeUnknownSync(Info)

    const query = <A, E>(effect: Effect.Effect<A, E>, requestedLanguage?: Language) =>
      effect.pipe(
        Effect.mapError(
          (cause) => new AccountRepoError({ language: resolveLanguage(requestedLanguage ?? defaultLanguage), cause }),
        ),
      )

    const current = Effect.fnUntraced(function* () {
      const state = yield* db.select().from(AccountStateTable).where(eq(AccountStateTable.id, ACCOUNT_STATE_ID)).get()
      if (!state?.active_account_id) return
      const account = yield* db.select().from(AccountTable).where(eq(AccountTable.id, state.active_account_id)).get()
      if (!account) return
      return { ...account, active_org_id: state.active_org_id ?? null }
    })

    const state = (accountID: AccountID, orgID: Option.Option<OrgID>) => {
      const id = Option.getOrNull(orgID)
      return db
        .insert(AccountStateTable)
        .values({ id: ACCOUNT_STATE_ID, active_account_id: accountID, active_org_id: id })
        .onConflictDoUpdate({
          target: AccountStateTable.id,
          set: { active_account_id: accountID, active_org_id: id },
        })
        .run()
    }

    const active = Effect.fn("AccountRepo.active")((requestedLanguage?: Language) =>
      query(current(), requestedLanguage).pipe(Effect.map((row) => (row ? Option.some(decode(row)) : Option.none()))),
    )

    const list = Effect.fn("AccountRepo.list")((requestedLanguage?: Language) =>
      query(
        db
          .select()
          .from(AccountTable)
          .all()
          .pipe(Effect.map((rows) => rows.map((row: AccountRow) => decode({ ...row, active_org_id: null })))),
        requestedLanguage,
      ),
    )

    const remove = Effect.fn("AccountRepo.remove")((accountID: AccountID, requestedLanguage?: Language) =>
      query(
        db.transaction((tx) =>
          Effect.gen(function* () {
            yield* tx
              .update(AccountStateTable)
              .set({ active_account_id: null, active_org_id: null })
              .where(eq(AccountStateTable.active_account_id, accountID))
              .run()
            yield* tx.delete(AccountTable).where(eq(AccountTable.id, accountID)).run()
          }),
        ),
        requestedLanguage,
      ).pipe(Effect.asVoid),
    )

    const use = Effect.fn("AccountRepo.use")(
      (accountID: AccountID, orgID: Option.Option<OrgID>, requestedLanguage?: Language) =>
        query(state(accountID, orgID), requestedLanguage).pipe(Effect.asVoid),
    )

    const getRow = Effect.fn("AccountRepo.getRow")((accountID: AccountID, requestedLanguage?: Language) =>
      query(db.select().from(AccountTable).where(eq(AccountTable.id, accountID)).get(), requestedLanguage).pipe(
        Effect.map(Option.fromNullishOr),
      ),
    )

    const persistToken = Effect.fn("AccountRepo.persistToken")((input) =>
      query(
        db
          .update(AccountTable)
          .set({
            access_token: input.accessToken,
            refresh_token: input.refreshToken,
            token_expiry: Option.getOrNull(input.expiry),
          })
          .where(eq(AccountTable.id, input.accountID))
          .run(),
        input.language,
      ).pipe(Effect.asVoid),
    )

    const persistAccount = Effect.fn("AccountRepo.persistAccount")((input) =>
      query(
        db.transaction((tx) =>
          Effect.gen(function* () {
            const url = normalizeServerUrl(input.url)

            yield* tx
              .insert(AccountTable)
              .values({
                id: input.id,
                email: input.email,
                url,
                access_token: input.accessToken,
                refresh_token: input.refreshToken,
                token_expiry: input.expiry,
              })
              .onConflictDoUpdate({
                target: AccountTable.id,
                set: {
                  email: input.email,
                  url,
                  access_token: input.accessToken,
                  refresh_token: input.refreshToken,
                  token_expiry: input.expiry,
                },
              })
              .run()
            yield* state(input.id, input.orgID)
          }),
        ),
        input.language,
      ).pipe(Effect.asVoid),
    )

    return Service.of({
      active,
      list,
      remove,
      use,
      getRow,
      persistToken,
      persistAccount,
    })
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [Database.node] })

export * as AccountRepo from "./repo"
