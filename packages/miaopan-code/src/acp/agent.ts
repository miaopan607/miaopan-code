import {
  RequestError,
  type Agent as ACPAgent,
  type AgentSideConnection,
  type AuthenticateRequest,
  type CancelNotification,
  type CloseSessionRequest,
  type ForkSessionRequest,
  type InitializeRequest,
  type ListSessionsRequest,
  type LoadSessionRequest,
  type NewSessionRequest,
  type PromptRequest,
  type ResumeSessionRequest,
  type SetSessionConfigOptionRequest,
  type SetSessionModelRequest,
  type SetSessionModeRequest,
} from "@agentclientprotocol/sdk"
import { Effect } from "effect"
import type { MiaopanCodeClient } from "@miaopan-code/sdk/v2"
import type { Language } from "@miaopan-code/core/i18n"
import * as ACPError from "./error"
import * as ACPService from "./service"

export function init(input: { sdk: MiaopanCodeClient; language?: Language }) {
  return {
    create: (connection: AgentSideConnection) => {
      return new Agent(ACPService.make({ sdk: input.sdk, connection, language: input.language }), input.language)
    },
  }
}

export class Agent implements ACPAgent {
  constructor(
    private readonly service: ACPService.Interface,
    private readonly language?: Language,
  ) {}

  initialize(params: InitializeRequest) {
    return run(this.service.initialize(params), this.language)
  }

  authenticate(params: AuthenticateRequest) {
    return run(this.service.authenticate(params), this.language)
  }

  newSession(params: NewSessionRequest) {
    return run(this.service.newSession(params), this.language)
  }

  loadSession(params: LoadSessionRequest) {
    return run(this.service.loadSession(params), this.language)
  }

  listSessions(params: ListSessionsRequest) {
    return run(this.service.listSessions(params), this.language)
  }

  resumeSession(params: ResumeSessionRequest) {
    return run(this.service.resumeSession(params), this.language)
  }

  closeSession(params: CloseSessionRequest) {
    return run(this.service.closeSession(params), this.language)
  }

  unstable_forkSession(params: ForkSessionRequest) {
    return run(this.service.forkSession(params), this.language)
  }

  setSessionConfigOption(params: SetSessionConfigOptionRequest) {
    return run(this.service.setSessionConfigOption(params), this.language)
  }

  setSessionMode(params: SetSessionModeRequest) {
    return run(this.service.setSessionMode(params), this.language)
  }

  unstable_setSessionModel(params: SetSessionModelRequest) {
    return run(this.service.setSessionModel(params), this.language)
  }

  prompt(params: PromptRequest) {
    return run(this.service.prompt(params), this.language)
  }

  cancel(params: CancelNotification) {
    return run(this.service.cancel(params), this.language)
  }
}

function run<A>(effect: Effect.Effect<A, ACPService.Error>, language?: Language) {
  return Effect.runPromise(effect.pipe(Effect.mapError((error) => ACPError.toRequestError(error, language)))).catch(
    (defect: unknown) => {
      if (defect instanceof RequestError) throw defect
      throw ACPError.toRequestError(ACPError.fromUnknownDefect(defect, language), language)
    },
  )
}

export * as ACP from "./agent"
