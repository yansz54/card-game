// Ember Sigils — DOM rendering: cards, boards, hands, life totals, overlays.
// All art is inline SVG / CSS; nothing is fetched.

import { ELEMENTS, suitSvg } from './cards.js';
import { effectiveAttack } from './ai.js';

const $ = (id) => document.getElementById(id);

export function renderHearts(el, life) {
  const full = Math.max(0, life);
  el.textContent = '♥'.repeat(Math.min(full, 20)) + '♡'.repeat(Math.max(0, 20 - full));
}

export function createCardElement(card, state, opts = {}) {
  const el = ELEMENTS[card.element];
  const div = document.createElement('div');
  div.className = 'card' + (opts.onBoard ? ' on-board' : '') + (card.frozen ? ' frozen' : '');
  div.dataset.uid = card.uid;
  div.style.borderTopColor = el.color;
  div.style.borderTopWidth = '5px';
  const atk = opts.onBoard && state ? effectiveAttack(state, card, card.owner) : card.atk;
  div.innerHTML =
    '<div class="cost">' + card.cost + '</div>' +
    '<div class="suit">' + suitSvg(card.element) + '</div>' +
    '<div class="name">' + card.name + '</div>' +
    '<div class="art" style="background:' + el.soft + '">' + suitSvg(card.element) + '</div>' +
    '<div class="text">' + card.text + '</div>' +
    (card.kind === 'creature'
      ? '<div class="stats"><span class="atk">' + atk + '</span><span class="hp">' + card.hp + '</span></div>'
      : '<div class="spell-tag">✦ SPELL ✦</div>');
  if (opts.onBoard) div.querySelector('.art').style.height = '40px';
  return div;
}

export function createCardBackElement() {
  const div = document.createElement('div');
  div.className = 'card back';
  return div;
}

export function renderBoard(container, board, state, side) {
  container.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const card = board[i];
    if (card) {
      const el = createCardElement(card, state, { onBoard: true });
      if (card.justPlayed) { el.classList.add('dealt'); card.justPlayed = false; }
      container.appendChild(el);
    } else {
      const slot = document.createElement('div');
      slot.className = 'slot';
      container.appendChild(slot);
    }
  }
}

export function renderHand(container, hand, state, { playable, selectedUid, onCardClick }) {
  container.innerHTML = '';
  hand.forEach((card, index) => {
    const el = createCardElement(card, state, {});
    el.classList.add(playable(card) ? 'playable' : 'unaffordable');
    if (selectedUid === card.uid) el.classList.add('selected');
    el.title = card.name + ' — press ' + (index + 1);
    el.addEventListener('click', () => onCardClick(card));
    container.appendChild(el);
  });
}

export function renderEnemyHand(container, count) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) container.appendChild(createCardBackElement());
}

export function renderHud(state) {
  $('enemyLifeNum').textContent = Math.max(0, state.aiLife);
  $('playerLifeNum').textContent = Math.max(0, state.playerLife);
  renderHearts($('enemyHearts'), state.aiLife);
  renderHearts($('playerHearts'), state.playerLife);
  $('roundLabel').textContent = 'ROUND ' + state.round;
  $('manaLabel').textContent = '◆ ' + state.playerMana + ' / ' + state.playerManaMax;
  $('enemyDeckCount').textContent = state.aiDeck.length;
  $('playerDeckCount').textContent = state.playerDeck.length;
  $('enemyName').textContent = 'RIVAL · Kestrel';
}

export function setLog(message) {
  $('log').textContent = message;
}

export function showOverlay({ title, titleClass, sub, bodyHtml, buttonText }) {
  const overlay = $('overlay');
  $('overlayTitle').textContent = title;
  $('overlayTitle').className = titleClass || '';
  $('overlaySub').textContent = sub || '';
  $('overlayBody').innerHTML = bodyHtml || '';
  $('overlayBtn').textContent = buttonText || 'PLAY';
  overlay.classList.remove('hidden');
}

export function hideOverlay() {
  $('overlay').classList.add('hidden');
}

export function titleBodyHtml() {
  const items = Object.values(ELEMENTS).map((el) =>
    '<div class="suit-item">' + el.shape.replaceAll('COLOR', el.color) +
    '<b>' + el.name + '</b><br>' + suitBlurb(el.name) + '</div>').join('');
  return '' +
    '<p class="rule">⚔️ <b>Goal:</b> reduce Kestrel\'s life from 20 to 0 before she does the same to you.</p>' +
    '<p class="rule">◆ <b>Mana:</b> you gain +1 crystal each round (max 10). Cards cost mana to play.</p>' +
    '<p class="rule">🃏 <b>Creatures</b> stay on the board and attack at the end of your turn. <b>Spells</b> strike at once.</p>' +
    '<div class="suits">' + items + '</div>' +
    '<p class="rule">🛡️ Thorn Guards must be attacked first. Ember allies beside each other hit +1 harder. ' +
    'Tide heals you. Gale storms the whole enemy board.</p>';
}

function suitBlurb(name) {
  return { Ember: 'fury aura', Tide: 'heals you', Thorn: 'guard', Gale: 'storms foes' }[name];
}

export function endBodyHtml(state, won) {
  const rounds = state.round;
  const score = 'Life ' + Math.max(0, state.playerLife) + ' – ' + Math.max(0, state.aiLife) +
    ' · ' + rounds + ' round' + (rounds === 1 ? '' : 's');
  return '<p class="final-score">' + score + '</p>' +
    '<p style="text-align:center">' + (won
      ? 'The sigils bow to you. Kestrel concedes the table — champion of the Ember Court.'
      : 'Kestrel sweeps your sigils from the table. Shuffle up and challenge her again.') + '</p>';
}
