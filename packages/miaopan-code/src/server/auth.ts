export * as ServerAuth from "./auth"

import { ConfigService } from "@/effect/config-service"
import { Flag } from "@miaopan-code/core/flag/flag"
import { Config as EffectConfig, Context, Option, Redacted } from "effect"

export type Credentials = {
  password?: string
  username?: string
}

export type DecodedCredentials = {
  readonly username: string
  readonly password: Redacted.Redacted
}

export class Config extends ConfigService.Service<Config>()("@miaopan-code/ServerAuthConfig", {
  password: EffectConfig.string("MIAOPAN_CODE_SERVER_PASSWORD").pipe(EffectConfig.option),
  username: EffectConfig.string("MIAOPAN_CODE_SERVER_USERNAME").pipe(EffectConfig.withDefault("miaopan-code")),
}) {}

export type Info = Context.Service.Shape<typeof Config>

export function required(config: Info) {
  return Option.isSome(config.password) && config.password.value !== ""
}

export function authorized(credentials: DecodedCredentials, config: Info) {
  return (
    Option.isSome(config.password) &&
    credentials.username === config.username &&
    Redacted.value(credentials.password) === config.password.value
  )
}

export function header(credentials?: Credentials) {
  const password = credentials?.password ?? Flag.MIAOPAN_CODE_SERVER_PASSWORD
  if (!password) return undefined

  const username = credentials?.username ?? Flag.MIAOPAN_CODE_SERVER_USERNAME ?? "miaopan-code"
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
}

export function headers(credentials?: Credentials) {
  const authorization = header(credentials)
  if (!authorization) return undefined
  return { Authorization: authorization }
}
