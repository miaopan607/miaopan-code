import { AgentV2 } from "@miaopan-code/core/agent"
import { AISDK } from "@miaopan-code/core/aisdk"
import { Catalog } from "@miaopan-code/core/catalog"
import { CommandV2 } from "@miaopan-code/core/command"
import { Credential } from "@miaopan-code/core/credential"
import { AppNodeBuilder } from "@miaopan-code/core/effect/app-node-builder"
import { LayerNodePlatform } from "@miaopan-code/core/effect/app-node-platform"
import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { EventV2 } from "@miaopan-code/core/event"
import { FileSystem } from "@miaopan-code/core/filesystem"
import { FSUtil } from "@miaopan-code/core/fs-util"
import { Integration } from "@miaopan-code/core/integration"
import { Location } from "@miaopan-code/core/location"
import { Npm } from "@miaopan-code/core/npm"
import { PluginV2 } from "@miaopan-code/core/plugin"
import { Reference } from "@miaopan-code/core/reference"
import { SkillV2 } from "@miaopan-code/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
