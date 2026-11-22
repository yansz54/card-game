// Ember Sigils — the rival AI. Readable, counterable patterns:
// plays its biggest affordable creature first, fires Fireball to finish
// (rival life <= 6) or to kill a 4+ attack threat, Mends when hurt,
// Frosts your biggest attacker. Telegraphed in the log so you can bait it.

export function chooseAiPlays(state) {
  // state: { aiHand, aiMana, aiBoard, playerBoard, playerLife, aiLife }
  const plays = [];
  let mana = state.aiMana;
  const hand = state.aiHand.slice();

  // 1. Heal first when badly hurt.
  const mend = hand.find((c) => c.ability === 'mend-spell');
  if (mend && state.aiLife <= 10 && mana >= mend.cost) {
    plays.push({ card: mend, target: 'ai-hero' });
    mana -= mend.cost;
    hand.splice(hand.indexOf(mend), 1);
  }

  // 2. Fireball to finish, or to remove a big threat.
  const fireball = hand.find((c) => c.ability === 'fireball');
  if (fireball && mana >= fireball.cost) {
    const bigThreat = state.playerBoard
      .filter((c) => c && effectiveAttack(state, c, 'player') >= 4)
      .sort((a, b) => b.atk - a.atk)[0];
    if (state.playerLife <= 6) {
      plays.push({ card: fireball, target: 'player-hero' });
      mana -= fireball.cost;
      hand.splice(hand.indexOf(fireball), 1);
    } else if (bigThreat && bigThreat.hp <= 3) {
      plays.push({ card: fireball, target: bigThreat.uid });
      mana -= fireball.cost;
      hand.splice(hand.indexOf(fireball), 1);
    }
  }

  // 3. Frost your biggest attacker when it would hit hard.
  const frost = hand.find((c) => c.ability === 'frost');
  if (frost && mana >= frost.cost) {
    const biggest = state.playerBoard
      .filter((c) => c && !c.frozen)
      .sort((a, b) => effectiveAttack(state, b, 'player') - effectiveAttack(state, a, 'player'))[0];
    if (biggest && effectiveAttack(state, biggest, 'player') >= 3) {
      plays.push({ card: frost, target: biggest.uid });
      mana -= frost.cost;
      hand.splice(hand.indexOf(frost), 1);
    }
  }

  // 4. Insight when the hand is running low.
  const insight = hand.find((c) => c.ability === 'insight');
  if (insight && hand.length <= 2 && mana >= insight.cost) {
    plays.push({ card: insight, target: null });
    mana -= insight.cost;
    hand.splice(hand.indexOf(insight), 1);
  }

  // 5. Creatures: biggest attack per cost first, while a board slot is free.
  const creatures = hand
    .filter((c) => c.kind === 'creature')
    .sort((a, b) => (b.atk / b.cost) - (a.atk / a.cost) || b.atk - a.atk);
  for (const creature of creatures) {
    const freeSlots = 5 - state.aiBoard.filter(Boolean).length - plays.filter((p) => p.card.kind === 'creature').length;
    if (freeSlots <= 0) break;
    if (mana >= creature.cost) {
      plays.push({ card: creature, target: null });
      mana -= creature.cost;
    }
  }

  // 6. Leftover mana: a second Fireball at your face if it is lethal-ish.
  const fb2 = hand.find((c) => c.ability === 'fireball' && !plays.some((p) => p.card === c));
  if (fb2 && mana >= fb2.cost && state.playerLife <= 9) {
    plays.push({ card: fb2, target: 'player-hero' });
  }
  return plays;
}

// Fury aura: Ember creatures give +1 attack to adjacent allies.
export function effectiveAttack(state, card, side) {
  const board = side === 'player' ? state.playerBoard : state.aiBoard;
  const idx = board.findIndex((c) => c && c.uid === card.uid);
  if (idx < 0) return card.atk;
  let bonus = 0;
  for (const n of [idx - 1, idx + 1]) {
    const neighbour = board[n];
    if (neighbour && neighbour.ability === 'fury') bonus += 1;
  }
  return card.atk + bonus;
}

export function aiTauntLine(state) {
  if (state.aiLife <= 6) return 'Kestrel grits her teeth — she is cornered.';
  if (state.playerLife <= 6) return 'Kestrel smells victory and presses the attack.';
  if (state.aiBoard.filter(Boolean).length >= 4) return 'Kestrel floods the board with sigils.';
  return 'Kestrel studies your hand, then plays.';
}
