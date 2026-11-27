# Gobble Dash — a turkey escape game

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/oreo-sol/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/oreo-sol/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

Thanksgiving is coming. The farmer wants dinner. You want the woods.

**Gobble Dash** is a side-scrolling turkey escape game: an auto-running turkey
flees the farmer through the farmyard, the cornfield and finally the kitchen,
jumping fences and ovens, ducking under thrown carving knives, hiding in
haystacks, and grabbing corn on the way. Run 1,200 m and you escape to the
woods. Stumble three times — or let the farmer close the gap — and you are
Thanksgiving dinner.

## Play

Serve `game/` with any static server (or `node serve.ts`) and open
`game/index.html` in desktop Chrome. No network request, no build step.

- **Space / ↑ / click** — jump (press again mid-air for a double jump)
- **↓** — duck under knives, or hide inside a haystack when the farmer is close
- **P** — pause, **M** — mute

HUD shows score, distance, stage, corn collected, lives (hearts) and how close
the farmer is behind you. Title screen, pause, caught and escaped end screens
with restart.

## Files

- `game/index.html` — page shell
- `game/src/main.js` — canvas, frame loop, screen state machine
- `game/src/config.js` — tuning, palette, stage table
- `game/src/world.js` — run state, rules, collisions, scoring
- `game/src/turkey.js` — the turkey: physics and drawing
- `game/src/farmer.js` — the farmer: chase / search / corner AI and drawing
- `game/src/obstacles.js` — hazards and pickups: spawn, move, draw
- `game/src/render.js` — backgrounds, HUD, title / pause / end screens
- `game/src/audio.js` — WebAudio-synthesized sounds and music, no audio files
- `game/src/input.js` — keyboard, mouse and touch
- `game/src/random.js` — seeded RNG for reproducible runs
- `game/src/shots.js` — `?shot=title|play|kitchen|end` staged scenes
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json`
- `screenshots/` — real renders of the game's own code in a browser

All art is drawn in code and all sounds are synthesized — original work, no
assets copied from anywhere.
