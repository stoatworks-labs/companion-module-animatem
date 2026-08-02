import type ModuleInstance from './main.js'
import type { DropdownChoice } from '@companion-module/base'

// Dropdown lists built from the last snapshot animATEM pushed, shared between
// actions, feedbacks and presets so all three stay in step with the switcher
// that is actually connected.
//
// This is the upgrade that matters most for an operator: an ATEM's inputs are
// numbered 1..40 plus a scattering of internal sources (black, bars, media
// players, SuperSource), and the numbers are not contiguous or memorable.
// animATEM already sends the input list with its short and long names, so
// asking someone to type "3010" for SuperSource was never necessary.

export function inputChoices(self: ModuleInstance): DropdownChoice[] {
  const inputs = self.snapshot?.inputs ?? []
  return inputs.map((i) => ({
    id: i.id,
    // Short name is what is printed on the switcher's own multiview, so it goes
    // first — that is the name an operator is looking at while pressing this.
    label: i.shortName ? `${i.shortName} — ${i.longName} (${i.id})` : `${i.longName} (${i.id})`
  }))
}

export function meChoices(self: ModuleInstance): DropdownChoice[] {
  const mes = self.snapshot?.mixEffects ?? []
  if (mes.length === 0) return [{ id: 0, label: 'M/E 1' }]
  return mes.map((me) => ({ id: me.index, label: `M/E ${me.index + 1}` }))
}

export function auxChoices(self: ModuleInstance): DropdownChoice[] {
  const auxes = Object.keys(self.snapshot?.auxes ?? {})
  if (auxes.length === 0) return [{ id: 0, label: 'Aux 1' }]
  return auxes.map((bus) => ({ id: Number(bus), label: `Aux ${Number(bus) + 1}` }))
}

/**
 * Memories, split by kind.
 *
 * `memories` is the one message animATEM does NOT broadcast on change — it is
 * sent on connect and when the app explicitly calls broadcastMemories(). A
 * module that cached it could go stale, so these lists are rebuilt whenever a
 * memories message arrives, and the actions accept a typed id as well.
 */
export function memoryChoices(
  self: ModuleInstance,
  kind?: 'supersource' | 'dve'
): DropdownChoice[] {
  return self.memories
    .filter((m) => !kind || m.kind === kind)
    .map((m) => ({ id: m.id, label: `${m.name} (${m.kind})` }))
}

export function inputName(self: ModuleInstance, id: number | undefined): string {
  if (id === undefined || id === null) return ''
  const input = (self.snapshot?.inputs ?? []).find((i) => i.id === id)
  return input?.shortName || input?.longName || String(id)
}

export function firstId(choices: DropdownChoice[]): string | number {
  return choices[0]?.id ?? 0
}
