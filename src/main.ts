import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import {
  UpdateVariableDefinitions,
  RefreshVariableValues,
  type VariablesSchema
} from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { AnimatemClient } from './wsClient.js'
import type { AtemSnapshot, ConnectionStatus, Memory, MixEffectState } from './protocol.js'

export type ModuleSchema = {
  config: ModuleConfig
  secrets: undefined
  actions: ActionsSchema
  feedbacks: FeedbacksSchema
  variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
  config!: ModuleConfig
  client: AnimatemClient | null = null

  atemStatus: ConnectionStatus = 'disconnected'
  snapshot: AtemSnapshot | null = null
  memories: Memory[] = []
  private lastShape = ''

  constructor(internal: unknown) {
    super(internal)
  }

  /** One M/E from the last snapshot, or null when there is no snapshot at
   *  all. Callers must distinguish those: animATEM sends `snapshot: null`
   *  when no switcher is connected, and an action that guessed at program or
   *  preview from a missing snapshot would put the wrong thing on air. */
  mixEffect(index: number): MixEffectState | null {
    return this.snapshot?.mixEffects.find((me) => me.index === index) ?? null
  }

  async init(config: ModuleConfig): Promise<void> {
    this.config = config

    this.updateActions()
    this.updateFeedbacks()
    this.updatePresets()
    this.updateVariableDefinitions()

    this.connectClient()
  }

  async destroy(): Promise<void> {
    this.client?.stop()
    this.client = null
  }

  async configUpdated(config: ModuleConfig): Promise<void> {
    this.config = config
    this.client?.stop()
    this.connectClient()
  }

  getConfigFields(): SomeCompanionConfigField[] {
    return GetConfigFields()
  }

  updateActions(): void {
    UpdateActions(this)
  }

  updateFeedbacks(): void {
    UpdateFeedbacks(this)
  }

  updatePresets(): void {
    UpdatePresets(this)
  }

  updateVariableDefinitions(): void {
    UpdateVariableDefinitions(this)
  }

  /** Re-register every definition set that is derived from live state, then
   *  push current values. Called on a shape change, not on every snapshot. */
  rebuild(): void {
    this.updateActions()
    this.updateFeedbacks()
    this.updateVariableDefinitions()
    this.updatePresets()
    RefreshVariableValues(this)
    this.checkAllFeedbacks()
  }

  private connectClient(): void {
    this.updateStatus(InstanceStatus.Connecting)

    this.client = new AnimatemClient(this.config.host, this.config.port, {
      onOpen: () => {
        this.updateStatus(InstanceStatus.Ok)
        RefreshVariableValues(this)
        this.checkFeedbacks('module_connected')
      },
      onClose: () => {
        this.updateStatus(InstanceStatus.ConnectionFailure, 'Disconnected from animATEM')
        RefreshVariableValues(this)
        this.checkFeedbacks('module_connected')
      },
      onStatus: (status) => {
        this.atemStatus = status
        RefreshVariableValues(this)
        this.checkFeedbacks('atem_connected')
      },
      onSnapshot: (snapshot) => {
        this.snapshot = snapshot
        // Re-register only when the SHAPE moved — the inputs, M/Es and aux buses
        // the dropdowns, variables and presets are built from. A snapshot
        // arrives on every bus change, and rebuilding every definition each time
        // would churn the dropdowns an operator is mid-way through using.
        const shape = JSON.stringify([
          snapshot?.productModel ?? '',
          (snapshot?.inputs ?? []).map((i) => [i.id, i.shortName, i.longName]),
          (snapshot?.mixEffects ?? []).map((me) => me.index),
          Object.keys(snapshot?.auxes ?? {})
        ])
        if (shape !== this.lastShape) {
          this.lastShape = shape
          this.rebuild()
        } else {
          RefreshVariableValues(this)
          this.checkAllFeedbacks()
        }
      },
      onMemories: (memories) => {
        // animATEM does NOT broadcast memories on change — they arrive on
        // connect and when the app explicitly calls broadcastMemories(). So a
        // cached list can go stale, and this is the only moment the memory
        // dropdowns and presets can be refreshed.
        this.memories = memories
        this.rebuild()
      }
    })
    this.client.start()
  }
}
