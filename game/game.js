// Ember Sigils — game state, turns, combat and spell resolution.
// One clear job: the rules. Rendering lives in render.js, the AI in ai.js.

import { makeCardInstance, shuffleDeck, mulberry32, defById } from './cards.js';
import { chooseAiPlays, effectiveAttack, aiTauntLine } from './ai.js';
import * as sfx from './audio.js';

export const MAX_LIFE = 20;
export const MAX_BOARD = 5;
export const HAND_LIMIT = 7;

export function newGame(seed) {
  const random = mulberry32(seed ?? ((Math.random() * 0xffffffff) >>> 0));
  const state = {
    seed, random,
    phase: 'title', // title | player | ai | over
    round: 1,
    playerLife: MAX_LIFE, aiLife: MAX_LIFE,
    playerMana: 1, playerManaMax: 1, aiMana: 1, aiManaMax: 1,
    playerDeck: shuffleDeck(random).map((id) => makeCardInstance(id, 'player')),
    aiDeck: shuffleDeck(random).map((id) => makeCardInstance(id, 'ai')),
    playerHand: [], aiHand: [],
    playerBoard: [null, null, null, null, null],
    aiBoard: [null, null, null, null, null],
    selectedUid: null,
    awaitingTarget: null, // card awaiting a target, or null
    winner: null,
    log: '',
  };
  for (let i = 0; i < 4; i++) drawCard(state, 'player');
  for (let i = 0; i < 4; i++) drawCard(state, 'ai');
  return state;
}

export function drawCard(state, side) {
  const deck = side === 'player' ? state.playerDeck : state.aiDeck;
  const hand = side === 'player' ? state.playerHand : state.aiHand;
  if (deck.length === 0) {
    damageHero(state, side, 1);
    return { fatigued: true };
  }
  const card = deck.pop();
  if (hand.length < HAND_LIMIT) hand.push(card);
  return { card };
}

function firstFreeSlot(board) {
  return board.findIndex((c) => c === null);
}

function allCards(state) {
  return [...state.playerBoard, ...state.aiBoard, ...state.playerHand, ...state.aiHand].filter(Boolean);
}

export function findCard(state, uid) {
  return allCards(state).find((c) => c.uid === uid) || null;
}

export function canPlayCard(state, card) {
  if (state.phase !== 'player') return false;
  if (card.owner !== 'player') return false;
  if (!state.playerHand.some((c) => c.uid === card.uid)) return false;
  if (card.cost > state.playerMana) return false;
  if (card.kind === 'creature' && firstFreeSlot(state.playerBoard) < 0) return false;
  return true;
}

export function playCard(state, card, targetUid) {
  const hand = state.playerHand;
  const idx = hand.findIndex((c) => c.uid === card.uid);
  if (idx < 0) return { ok: false, reason: 'not in hand' };
  if (card.cost > state.playerMana) return { ok: false, reason: 'not enough mana' };
  state.playerMana -= card.cost;
  hand.splice(idx, 1);
  state.selectedUid = null;

  if (card.kind === 'creature') {
    const slot = firstFreeSlot(state.playerBoard);
    if (slot < 0) { hand.push(card); state.playerMana += card.cost; return { ok: false, reason: 'board full' }; }
    card.justPlayed = true;
    state.playerBoard[slot] = card;
    applyOnPlay(state, card, 'player');
    sfx.playCardSound();
    state.log = 'You play ' + card.name + ' (' + card.cost + '◆).';
    return { ok: true, played: card };
  }
  // Spell: resolve at once.
  sfx.playSpellSound();
  return resolveSpell(state, card, 'player', targetUid);
}

function applyOnPlay(state, card, side) {
  if (card.ability === 'mend') healHero(state, side, 2);
  if (card.ability === 'storm') {
    const enemyBoard = side === 'player' ? state.aiBoard : state.playerBoard;
    enemyBoard.forEach((c) => { if (c) damageCreature(state, c, 1); });
  }
}

function healHero(state, side, amount) {
  if (side === 'player') state.playerLife = Math.min(MAX_LIFE, state.playerLife + amount);
  else state.aiLife = Math.min(MAX_LIFE, state.aiLife + amount);
  sfx.playHealSound();
}

export function damageHero(state, side, amount) {
  if (side === 'player') state.playerLife = Math.max(0, state.playerLife - amount);
  else state.aiLife = Math.max(0, state.aiLife - amount);
  sfx.playHurtSound();
  checkEnd(state);
}

export function damageCreature(state, card, amount) {
  card.hp -= amount;
  if (card.hp <= 0) removeCreature(state, card);
}

function removeCreature(state, card) {
  const board = card.owner === 'player' ? state.playerBoard : state.aiBoard;
  const idx = board.findIndex((c) => c && c.uid === card.uid);
  if (idx >= 0) board[idx] = null;
}

function resolveSpell(state, card, side, targetUid) {
  const foe = side === 'player' ? 'ai' : 'player';
  const target = targetUid ? findCard(state, targetUid) : null;
  switch (card.ability) {
    case 'fireball': {
      if (targetUid === 'player-hero') { damageHero(state, 'player', 3); state.log = sideLabel(side) + ' hurl a Fireball at your hero for 3!'; }
      else if (targetUid === 'ai-hero') { damageHero(state, 'ai', 3); state.log = sideLabel(side) + ' hurl a Fireball at Kestrel for 3!'; }
      else if (target) { damageCreature(state, target, 3); state.log = sideLabel(side) + ' burn ' + target.name + ' with Fireball!'; }
      else return { ok: false, reason: 'needs a target' };
      break;
    }
    case 'mend-spell':
      healHero(state, side, 5);
      state.log = sideLabel(side) + ' mend their wounds (+5 life).';
      break;
    case 'insight': {
      drawCard(state, side); drawCard(state, side);
      state.log = sideLabel(side) + ' draw 2 cards with Insight.';
      break;
    }
    case 'frost': {
      if (!target || target.owner === side) return { ok: false, reason: 'needs an enemy creature' };
      target.frozen = true;
      state.log = sideLabel(side) + ' freeze ' + target.name + ' solid!';
      break;
    }
    default:
      return { ok: false, reason: 'unknown spell' };
  }
  return { ok: true, played: card };
}

function sideLabel(side) { return side === 'player' ? 'You' : 'Kestrel'; }

export function startPlayerTurn(state) {
  state.phase = 'player';
  state.playerManaMax = Math.min(10, state.playerManaMax + 1);
  state.playerMana = state.playerManaMax;
  const drawn = drawCard(state, 'player');
  state.playerBoard.forEach((c) => { if (c) c.frozen = false; });
  sfx.playTurnSound();
  state.log = drawn.fatigued
    ? 'Your deck is empty — fatigue bites for 1!'
    : 'Round ' + state.round + ': you draw a card. ' + state.playerMana + ' mana ready.';
  checkEnd(state);
}

export function endPlayerTurn(state) {
  if (state.phase !== 'player') return;
  state.phase = 'ai';
  state.selectedUid = null;
  state.awaitingTarget = null;
  resolveCombat(state, 'player');
  if (state.phase === 'over') return;
  runAiTurn(state);
}

function resolveCombat(state, attackerSide) {
  const atkBoard = attackerSide === 'player' ? state.playerBoard : state.aiBoard;
  const defBoard = attackerSide === 'player' ? state.aiBoard : state.playerBoard;
  const defSide = attackerSide === 'player' ? 'ai' : 'player';
  atkBoard.forEach((attacker, i) => {
    if (!attacker || attacker.frozen) return;
    const atk = effectiveAttack(state, attacker, attackerSide);
    // A Guard still standing forces every attack onto it; recompute each
    // strike because an earlier attacker may have killed it.
    const guardIdx = defBoard.findIndex((c) => c && c.ability === 'guard');
    if (guardIdx >= 0) {
      const guard = defBoard[guardIdx];
      const guardName = guard.name;
      damageCreature(state, guard, atk);
      state.log = attacker.name + ' crashes into Guard ' + guardName + ' for ' + atk + '.';
    } else if (defBoard[i]) {
      const target = defBoard[i];
      const targetName = target.name;
      damageCreature(state, target, atk);
      state.log = attacker.name + ' strikes ' + targetName + ' for ' + atk + '.';
    } else {
      damageHero(state, defSide, atk);
      state.log = attacker.name + ' hits ' + (defSide === 'ai' ? 'Kestrel' : 'you') + ' for ' + atk + '!';
    }
    if (state.phase === 'over') return;
  });
  sfx.playAttackSound();
}

function runAiTurn(state) {
  state.aiManaMax = Math.min(10, state.aiManaMax + 1);
  state.aiMana = state.aiManaMax;
  const drawn = drawCard(state, 'ai');
  if (drawn.fatigued) state.log = 'Kestrel\'s deck is empty — fatigue bites her for 1!';
  state.aiBoard.forEach((c) => { if (c) c.frozen = false; });
  state.log = aiTauntLine(state);
  const plays = chooseAiPlays(state);
  for (const play of plays) {
    const card = play.card;
    const idx = state.aiHand.findIndex((c) => c.uid === card.uid);
    if (idx < 0) continue;
    if (card.cost > state.aiMana) continue;
    state.aiMana -= card.cost;
    state.aiHand.splice(idx, 1);
    if (card.kind === 'creature') {
      const slot = firstFreeSlot(state.aiBoard);
      if (slot < 0) { state.aiHand.push(card); continue; }
      card.justPlayed = true;
      state.aiBoard[slot] = card;
      applyOnPlay(state, card, 'ai');
      state.log = 'Kestrel plays ' + card.name + ' (' + card.cost + '◆).';
    } else {
      resolveSpell(state, card, 'ai', play.target);
    }
    if (state.phase === 'over') return;
  }
  resolveCombat(state, 'ai');
  if (state.phase === 'over') return;
  state.round += 1;
  startPlayerTurn(state);
}

function checkEnd(state) {
  if (state.phase === 'over') return;
  if (state.aiLife <= 0) { state.phase = 'over'; state.winner = 'player'; }
  else if (state.playerLife <= 0) { state.phase = 'over'; state.winner = 'ai'; }
}

// ---- Deterministic showcase states for screenshots (?shot=...) ----
// These build real game states through the same constructors the game uses,
// with a fixed seed, so screenshots are renders of the game's own code.
export function showcaseState(kind) {
  const state = newGame(20261123);
  state.phase = 'player';
  if (kind === 'title') { state.phase = 'title'; return state; }
  if (kind === 'table') {
    // A lively mid-game: both boards populated, hands full, life totals mid-fight.
    state.round = 5;
    state.playerMana = 4; state.playerManaMax = 5;
    state.aiMana = 4; state.aiManaMax = 5;
    state.playerLife = 14; state.aiLife = 11;
    state.playerBoard = [null, null, null, null, null];
    state.aiBoard = [null, null, null, null, null];
    const put = (ids, board, owner) => ids.forEach((id, i) => { if (id) board[i] = makeCardInstance(id, owner); });
    put(['ember-hound', 'thorn-bramble', null, 'gale-falcon', null], state.playerBoard, 'player');
    put([null, 'tide-heron', 'ember-drake', null, null], state.aiBoard, 'ai');
    state.playerHand = ['ember-imp', 'spell-fireball', 'tide-sprite', 'spell-mend', 'gale-wisp', 'thorn-sprout'].map((id) => makeCardInstance(id, 'player'));
    state.aiHand = ['x', 'x', 'x', 'x'].map(() => makeCardInstance('ember-imp', 'ai'));
    state.log = 'Round 5: your Ember Hound eyes Kestrel\'s Drake. Play a card, then end your turn.';
    return state;
  }
  if (kind === 'win') {
    state.phase = 'over'; state.winner = 'player';
    state.round = 7;
    state.playerLife = 9; state.aiLife = 0;
    state.playerBoard[0] = makeCardInstance('ember-drake', 'player');
    state.playerBoard[2] = makeCardInstance('gale-tempest', 'player');
    state.log = 'Kestrel falls! The table is yours.';
    return state;
  }
  if (kind === 'loss') {
    state.phase = 'over'; state.winner = 'ai';
    state.round = 8;
    state.playerLife = 0; state.aiLife = 13;
    state.aiBoard[1] = makeCardInstance('tide-leviathan', 'ai');
    state.aiBoard[3] = makeCardInstance('ember-drake', 'ai');
    state.log = 'Kestrel sweeps your sigils from the table.';
    return state;
  }
  return state;
}
