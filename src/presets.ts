import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'
import { inputChoices, meChoices } from './choices.js'

// Program and preview bus rows are GENERATED from the switcher's own input
// list, because an ATEM's sources are numbered awkwardly (1..N plus black,
// bars, media players and SuperSource at 3010+) and the numbers are neither
// contiguous nor memorable. animATEM already sends the names; asking an
// operator to type 3010 was never necessary.
//
// The cost is that bus presets only exist once a switcher has connected. That
// is honest — the module does not yet know what inputs there are — and the
// transition and memory sections still work before then.
//
// Variable references use `self.label`, the CONNECTION's label: Companion
// resolves $(label:variable) against whatever the operator named this
// connection, so a hardcoded module id renders as raw text on a renamed one.

const WHITE = 0xffffff
const BLACK = 0x000000
const GREY = 0x333333
const RED = 0xcc0000
const GREEN = 0x008000
const AMBER = 0xcc7a00
const DARKGREEN = 0x003300
const BRIGHTGREEN = 0x00ff00

export function UpdatePresets(self: ModuleInstance): void {
  const presets: CompanionPresetDefinitions<ModuleSchema> = {}
  const structure: CompanionPresetSection[] = []

  const inputs = inputChoices(self)
  const mes = meChoices(self)

  // --- Transitions, per M/E ------------------------------------------------
  const transitionRefs: string[] = []
  for (const me of mes) {
    const idx = Number(me.id)
    const n = idx + 1
    const add = (suffix: string, def: (typeof presets)[string]): void => {
      presets[`me${n}_${suffix}`] = def
      transitionRefs.push(`me${n}_${suffix}`)
    }

    add('cut', {
      type: 'simple',
      name: `M/E ${n}: Cut`,
      style: { text: `CUT\nM/E ${n}`, size: '18', color: WHITE, bgcolor: RED, show_topbar: false },
      steps: [{ down: [{ actionId: 'cut', options: { me: idx } }], up: [] }],
      feedbacks: []
    })
    add('auto', {
      type: 'simple',
      name: `M/E ${n}: Auto`,
      style: {
        text: `AUTO\nM/E ${n}`,
        size: '18',
        color: WHITE,
        bgcolor: GREEN,
        show_topbar: false
      },
      steps: [{ down: [{ actionId: 'auto', options: { me: idx } }], up: [] }],
      // Amber while the transition runs: during an auto BOTH buses are on air,
      // so a plain program tally is briefly telling half the story.
      feedbacks: [
        {
          feedbackId: 'in_transition',
          options: { me: idx },
          style: { bgcolor: AMBER, color: BLACK }
        }
      ]
    })
    add('ftb', {
      type: 'simple',
      name: `M/E ${n}: Fade to black`,
      style: {
        text: `FTB\nM/E ${n}`,
        size: '18',
        color: WHITE,
        bgcolor: BLACK,
        show_topbar: false
      },
      steps: [{ down: [{ actionId: 'ftb', options: { me: idx } }], up: [] }],
      feedbacks: []
    })
    add('take', {
      type: 'simple',
      name: `M/E ${n}: Take preview to program`,
      style: {
        text: `TAKE\n$(${self.label}:me${n}_preview)`,
        size: '14',
        color: WHITE,
        bgcolor: GREY,
        show_topbar: false
      },
      steps: [
        { down: [{ actionId: 'take_preview', options: { me: idx, transition: 'cut' } }], up: [] }
      ],
      feedbacks: []
    })
    add('status', {
      type: 'simple',
      name: `M/E ${n}: PGM / PVW display (no action)`,
      style: {
        text: `PGM $(${self.label}:me${n}_program)\nPVW $(${self.label}:me${n}_preview)`,
        size: '14',
        color: WHITE,
        bgcolor: BLACK,
        show_topbar: false
      },
      steps: [{ down: [], up: [] }],
      feedbacks: [
        {
          feedbackId: 'in_transition',
          options: { me: idx },
          style: { bgcolor: AMBER, color: BLACK }
        }
      ]
    })
  }

  structure.push({
    id: 'transitions',
    name: 'Transitions',
    description:
      'Auto goes amber mid-transition — during an auto both buses are on air, so a plain program tally is briefly only half the story.',
    definitions: [
      { id: 'transitions-main', type: 'simple', name: 'Transitions', presets: transitionRefs }
    ],
    keywords: ['cut', 'auto', 'ftb', 'take']
  })

  // --- Program and preview bus rows, generated -----------------------------
  if (inputs.length > 0) {
    for (const me of mes) {
      const idx = Number(me.id)
      const n = idx + 1
      const pgmRefs: string[] = []
      const pvwRefs: string[] = []

      for (const input of inputs) {
        const id = Number(input.id)
        const short = self.snapshot?.inputs.find((i) => i.id === id)?.shortName ?? String(id)

        presets[`me${n}_pgm_${id}`] = {
          type: 'simple',
          name: `M/E ${n} PGM: ${input.label}`,
          style: { text: short, size: '18', color: WHITE, bgcolor: BLACK, show_topbar: false },
          steps: [{ down: [{ actionId: 'set_program', options: { input: id, me: idx } }], up: [] }],
          feedbacks: [
            {
              feedbackId: 'program_input',
              options: { input: id, me: idx },
              style: { bgcolor: RED, color: WHITE }
            }
          ]
        }
        pgmRefs.push(`me${n}_pgm_${id}`)

        presets[`me${n}_pvw_${id}`] = {
          type: 'simple',
          name: `M/E ${n} PVW: ${input.label}`,
          style: { text: short, size: '18', color: WHITE, bgcolor: BLACK, show_topbar: false },
          steps: [{ down: [{ actionId: 'set_preview', options: { input: id, me: idx } }], up: [] }],
          feedbacks: [
            {
              feedbackId: 'preview_input',
              options: { input: id, me: idx },
              style: { bgcolor: GREEN, color: WHITE }
            }
          ]
        }
        pvwRefs.push(`me${n}_pvw_${id}`)
      }

      structure.push({
        id: `me${n}-buses`,
        name: `M/E ${n} buses`,
        description: `${self.snapshot?.productModel ?? 'Switcher'} inputs, by name. Red is on air, green is preview.`,
        definitions: [
          { id: `me${n}-pgm`, type: 'simple', name: 'Program bus', presets: pgmRefs },
          { id: `me${n}-pvw`, type: 'simple', name: 'Preview bus', presets: pvwRefs }
        ],
        keywords: ['program', 'preview', 'bus', 'tally']
      })
    }
  }

  // --- Aux -----------------------------------------------------------------
  const auxRefs: string[] = []
  for (const bus of Object.keys(self.snapshot?.auxes ?? {})) {
    const b = Number(bus)
    const n = b + 1
    presets[`aux${n}_display`] = {
      type: 'simple',
      name: `Aux ${n}: what is on it (no action)`,
      style: {
        text: `AUX ${n}\n$(${self.label}:aux${n}_source)`,
        size: '14',
        color: WHITE,
        bgcolor: BLACK,
        show_topbar: false
      },
      steps: [{ down: [], up: [] }],
      feedbacks: []
    }
    presets[`aux${n}_follow`] = {
      type: 'simple',
      name: `Aux ${n}: point at program (one shot)`,
      style: {
        text: `AUX ${n}\nFOLLOW`,
        size: '14',
        color: WHITE,
        bgcolor: GREY,
        show_topbar: false
      },
      steps: [{ down: [{ actionId: 'aux_follow_program', options: { bus: b, me: 0 } }], up: [] }],
      feedbacks: []
    }
    auxRefs.push(`aux${n}_display`, `aux${n}_follow`)
  }
  if (auxRefs.length > 0) {
    structure.push({
      id: 'aux',
      name: 'Aux buses',
      description:
        'Follow is a ONE-SHOT — animATEM has no follow mode, so it sets the aux once from the current program. A repeating trigger is what makes it stick.',
      definitions: [{ id: 'aux-main', type: 'simple', name: 'Aux', presets: auxRefs }],
      keywords: ['aux', 'follow']
    })
  }

  // --- Memories ------------------------------------------------------------
  const memoryRefs: string[] = []
  for (const memory of self.memories) {
    presets[`memory_${memory.id}`] = {
      type: 'simple',
      name: `Recall: ${memory.name}`,
      style: { text: memory.name, size: '14', color: WHITE, bgcolor: GREY, show_topbar: false },
      steps: [{ down: [{ actionId: 'recall_memory', options: { memoryId: memory.id } }], up: [] }],
      feedbacks: []
    }
    memoryRefs.push(`memory_${memory.id}`)

    if (memory.kind === 'supersource') {
      presets[`animate_${memory.id}`] = {
        type: 'simple',
        name: `Animate to: ${memory.name}`,
        style: {
          text: `${memory.name}\n1s`,
          size: '14',
          color: WHITE,
          bgcolor: GREY,
          show_topbar: false
        },
        steps: [
          {
            down: [
              {
                actionId: 'animate_supersource',
                options: { memoryId: memory.id, durationMs: 1000 }
              }
            ],
            up: []
          }
        ],
        feedbacks: []
      }
      memoryRefs.push(`animate_${memory.id}`)
    }
  }
  if (memoryRefs.length > 0) {
    structure.push({
      id: 'memories',
      name: 'Memories',
      description:
        'Only SuperSource memories can be animated; a DVE memory recalls instantly, so no animate button is generated for one.',
      definitions: [{ id: 'memories-main', type: 'simple', name: 'Memories', presets: memoryRefs }],
      keywords: ['supersource', 'dve', 'memory', 'recall']
    })
  }

  // --- Status --------------------------------------------------------------
  presets.module_connected = {
    type: 'simple',
    name: 'Connected to animATEM',
    style: {
      text: `animATEM\n$(${self.label}:connection_status)`,
      size: '14',
      color: WHITE,
      bgcolor: RED,
      show_topbar: false
    },
    steps: [{ down: [], up: [] }],
    feedbacks: [
      {
        feedbackId: 'module_connected',
        options: {},
        style: { bgcolor: DARKGREEN, color: BRIGHTGREEN }
      }
    ]
  }
  presets.atem_connected = {
    type: 'simple',
    name: 'Switcher is connected',
    style: {
      text: `ATEM\n$(${self.label}:atem_connection_status)`,
      size: '14',
      color: WHITE,
      bgcolor: RED,
      show_topbar: false
    },
    steps: [{ down: [], up: [] }],
    feedbacks: [
      {
        feedbackId: 'atem_connected',
        options: {},
        style: { bgcolor: DARKGREEN, color: BRIGHTGREEN }
      }
    ]
  }
  presets.model = {
    type: 'simple',
    name: 'Switcher model (no action)',
    style: {
      text: `$(${self.label}:product_model)`,
      size: '14',
      color: WHITE,
      bgcolor: BLACK,
      show_topbar: false
    },
    steps: [{ down: [], up: [] }],
    feedbacks: []
  }

  structure.push({
    id: 'status',
    name: 'Status',
    description:
      "Two separate questions: 'is the app there' and 'is the switcher there'. The second can be down while the first is up — which is the normal state while a switcher reboots, and conflating them means restarting the wrong thing.",
    definitions: [
      {
        id: 'status-main',
        type: 'simple',
        name: 'Status',
        presets: ['module_connected', 'atem_connected', 'model']
      }
    ],
    keywords: ['status', 'connection']
  })

  self.setPresetDefinitions(structure, presets)
}
