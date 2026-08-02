import type ModuleInstance from './main.js'
import { inputChoices, meChoices, auxChoices, firstId } from './choices.js'

// Two connection questions, and they are not the same:
//
//   module_connected   this module <-> animATEM's control server (127.0.0.1:51234)
//   atem_connected     animATEM <-> the ATEM switcher
//
// The second can be down while the first is up, and that is the normal state
// while a switcher is rebooting. Conflating them means an operator restarts the
// wrong thing.
//
// Tally reads the snapshot rather than remembering what was last pressed. That
// is deliberate: animATEM acknowledges nothing, so a button lit from its own
// press would go red on a command the switcher never received.

export type FeedbacksSchema = {
  module_connected: { type: 'boolean'; options: Record<string, never> }
  atem_connected: { type: 'boolean'; options: Record<string, never> }
  program_input: { type: 'boolean'; options: { input: number; me: number } }
  preview_input: { type: 'boolean'; options: { input: number; me: number } }
  in_transition: { type: 'boolean'; options: { me: number } }
  aux_source: { type: 'boolean'; options: { bus: number; source: number } }
}

export function UpdateFeedbacks(self: ModuleInstance): void {
  const inputs = inputChoices(self)
  const mes = meChoices(self)
  const auxes = auxChoices(self)

  const meOption = {
    id: 'me',
    type: 'dropdown',
    label: 'M/E',
    choices: mes,
    default: firstId(mes),
    allowCustom: true
  } as const

  const inputOption = {
    id: 'input',
    type: 'dropdown',
    label: 'Input',
    choices: inputs,
    default: firstId(inputs),
    allowCustom: true
  } as const

  self.setFeedbackDefinitions({
    module_connected: {
      name: 'Connected to animATEM',
      type: 'boolean',
      description:
        "The control server is reachable. Different from the switcher being connected — put both on a page and you can tell 'the app is gone' from 'the switcher is gone'.",
      defaultStyle: { bgcolor: 0x003300, color: 0x00ff00 },
      options: [],
      callback: () => self.client?.isOpen() === true
    },
    atem_connected: {
      name: "animATEM's ATEM connection is up",
      type: 'boolean',
      description:
        'animATEM has a live connection to the switcher. While this is dark every tally below is stale, not false.',
      defaultStyle: { bgcolor: 0x008000, color: 0xffffff },
      options: [],
      callback: () => self.atemStatus === 'connected'
    },
    program_input: {
      name: 'Program input is X',
      type: 'boolean',
      description: 'Program tally, per M/E — read from the snapshot, not from what was pressed.',
      defaultStyle: { bgcolor: 0xcc0000, color: 0xffffff },
      options: [inputOption, meOption],
      callback: (feedback) =>
        self.mixEffect(Number(feedback.options.me))?.programInput === Number(feedback.options.input)
    },
    preview_input: {
      name: 'Preview input is X',
      type: 'boolean',
      description: 'Preview tally, per M/E.',
      defaultStyle: { bgcolor: 0x008000, color: 0xffffff },
      options: [inputOption, meOption],
      callback: (feedback) =>
        self.mixEffect(Number(feedback.options.me))?.previewInput === Number(feedback.options.input)
    },
    in_transition: {
      name: 'M/E is mid-transition',
      type: 'boolean',
      description:
        'Lit while an auto is running. Worth a colour of its own — during a transition both buses are on air, so a plain program tally is briefly telling half the story.',
      defaultStyle: { bgcolor: 0xcc7a00, color: 0x000000 },
      options: [meOption],
      callback: (feedback) => self.mixEffect(Number(feedback.options.me))?.inTransition === true
    },
    aux_source: {
      name: 'Aux bus is on a source',
      type: 'boolean',
      defaultStyle: { bgcolor: 0xcc0000, color: 0xffffff },
      options: [
        {
          id: 'bus',
          type: 'dropdown',
          label: 'Aux bus',
          choices: auxes,
          default: firstId(auxes),
          allowCustom: true
        },
        {
          id: 'source',
          type: 'dropdown',
          label: 'Source',
          choices: inputs,
          default: firstId(inputs),
          allowCustom: true
        }
      ],
      callback: (feedback) =>
        self.snapshot?.auxes?.[Number(feedback.options.bus)] === Number(feedback.options.source)
    }
  })
}
