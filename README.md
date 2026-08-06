# companion-module-animatem

> **AI-assisted project.** This module was built with the help of
> [Claude](https://claude.ai), Anthropic's AI assistant — including
> implementation and documentation. Review it accordingly before relying on
> it in production.

A [Bitfocus Companion](https://bitfocus.io/companion) connection module for
[animATEM](https://github.com/stoatworks-labs/animATEM) — cut, auto and FTB per
M/E, program/preview and aux selection **by input name**, and SuperSource/DVE
memory recall, with program and preview tally.

TypeScript, built against `@companion-module/base` v2.

<!-- downloads:start -->

## Download

**[v1.0.0](https://github.com/stoatworks-labs/companion-module-animatem/releases/tag/v1.0.0)**

This release contains:

- [`animatem-1.0.0.tgz`](https://github.com/stoatworks-labs/companion-module-animatem/releases/download/v1.0.0/animatem-1.0.0.tgz) — npm package, 22 KB
- [`companion-module-animatem-pkg.tgz`](https://github.com/stoatworks-labs/companion-module-animatem/releases/latest/download/companion-module-animatem-pkg.tgz) — npm package, 23 KB

All builds, checksums and release notes: [github.com/stoatworks-labs/companion-module-animatem/releases](https://github.com/stoatworks-labs/companion-module-animatem/releases).

<!-- downloads:end -->

## What it does

- **Actions** — cut, auto, fade to black and take-preview-to-program per M/E;
  set program, preview and aux source; point an aux at what is on program;
  recall a memory; animate to a SuperSource memory.
- **Feedbacks** — connected to animATEM, **animATEM's ATEM connection is up**,
  program tally, preview tally, M/E mid-transition, aux is on a source.
- **Variables** — per M/E: program and preview as both **name and number**, and
  mid-transition. Per aux: source name and number. Plus both connection states,
  switcher model, input count and memory count.
- **Presets** — transitions per M/E, **program and preview bus rows generated
  from the switcher's own input list**, aux, memories, and status.

## Inputs are picked by name, not typed as numbers

An ATEM's sources are numbered awkwardly — 1..N plus black, bars, media players
and SuperSource at 3010 and up — and the numbers are neither contiguous nor
memorable. animATEM already sends the input list with short and long names, so
every input dropdown here is populated from it and every generated bus preset is
labelled with the switcher's own short name.

The cost is that bus presets only exist **once a switcher has connected**. That
is honest: before then the module does not know what inputs there are. The
transition, memory and status sections work regardless.

## How it talks to animATEM

animATEM runs a WebSocket control server on `127.0.0.1:51234` whenever the app
is running — nothing extra to set up on the app side. This module connects to
it and reconnects automatically if animATEM restarts.

> **That server has no authentication.** It is acceptable only because it binds
> loopback, which is the default and currently the only supported configuration.
> Anything that can reach that port can put something on air.

## Two connection questions, not one

| Feedback                         | Answers                         |
| -------------------------------- | ------------------------------- |
| Connected to animATEM            | Can Companion reach the app?    |
| animATEM's ATEM connection is up | Can the app reach the switcher? |

The second can be down while the first is up — the normal state while a switcher
reboots. Conflating them means restarting the wrong thing. Put both on a page.

## Nothing is acknowledged

animATEM's control server never replies: no result, no error frame. A failing
command is caught and logged there, not propagated, so a command sent while the
switcher is disconnected looks identical to one that worked.

So no button here lights from the fact that it was pressed — every feedback
reads the snapshot instead. `Take preview to program` and `Point an aux at
program` refuse outright when there is no snapshot rather than guessing what is
on preview, because guessing wrong puts the wrong thing on air.

## Memories can go stale

`memories` is the one message animATEM does **not** broadcast on change — it
arrives on connect and when the app explicitly calls `broadcastMemories()`. The
module rebuilds its memory dropdowns and presets whenever one arrives; a memory
added in the app without that call will not appear until the module reconnects.

## Building

```bash
npm install
npm run build      # tsc -> dist/, which the manifest points at
npm run lint
npm run typecheck
npm test
```

Install via **Settings → Developer modules path** — this is not in the official
Companion module store. **Run `npm run build` first**: the manifest's entrypoint
is `../dist/main.js`, and a source-only checkout will not load.

<!-- attributions:start -->
This project is built on other people's work — see [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
<!-- attributions:end -->

## Licence

MIT — see [LICENSE](LICENSE).
