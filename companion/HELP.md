# animATEM

Controls [animATEM](https://github.com/stoatworks-labs/animATEM).

## Connection

animATEM runs its control server on `127.0.0.1:51234` whenever the app is open —
nothing to configure on the app side.

**That server has no authentication.** It is safe only because it binds loopback.

## Two connection lights

| Light                            | Answers                         |
| -------------------------------- | ------------------------------- |
| Connected to animATEM            | Can Companion reach the app?    |
| animATEM's ATEM connection is up | Can the app reach the switcher? |

The second goes dark on its own while a switcher reboots, with the first still
green. Keep both — otherwise you restart the wrong thing.

While the ATEM light is dark, every tally is **stale**, not false.

## Inputs are dropdowns

Populated from the switcher's own input list, with the short name the multiview
shows. Bus presets are generated from the same list, so they appear only once a
switcher has connected.

Every dropdown also accepts a typed number, so a button built while animATEM was
offline still works.

## Auto goes amber mid-transition

During an auto **both buses are on air**, so a plain program tally is briefly
telling only half the story. The generated Auto and PGM/PVW display buttons show
that state in amber.

## Aux follow is a one-shot

animATEM has no follow mode. **Point an aux at what is on program** reads
program once and sets the aux. To make it stick, drive it from a repeating
trigger.

## Nothing is acknowledged

The control server never replies. A command sent while the switcher is
disconnected looks exactly like one that worked — which is why no button lights
from its own press, and why Take and Aux-follow refuse when there is no
snapshot rather than guessing.
