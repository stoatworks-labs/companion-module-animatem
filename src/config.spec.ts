import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GetConfigFields } from './config.js'

// @companion-module/base 2.2.2 turned Regex into a proxy that logs a
// deprecation warning for IP, HOSTNAME, PORT and the rest. The host is a plain
// text field now; the port has always been a number field.
describe('config fields', () => {
  it('has a plain host text field and a number port, and no regex', () => {
    const fields = GetConfigFields()
    const byId = Object.fromEntries(fields.map((f) => [f.id, f]))
    expect(byId.host).toMatchObject({ type: 'textinput', minLength: 1 })
    expect(byId.port).toMatchObject({ type: 'number', asInteger: true, default: 51234 })
    expect(fields.filter((f) => 'regex' in f).map((f) => f.id)).toEqual([])
  })

  // It matches the import, so comments naming the old constants stay legal.
  it('no file in src/ imports Regex', () => {
    const dir = new URL('./', import.meta.url).pathname
    const offenders = readdirSync(dir).filter(
      (f) =>
        /\.(js|ts)$/.test(f) &&
        /import\s*{[^}]*\bRegex\b[^}]*}\s*from\s*["']@companion-module\/base/.test(
          readFileSync(dir + f, 'utf8')
        )
    )
    expect(offenders).toEqual([])
  })
})
