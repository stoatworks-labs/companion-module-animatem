# Companion — animATEM user guide

This module drives [animATEM](https://github.com/stoatworks-labs/animATEM) from a Stream Deck, or
any other Bitfocus Companion surface: **cut, auto and fade to black per M/E, program, preview and
aux selection by input name, and SuperSource/DVE memory recall, with tally.**

The [README](../README.md) covers installing the module. This is how to build a surface with it,
and what to be careful with.

> **Before you rely on this:** this module has **no automated tests**. Its protocol file is a
> hand-kept mirror of animATEM's own — the two are separate packages and cannot import each other
> — so a change to the control server's message shapes breaks this module **silently**: a button
> stops working mid-show with no error anywhere obvious. Keep the app and the module in step, and
> re-test a page after upgrading either.
>
> This module was built with AI assistance, directed and reviewed by a human author.

---

## What a press actually does

**This puts things on air.** There is no confirmation step and no undo.

And there is a second thing to understand before you build anything, because every design
decision below follows from it: **animATEM's control server never replies.** No result, no error
frame. It drops malformed messages silently, and it catches a failing command and logs it *at the
app* rather than propagating it.

So **a command sent while the switcher is disconnected looks exactly like one that worked.**

Two consequences you will meet:

- **No button here lights up from its own press.** Every feedback reads the app's snapshot
  instead, because "I sent it" is not evidence that anything happened.
- **Take and aux-follow refuse rather than guess.** When there is no snapshot, `Take preview to
  program` and `Point an aux at program` do nothing and say so, rather than acting on a guess
  about what is on preview. Guessing wrong puts the wrong thing on air.

---

## Connecting

animATEM runs its control server on `127.0.0.1:51234` whenever the app is open. There is nothing
to configure on the app side.

**That server has no authentication.** It is safe only because it binds loopback — anything that
can reach that port can put something on air. Companion must therefore run on the same machine as
animATEM.

---

## Put both connection lights on the page

| Light | Answers |
| --- | --- |
| **Connected to animATEM** | Can Companion reach the app? |
| **animATEM's ATEM connection is up** | Can the app reach the switcher? |

These are two different questions and they fail separately. The second goes dark on its own while
a switcher reboots, with the first still green — and **while it is dark, every tally on the surface
is stale rather than false.** It is showing the last thing it knew.

Conflating them means restarting the wrong thing at the worst possible moment. Put both on every
page that has transition buttons.

---

## Inputs are picked by name

An ATEM's sources are numbered awkwardly — 1..N plus black, bars, media players and SuperSource at
3010 and up — and the numbers are neither contiguous nor memorable. animATEM already sends the
input list with short and long names, so **every input dropdown is populated from it**, and every
generated bus preset is labelled with the switcher's own short name, the one the multiview shows.

The cost is honest and worth planning around: **bus presets only exist once a switcher has
connected.** Before then the module does not know what inputs there are. The transition, memory
and status sections work regardless.

**Every dropdown also accepts a typed number**, so a button built while animATEM was offline still
works. Use that if you are building a page in advance on a laptop.

---

## Auto goes amber mid-transition

During an auto, **both buses are on air**. A plain program tally is therefore telling only half
the story for the length of the transition, which is exactly when someone is looking at it.

The generated Auto and PGM/PVW display buttons show that state in **amber**. Keep it — a
two-colour tally during a mix is a tally that lies for a second and a half.

---

## Aux follow is a one-shot

animATEM has no follow mode. **Point an aux at what is on program** reads program *once* and sets
the aux.

To make it stick, drive it from a repeating trigger. If you expect it to behave like a real aux
follow and it does not, this is why.

---

## Memories can go stale

`memories` is the one message animATEM does **not** broadcast on change. It arrives on connect,
and when the app explicitly asks for it.

The module rebuilds its memory dropdowns and presets whenever one arrives — but a memory added in
the app without that call **will not appear until the module reconnects**. If a new memory is
missing from the dropdown, disable and re-enable the connection.

---

## Building a surface that fails safe

1. **Both connection lights, on every page with transitions.** See above.
2. **Amber for mid-transition**, from the generated presets.
3. **Program and preview rows from the generated bus presets**, once the switcher has connected —
   they carry the switcher's own short names, so the surface matches the multiview.
4. **Do not build a page that assumes a press worked.** Nothing is acknowledged; the feedbacks
   read state, and state is what you should be looking at.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| **Buttons do nothing, no error** | Almost the default failure here — nothing is acknowledged. Check the ATEM connection light before suspecting the module. |
| **No bus presets at all** | No switcher has connected yet, so the input list is unknown. The transition and memory sections still work. |
| **Tally is wrong** | Check whether the ATEM light is dark. While it is, every tally is the last known value. |
| **A new memory is missing** | The app did not broadcast the memory list. Reconnect the module. |
| **Aux stops following** | It never was. It is a one-shot; drive it from a trigger. |
| **A button worked yesterday and silently stopped** | The app and the module have drifted — the protocol is mirrored by hand. Check versions. |

---

## See also

- [README](../README.md) — installing, and the full action/feedback/variable list
- [`companion/HELP.md`](../companion/HELP.md) — the same material, in Companion's help panel
