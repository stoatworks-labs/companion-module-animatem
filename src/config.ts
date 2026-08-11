import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

// about-field really is .js — vendored from stoatworks-backend and typed by
// about-field.d.ts beside it. eslint-plugin-n rewrites a .js specifier in a TS
// file to .ts before resolving, so it looks for about-field.ts and misses both
// real files. tsc and esbuild both resolve it fine.
// eslint-disable-next-line n/no-missing-import
import { aboutField } from './about-field.js'

export type ModuleConfig = {
  host: string
  port: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
  return [
    {
      type: 'textinput',
      id: 'host',
      label: 'animATEM host',
      width: 8,
      default: '127.0.0.1',
      regex: Regex.HOSTNAME
    },
    {
      type: 'number',
      id: 'port',
      label: 'animATEM control port',
      width: 4,
      min: 1,
      max: 65535,
      default: 51234
    },
    // Vendored from stoatworks-backend/about. A Companion module has no UI of
    // its own, so this config panel is the only surface it has.
    aboutField()
  ]
}
