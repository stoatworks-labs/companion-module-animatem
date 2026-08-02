import type ModuleInstance from './main.js'
import { inputName } from './choices.js'

// Program and preview are exposed as both a NAME and a NUMBER. The name is what
// goes on a button face; the number is what another action needs if a button is
// built to pass it on. Publishing only the name would make the second
// impossible without a lookup table an operator would have to maintain by hand.
export type VariablesSchema = Record<string, string | number>

export function UpdateVariableDefinitions(self: ModuleInstance): void {
  const defs: Record<string, { name: string }> = {
    connection_status: { name: 'Connection to animATEM' },
    atem_connection_status: { name: "animATEM's connection status to the ATEM switcher" },
    product_model: { name: 'Switcher model' },
    input_count: { name: 'Number of inputs' },
    memory_count: { name: 'Number of saved memories' },
    // Kept unprefixed as well as per-M/E, because these were the ids the
    // pre-split module published and a button built against it should keep
    // working. They track M/E 1.
    program_input: { name: 'Program input name (M/E 1)' },
    preview_input: { name: 'Preview input name (M/E 1)' }
  }

  for (const me of self.snapshot?.mixEffects ?? []) {
    const n = me.index + 1
    defs[`me${n}_program`] = { name: `M/E ${n}: program input name` }
    defs[`me${n}_program_id`] = { name: `M/E ${n}: program input number` }
    defs[`me${n}_preview`] = { name: `M/E ${n}: preview input name` }
    defs[`me${n}_preview_id`] = { name: `M/E ${n}: preview input number` }
    defs[`me${n}_in_transition`] = { name: `M/E ${n}: mid-transition` }
  }

  for (const bus of Object.keys(self.snapshot?.auxes ?? {})) {
    const n = Number(bus) + 1
    defs[`aux${n}_source`] = { name: `Aux ${n}: source name` }
    defs[`aux${n}_source_id`] = { name: `Aux ${n}: source number` }
  }

  self.setVariableDefinitions(defs)
}

export function RefreshVariableValues(self: ModuleInstance): void {
  const values: Record<string, string | number> = {
    connection_status: self.client?.isOpen() ? 'Connected' : 'Disconnected',
    atem_connection_status: self.atemStatus,
    product_model: self.snapshot?.productModel ?? '',
    input_count: self.snapshot?.inputs.length ?? 0,
    memory_count: self.memories.length
  }

  const me0 = self.mixEffect(0)
  values.program_input = inputName(self, me0?.programInput)
  values.preview_input = inputName(self, me0?.previewInput)

  for (const me of self.snapshot?.mixEffects ?? []) {
    const n = me.index + 1
    values[`me${n}_program`] = inputName(self, me.programInput)
    values[`me${n}_program_id`] = me.programInput
    values[`me${n}_preview`] = inputName(self, me.previewInput)
    values[`me${n}_preview_id`] = me.previewInput
    values[`me${n}_in_transition`] = me.inTransition ? 'Yes' : 'No'
  }

  for (const [bus, source] of Object.entries(self.snapshot?.auxes ?? {})) {
    const n = Number(bus) + 1
    values[`aux${n}_source`] = inputName(self, source)
    values[`aux${n}_source_id`] = source
  }

  self.setVariableValues(values)
}
