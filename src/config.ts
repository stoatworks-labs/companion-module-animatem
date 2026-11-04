import { type SomeCompanionConfigField } from '@companion-module/base'

import { aboutField } from './about-field.js'

export type ModuleConfig = {
  host: string
  port: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
  return [
    // A plain text field rather than Regex.HOSTNAME, which base 2.2.2
    // deprecated. The port has always been a number field, so no saved config
    // needs upgrading.
    {
      type: 'textinput',
      id: 'host',
      label: 'animATEM host',
      tooltip: 'IP address (IPv4 or IPv6) or hostname',
      width: 8,
      minLength: 1,
      default: '127.0.0.1'
    },
    {
      type: 'number',
      id: 'port',
      label: 'animATEM control port',
      width: 4,
      min: 1,
      max: 65535,
      asInteger: true,
      default: 51234
    },
    // Vendored from stoatworks-backend/about. A Companion module has no UI of
    // its own, so this config panel is the only surface it has.
    aboutField()
  ]
}
