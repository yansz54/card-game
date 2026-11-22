[![Ember Sigils](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/yansz54/card-game/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/yansz54/card-game/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# Ember Sigils — a duel of cards

An original duel card game that plays offline in a desktop browser from its own
files — no network, no libraries, no build step. You face **Kestrel**, the rival
sigil-keeper, across a green felt table. Both heroes start at **20 life**; the
first to 0 loses.

## How to play

- **Mana:** you gain +1 crystal each round (max 10). Cards cost mana to play.
- **Creatures** stay on the board and attack at the end of your turn — each one
  strikes the creature opposite it, or the enemy hero if the slot is empty.
- **Spells** strike at once: Fireball (3 damage), Mend (+5 life), Insight (draw 2),
  Frostbite (freeze an enemy creature for a round).
- **Four elements**, told apart by colour *and* shape:
  - 🔥 **Ember** (red flame) — creatures give +1 attack to adjacent allies.
  - 💧 **Tide** (blue droplet) — creatures heal you 2 when played.
  - 🌿 **Thorn** (green leaf) — **Guard**: foes must attack it first.
  - ⚡ **Gale** (gold bolt) — creatures deal 1 damage to all enemy creatures.
- **Read the rival:** Kestrel plays her biggest creature first, hurls Fireball
  when you are low, Mends when she is hurt, and Frosts your biggest attacker —
  bait her spells, then punish her.
- **Fatigue:** drawing from an empty deck costs 1 life.

**Controls:** mouse — click a card to play it, click a target for Fireball /
Frostbite, click END TURN. Keyboard — `1–7` select a hand card, `Enter` ends
the turn, `Esc` cancels targeting, `R` restarts after a win or loss.

## Play it

Serve `game/` with any static server and open `game/index.html`, e.g.:

```sh
cd game && python3 -m http.server 8080
```

Sounds are synthesised with WebAudio; the ♪ button mutes them.

## Structure

- `game/index.html` — the table layout
- `game/style.css` — felt table, cards, overlays
- `game/cards.js` — card definitions, elements, deck building, seeded shuffle
- `game/ai.js` — Kestrel's readable, counterable play patterns
- `game/audio.js` — synthesised WebAudio sounds
- `game/render.js` — DOM rendering of cards, boards, life totals, overlays
- `game/game.js` — rules: turns, combat, spells, fatigue, showcase states
- `game/main.js` — boot, mouse + keyboard input, render loop
- `main.ts` — hands the game in (copies `game/` + `screenshots/` to `/output`, writes `dossier.json`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
