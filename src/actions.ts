import type ModuleInstance from './main.js'
import { inputChoices, meChoices, auxChoices, memoryChoices, firstId } from './choices.js'

// Everything here is fire-and-forget, and that is a property of animATEM's
// control server rather than a shortcut taken here:
//
//   * Nothing is ever acknowledged. There is no reply, no error frame and no
//     result — a client learns whether a command worked by watching the next
//     snapshot.
//   * A failing command is caught and logged on the server, not propagated. So
//     a command sent while the switcher is disconnected looks identical to one
//     that worked.
//
// The honest consequence: never light a button from the fact that a press
// happened. Every feedback in this module reads the snapshot instead, and
// "animATEM's ATEM connection is up" is what says whether that snapshot means
// anything.

export type ActionsSchema = {
  cut: { options: { me: number } }
  auto: { options: { me: number } }
  ftb: { options: { me: number } }
  set_program: { options: { input: number; me: number } }
  set_preview: { options: { input: number; me: number } }
  take_preview: { options: { me: number; transition: string } }
  set_aux: { options: { source: number; bus: number } }
  aux_follow_program: { options: { bus: number; me: number } }
  recall_memory: { options: { memoryId: string } }
  animate_supersource: { options: { memoryId: string; durationMs: number } }
}

export function UpdateActions(self: ModuleInstance): void {
  const inputs = inputChoices(self)
  const mes = meChoices(self)
  const auxes = auxChoices(self)
  const memories = memoryChoices(self)
  const superSourceMemories = memoryChoices(self, 'supersource')

  const meOption = {
    id: 'me',
    type: 'dropdown',
    label: 'M/E',
    choices: mes,
    default: firstId(mes),
    allowCustom: true
  } as const

  // allowCustom throughout so a button built while animATEM was offline still
  // carries a usable number rather than an empty field — the input list only
  // exists once a switcher has actually connected.
  const inputOption = {
    id: 'input',
    type: 'dropdown',
    label: 'Input',
    choices: inputs,
    default: firstId(inputs),
    allowCustom: true
  } as const

  self.setActionDefinitions({
    cut: {
      name: 'Cut',
      options: [meOption],
      callback: async (event) => {
        self.client?.send({ type: 'cut', me: Number(event.options.me) })
      }
    },
    auto: {
      name: 'Auto transition',
      options: [meOption],
      callback: async (event) => {
        self.client?.send({ type: 'auto', me: Number(event.options.me) })
      }
    },
    ftb: {
      name: 'Fade to black',
      options: [meOption],
      callback: async (event) => {
        self.client?.send({ type: 'ftb', me: Number(event.options.me) })
      }
    },
    set_program: {
      name: 'Set program input',
      description: 'Takes the input straight to air on that M/E.',
      options: [inputOption, meOption],
      callback: async (event) => {
        self.client?.send({
          type: 'setProgram',
          input: Number(event.options.input),
          me: Number(event.options.me)
        })
      }
    },
    set_preview: {
      name: 'Set preview input',
      options: [inputOption, meOption],
      callback: async (event) => {
        self.client?.send({
          type: 'setPreview',
          input: Number(event.options.input),
          me: Number(event.options.me)
        })
      }
    },
    take_preview: {
      name: 'Take preview to program',
      description:
        'Cut or auto on that M/E. Skipped with no snapshot, because there is no preview to take and the control server would swallow the command silently.',
      options: [
        meOption,
        {
          id: 'transition',
          type: 'dropdown',
          label: 'Transition',
          choices: [
            { id: 'cut', label: 'Cut' },
            { id: 'auto', label: 'Auto' }
          ],
          default: 'cut'
        }
      ],
      callback: async (event) => {
        const me = self.mixEffect(Number(event.options.me))
        if (!me) {
          self.log('warn', 'Take skipped — no snapshot, so preview is unknown.')
          return
        }
        self.client?.send({
          type: event.options.transition === 'auto' ? 'auto' : 'cut',
          me: me.index
        })
      }
    },
    set_aux: {
      name: 'Set aux source',
      options: [
        {
          id: 'source',
          type: 'dropdown',
          label: 'Source',
          choices: inputs,
          default: firstId(inputs),
          allowCustom: true
        },
        {
          id: 'bus',
          type: 'dropdown',
          label: 'Aux bus',
          choices: auxes,
          default: firstId(auxes),
          allowCustom: true
        }
      ],
      callback: async (event) => {
        self.client?.send({
          type: 'setAux',
          source: Number(event.options.source),
          bus: Number(event.options.bus)
        })
      }
    },
    aux_follow_program: {
      name: 'Point an aux at what is on program',
      description:
        'A one-shot follow, not a standing rule — it reads program from the snapshot and sets the aux once. animATEM has no follow mode, so a repeating trigger is what makes it stick.',
      options: [
        {
          id: 'bus',
          type: 'dropdown',
          label: 'Aux bus',
          choices: auxes,
          default: firstId(auxes),
          allowCustom: true
        },
        meOption
      ],
      callback: async (event) => {
        const me = self.mixEffect(Number(event.options.me))
        if (!me) {
          self.log('warn', 'Aux follow skipped — no snapshot, so program is unknown.')
          return
        }
        self.client?.send({
          type: 'setAux',
          source: me.programInput,
          bus: Number(event.options.bus)
        })
      }
    },
    recall_memory: {
      name: 'Recall a memory',
      description: 'SuperSource or DVE layouts saved in animATEM.',
      options: [
        {
          id: 'memoryId',
          type: 'dropdown',
          label: 'Memory',
          choices: memories,
          default: String(firstId(memories) ?? ''),
          allowCustom: true
        }
      ],
      callback: async (event) => {
        const id = String(event.options.memoryId ?? '').trim()
        if (!id) return
        self.client?.send({ type: 'recallMemory', id })
      }
    },
    animate_supersource: {
      name: 'Animate to a SuperSource memory',
      description:
        'Only SuperSource memories can be animated — a DVE memory recalls instantly. The dropdown is filtered to the ones that can.',
      options: [
        {
          id: 'memoryId',
          type: 'dropdown',
          label: 'SuperSource memory',
          choices: superSourceMemories,
          default: String(firstId(superSourceMemories) ?? ''),
          allowCustom: true
        },
        {
          id: 'durationMs',
          type: 'number',
          label: 'Duration (ms)',
          min: 0,
          max: 30000,
          default: 1000
        }
      ],
      callback: async (event) => {
        const id = String(event.options.memoryId ?? '').trim()
        if (!id) return
        self.client?.send({
          type: 'animateSuperSource',
          id,
          durationMs: Number(event.options.durationMs)
        })
      }
    }
  })
}
