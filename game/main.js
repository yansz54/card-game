// Ember Sigils — boot, input (mouse + keyboard) and the render loop.
// Also honours ?shot=title|table|win|loss for deterministic screenshots.

import { newGame, showcaseState, canPlayCard, playCard, endPlayerTurn, startPlayerTurn } from './game.js';
import { defById } from './cards.js';
import * as render from './render.js';
import * as sfx from './audio.js';

const $ = (id) => document.getElementById(id);

window.addEventListener('error', (event) => {
  const log = $('errlog');
  if (log) log.textContent += 'ERROR: ' + event.message + ' | ';
});

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
let state;

if (shot) {
  state = showcaseState(shot);
} else {
  state = newGame();
  state.phase = 'title';
}

let selectedCard = null;

function refresh() {
  render.renderHud(state);
  render.renderBoard($('enemyBoard'), state.aiBoard, state, 'ai');
  render.renderBoard($('playerBoard'), state.playerBoard, state, 'player');
  render.renderEnemyHand($('enemyHand'), state.aiHand.length);
  render.renderHand($('playerHand'), state.playerHand, state, {
    playable: (card) => canPlayCard(state, card),
    selectedUid: selectedCard ? selectedCard.uid : null,
    onCardClick: handleCardClick,
  });
  render.setLog(state.log);
  $('endTurnBtn').disabled = state.phase !== 'player';
  updateOverlay();
}

function updateOverlay() {
  if (shot) {
    // Screenshot mode: the overlay is part of the shot for title/win/loss.
    if (shot === 'title') {
      render.showOverlay({
        title: 'EMBER SIGILS', sub: 'A duel of cards. Outwit Kestrel, the rival sigil-keeper.',
        bodyHtml: render.titleBodyHtml(), buttonText: 'PLAY',
      });
    } else if (shot === 'win') {
      render.showOverlay({
        title: 'VICTORY!', titleClass: 'win', sub: 'Kestrel concedes the table.',
        bodyHtml: render.endBodyHtml(state, true), buttonText: 'PLAY AGAIN (R)',
      });
      sfx.playWinFanfare();
    } else if (shot === 'loss') {
      render.showOverlay({
        title: 'DEFEAT', titleClass: 'loss', sub: 'Kestrel sweeps your sigils away.',
        bodyHtml: render.endBodyHtml(state, false), buttonText: 'REMATCH (R)',
      });
    }
    return;
  }
  if (state.phase === 'title') {
    render.showOverlay({
      title: 'EMBER SIGILS', sub: 'A duel of cards. Outwit Kestrel, the rival sigil-keeper.',
      bodyHtml: render.titleBodyHtml(), buttonText: 'PLAY',
    });
  } else if (state.phase === 'over') {
    const won = state.winner === 'player';
    render.showOverlay({
      title: won ? 'VICTORY!' : 'DEFEAT', titleClass: won ? 'win' : 'loss',
      sub: won ? 'Kestrel concedes the table.' : 'Kestrel sweeps your sigils away.',
      bodyHtml: render.endBodyHtml(state, won), buttonText: won ? 'PLAY AGAIN (R)' : 'REMATCH (R)',
    });
    if (won) sfx.playWinFanfare(); else sfx.playLossSound();
  } else {
    render.hideOverlay();
  }
}

function handleCardClick(card) {
  if (state.phase !== 'player') return;
  if (state.awaitingTarget) {
    // Clicking a second card cancels targeting.
    state.awaitingTarget = null;
    selectedCard = null;
    refresh();
    return;
  }
  if (!canPlayCard(state, card)) {
    state.log = card.cost > state.playerMana
      ? card.name + ' costs ' + card.cost + '◆ — you have ' + state.playerMana + '.'
      : 'You cannot play ' + card.name + ' right now.';
    refresh();
    return;
  }
  if (card.kind === 'spell' && (card.ability === 'fireball' || card.ability === 'frost')) {
    selectedCard = card;
    state.awaitingTarget = card;
    state.log = card.name + ': click a target — an enemy creature, or a life total.';
    markTargets();
    refresh();
    return;
  }
  const result = playCard(state, card, null);
  if (!result.ok) state.log = 'Cannot play that: ' + result.reason + '.';
  selectedCard = null;
  refresh();
  checkOver();
}

function markTargets() {
  document.querySelectorAll('#enemyBoard .card, #playerBoard .card').forEach((el) => {
    el.classList.add('targetable');
    el.addEventListener('click', handleTargetClick, { once: true });
  });
  $('enemyLifeBox').classList.add('targetable');
  $('playerLifeBox').classList.add('targetable');
  $('enemyLifeBox').addEventListener('click', () => handleHeroTarget('ai-hero'), { once: true });
  $('playerLifeBox').addEventListener('click', () => handleHeroTarget('player-hero'), { once: true });
}

function handleTargetClick(event) {
  const uid = event.currentTarget.dataset.uid;
  finishTargetedSpell(uid);
}

function handleHeroTarget(hero) {
  finishTargetedSpell(hero);
}

function finishTargetedSpell(targetUid) {
  const card = state.awaitingTarget;
  document.querySelectorAll('.targetable').forEach((el) => el.classList.remove('targetable'));
  if (!card) { refresh(); return; }
  state.awaitingTarget = null;
  selectedCard = null;
  const result = playCard(state, card, targetUid);
  if (!result.ok) state.log = 'Cannot cast that: ' + result.reason + '.';
  refresh();
  checkOver();
}

function checkOver() {
  if (state.phase === 'over') updateOverlay();
}

function startMatch() {
  state = newGame();
  state.phase = 'player';
  selectedCard = null;
  sfx.playTurnSound();
  refresh();
}

$('overlayBtn').addEventListener('click', () => {
  sfx.playClickSound();
  if (state.phase === 'title' || state.phase === 'over') startMatch();
});

$('endTurnBtn').addEventListener('click', () => {
  if (state.phase !== 'player') return;
  sfx.playClickSound();
  endPlayerTurn(state);
  refresh();
  checkOver();
});

$('muteBtn').addEventListener('click', () => {
  sfx.setMuted(!sfx.isMuted());
  $('muteBtn').classList.toggle('muted', sfx.isMuted());
  $('muteBtn').textContent = sfx.isMuted() ? '♪̸' : '♪';
});

document.addEventListener('keydown', (event) => {
  if (shot) return;
  if (event.key >= '1' && event.key <= '7') {
    const idx = Number(event.key) - 1;
    const card = state.playerHand[idx];
    if (card) handleCardClick(card);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (state.phase === 'title' || state.phase === 'over') startMatch();
    else if (state.phase === 'player') { endPlayerTurn(state); refresh(); checkOver(); }
  } else if (event.key === 'Escape') {
    state.awaitingTarget = null;
    selectedCard = null;
    refresh();
  } else if (event.key === 'r' || event.key === 'R') {
    if (state.phase === 'over') startMatch();
  }
});

refresh();
