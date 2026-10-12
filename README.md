# companion-module-animatem

> **AI-assisted project.** This module was created with [Claude](https://claude.com/claude-code)
> (Anthropic), directed and reviewed by a human author. Check it over before you rely on it for
> a show.

A [Bitfocus Companion](https://bitfocus.io/companion) module for
[animATEM](https://github.com/stoatworks-labs/animATEM). It does cut, auto and FTB
per M/E, program/preview and aux selection by input name, and SuperSource/DVE
memory recall, with program and preview tally.

It's written in TypeScript, against `@companion-module/base` v2.

<!-- downloads:start -->

## Download

**[v1.0.5](https://github.com/stoatworks-labs/companion-module-animatem/releases/tag/v1.0.5)**

This release contains:

- [`animatem-1.0.5.tgz`](https://github.com/stoatworks-labs/companion-module-animatem/releases/download/v1.0.5/animatem-1.0.5.tgz) — npm package, 24 KB
- [`companion-module-animatem-pkg.tgz`](https://github.com/stoatworks-labs/companion-module-animatem/releases/latest/download/companion-module-animatem-pkg.tgz) — npm package, 24 KB

All builds, checksums and release notes: [github.com/stoatworks-labs/companion-module-animatem/releases](https://github.com/stoatworks-labs/companion-module-animatem/releases).

<!-- downloads:end -->

## What it does

- **Actions:** cut, auto, fade to black and take-preview-to-program per M/E;
  set the program, preview and aux source; point an aux at whatever's on
  program; recall a memory; animate to a SuperSource memory.
- **Feedbacks:** connected to animATEM, animATEM's ATEM connection is up,
  program tally, preview tally, M/E mid-transition, and aux is on a source.
- **Variables:** per M/E, program and preview as both name and number, and
  mid-transition. Per aux, the source name and number. Plus both connection
  states, the switcher model, input count and memory count.
- **Presets:** transitions per M/E, program and preview bus rows built from the
  switcher's own input list, aux, memories and status.

## Inputs are picked by name, not typed as numbers

An ATEM numbers its sources in a way that must have made sense to someone once:
1..N, then black, bars, media players and SuperSource from 3010 up. The numbers
aren't contiguous and you won't remember them. animATEM already sends the input
list with short and long names, so every input dropdown here is filled from
that, and every generated bus preset is labelled with the switcher's own short
name.

The catch is that the bus presets only turn up once a switcher has connected,
because until then the module has no idea what inputs there are. The
transition, memory and status sections work either way.

## How it talks to animATEM

animATEM runs a WebSocket control server on `127.0.0.1:51234` whenever the
app's running, so there's nothing extra to set up on that end. This module
connects to it, and reconnects by itself if animATEM restarts.

> **That server has no authentication.** That's only OK because it binds to
> loopback, which is the default and, for now, the only supported configuration.
> Anything that can reach that port can put something on air.

## Two connection questions, not one

| Feedback                         | Answers                         |
| -------------------------------- | ------------------------------- |
| Connected to animATEM            | Can Companion reach the app?    |
| animATEM's ATEM connection is up | Can the app reach the switcher? |

The second can be down while the first is up, which is normal while a switcher
reboots. Mix them up and you'll restart the wrong thing. Put both on a page.

## Nothing is acknowledged

animATEM's control server never replies, not with a result and not with an
error frame. A command that fails is caught and logged at that end and goes no
further, so a command sent while the switcher's disconnected looks the same as
one that worked.

So no button here lights up just because it was pressed; every feedback reads
the snapshot instead. `Take preview to program` and `Point an aux at
program` refuse outright when there's no snapshot rather than guess what's on
preview, because a wrong guess puts the wrong thing on air.

## Memories can go stale

`memories` is the one message animATEM doesn't broadcast when it changes. It
arrives on connect, and when the app explicitly calls `broadcastMemories()`. The
module rebuilds its memory dropdowns and presets whenever one arrives, but a
memory added in the app without that call won't show up until the module
reconnects.

## Building

```bash
npm install
npm run build      # tsc -> dist/, which the manifest points at
npm run lint
npm run typecheck
npm test
```

It's not in the official Companion module store, so install it through
**Settings → Developer modules path**. **Run `npm run build` first**: the
manifest's entrypoint is `../dist/main.js`, and a checkout with only the source
in it won't load.

<!-- attributions:start -->
This project is built on other people's work — see [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
<!-- attributions:end -->

## Licence

MIT, see [LICENSE](LICENSE).
