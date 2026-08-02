# AGENTS.md — bringing an LLM up to speed on this Companion module

Orientation for an AI assistant (or a new human) picking this project up cold. There is no
`CLAUDE.md` here; this is the entry point.

---

## 1. What this is

A **Bitfocus Companion connection module** for **animATEM**. TypeScript, `tsc` to `dist/`,
`@companion-module/base` 2.x, vitest.

**It used to live inside the animATEM repo** at `companion-module/`, marked `private: true`.
It was split out here to match every other module in this fleet — one repo per module, which
is also what Bitfocus requires for submission. animATEM's own docs now point here.

## 2. The protocol is owned elsewhere, and duplicated by hand

`src/protocol.ts` mirrors animATEM's `src/shared/protocol.ts`. It cannot import it — separate
packages — so **the two are kept in sync by hand**. Change the control server's message
shapes and this module breaks silently: a Stream Deck button stops working mid-show with no
error anywhere obvious.

## 3. Nothing is acknowledged, and that shapes every design decision

animATEM's control server:

- **never replies** — no result, no error frame;
- **drops malformed JSON and unknown types silently**;
- **catches a failing command and logs it rather than propagating**, so a command against a
  disconnected switcher looks identical to one that worked.

Consequences enforced here:

- No feedback reads "what was last pressed". Every one reads the snapshot.
- `take_preview` and `aux_follow_program` **refuse when there is no snapshot** rather than
  guessing at program or preview. `snapshot` is legitimately `null` when no switcher is
  connected, and guessing wrong puts the wrong thing on air.

## 4. Two connection states, kept separate

`module_connected` (this module ↔ the control server, read from `client.isOpen()`) and
`atem_connected` (animATEM ↔ the switcher, from the `status` message). The second is down
while a switcher reboots and the first is not. Do not merge them.

`isOpen()` reads the socket's `readyState` rather than tracking a boolean beside it, so it
cannot drift out of step with the socket.

## 5. Re-registration is driven by a SHAPE key

A `snapshot` arrives on every bus change. `main.ts` compares only what the definition sets
are built from — model, inputs, M/E indices, aux buses — and calls `rebuild()` only when that
moved. Rebuilding on every snapshot churns the dropdowns an operator is mid-way through
using.

**`memories` is the exception that needs care.** animATEM does NOT broadcast it on change —
it is sent on connect and when the app calls `broadcastMemories()`. So `onMemories` always
rebuilds: it is the only moment the memory dropdowns and presets can be refreshed, and a
cached list otherwise goes stale.

## 6. Traps already paid for

- **`checkFeedbacks()` with NO arguments checks nothing.** `InstanceBase.checkFeedbacks`
  forwards `[feedbackType, ...rest]`, so the bare call sends `[undefined]` — a feedback type
  that does not exist. Every feedback then sits frozen at its last value with no error.
  **Use `checkAllFeedbacks()`** for "re-evaluate everything". TypeScript catches this here;
  the JavaScript modules in this fleet have a test guarding it instead.
- **Prettier config does not travel with a subdirectory.** This module's style (single
  quotes, no semicolons, 100 cols) came from animATEM's root `.prettierrc.yaml`; splitting it
  out without copying that file reformatted every line and produced 700 lint errors.
- **`n/no-unpublished-import` flags `vitest.config.ts` and `*.spec.ts`.** It is right that
  vitest will not be in the published package and wrong that it matters — neither file ships.
  Turned off for those two paths in `eslint.config.mjs`.
- **The manifest entrypoint is `../dist/main.js`.** A source-only checkout will not load;
  `npm run build` first.

## 7. Deliberate omissions — do not "fix" these

- **No aux "follow" mode.** animATEM has none, so the action is a documented one-shot driven
  from a repeating trigger. Faking a follow loop inside the module would keep writing to a
  switcher after Companion thought it had stopped.
- **No animate action for DVE memories.** Only SuperSource memories can be animated; the
  dropdown is filtered and no animate preset is generated for a DVE one.

## 8. Context that matters

This puts things on air. Prefer refusing to act over acting on a guess — that is why the
snapshot-dependent actions bail rather than assume.

## 9. Conventions

- Not in the official Companion module store — installs via **Settings → Developer modules
  path**.
- Ships a user-facing AI-assisted disclaimer.
- "Commit" means commit **and** push.
