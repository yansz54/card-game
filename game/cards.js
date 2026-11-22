// Ember Sigils — card definitions, the four elements, and deck building.
// Every card is original: names, art (inline SVG shapes) and rules are ours.

export const ELEMENTS = {
  ember: { name: 'Ember', color: '#d9381e', soft: '#fde3d8',
    shape: '<svg viewBox="0 0 24 24"><path d="M12 2 C8 7 5 9 5 13 a7 7 0 0 0 14 0 C19 9 16 7 12 2 Z M12 20 a3.5 3.5 0 0 1 -3.5 -3.5 C8.5 14 10 13 12 11 C14 13 15.5 14 15.5 16.5 A3.5 3.5 0 0 1 12 20 Z" fill="COLOR"/></svg>' },
  tide: { name: 'Tide', color: '#1e6fd9', soft: '#d8e8fd',
    shape: '<svg viewBox="0 0 24 24"><path d="M12 2 C12 2 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 2 12 2 Z" fill="COLOR"/></svg>' },
  thorn: { name: 'Thorn', color: '#2e8b3a', soft: '#d8f2d8',
    shape: '<svg viewBox="0 0 24 24"><path d="M20 4 C10 4 4 10 4 20 C14 20 20 14 20 4 Z M7 17 C9 12 13 8 17 7" stroke="#fff" stroke-width="1.6" fill="COLOR"/></svg>' },
  gale: { name: 'Gale', color: '#c9920a', soft: '#fdf0c8',
    shape: '<svg viewBox="0 0 24 24"><path d="M13 2 L4 14 h6 L9 22 L20 9 h-6 Z" fill="COLOR"/></svg>' },
};

export function suitSvg(element, colorOverride) {
  const el = ELEMENTS[element];
  return el.shape.replaceAll('COLOR', colorOverride || el.color);
}

// A card definition: id, name, kind ('creature' | 'spell'), element, cost,
// atk/hp for creatures, text, and an ability key the engine resolves.
export const CARD_DEFS = [
  { id: 'ember-imp',    name: 'Ember Imp',    kind: 'creature', element: 'ember', cost: 1, atk: 2, hp: 1, ability: 'fury',    text: 'Allies beside it +1 attack.' },
  { id: 'tide-sprite',  name: 'Tide Sprite',  kind: 'creature', element: 'tide',  cost: 1, atk: 1, hp: 2, ability: 'mend',    text: 'Heal 2 life when played.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', kind: 'creature', element: 'thorn', cost: 1, atk: 1, hp: 3, ability: 'guard',   text: 'Guard: attack it first.' },
  { id: 'gale-wisp',    name: 'Gale Wisp',    kind: 'creature', element: 'gale',  cost: 1, atk: 2, hp: 2, ability: 'storm',   text: '1 damage to all foes.' },
  { id: 'ember-hound',  name: 'Ember Hound',  kind: 'creature', element: 'ember', cost: 2, atk: 3, hp: 2, ability: 'fury',    text: 'Allies beside it +1 attack.' },
  { id: 'tide-heron',   name: 'Tide Heron',   kind: 'creature', element: 'tide',  cost: 2, atk: 2, hp: 3, ability: 'mend',    text: 'Heal 2 life when played.' },
  { id: 'thorn-bramble',name: 'Bramble',kind: 'creature', element: 'thorn', cost: 3, atk: 2, hp: 6, ability: 'guard',   text: 'Guard: attack it first.' },
  { id: 'gale-falcon',  name: 'Gale Falcon',  kind: 'creature', element: 'gale',  cost: 3, atk: 4, hp: 3, ability: 'storm',   text: '1 damage to all foes.' },
  { id: 'ember-drake',  name: 'Ember Drake',  kind: 'creature', element: 'ember', cost: 4, atk: 5, hp: 4, ability: 'fury',    text: 'Allies beside it +1 attack.' },
  { id: 'tide-leviathan',name:'Tide Leviathan',kind:'creature', element: 'tide',  cost: 5, atk: 4, hp: 7, ability: 'mend',    text: 'Heal 2 life when played.' },
  { id: 'thorn-ancient',name: 'Ancient',kind: 'creature', element: 'thorn', cost: 5, atk: 3, hp: 8, ability: 'guard',   text: 'Guard: attack it first.' },
  { id: 'gale-tempest', name: 'Gale Tempest', kind: 'creature', element: 'gale',  cost: 4, atk: 6, hp: 4, ability: 'storm',   text: '1 damage to all foes.' },
  { id: 'spell-fireball', name: 'Fireball',   kind: 'spell', element: 'ember', cost: 3, ability: 'fireball', text: 'Deal 3 damage to any target.' },
  { id: 'spell-mend',    name: 'Mend',        kind: 'spell', element: 'tide',  cost: 2, ability: 'mend-spell', text: 'Restore 5 life.' },
  { id: 'spell-insight', name: 'Insight',     kind: 'spell', element: 'gale',  cost: 2, ability: 'insight',  text: 'Draw 2 cards.' },
  { id: 'spell-frost',   name: 'Frostbite',   kind: 'spell', element: 'tide',  cost: 2, ability: 'frost',    text: 'Freeze an enemy creature.' },
];

export function defById(id) {
  return CARD_DEFS.find((d) => d.id === id);
}

// A 24-card deck: two copies of each creature, one of each spell, plus extras.
const DECK_LIST = [
  'ember-imp', 'ember-imp', 'tide-sprite', 'tide-sprite', 'thorn-sprout', 'thorn-sprout',
  'gale-wisp', 'gale-wisp', 'ember-hound', 'ember-hound', 'tide-heron', 'tide-heron',
  'thorn-bramble', 'thorn-bramble', 'gale-falcon', 'gale-falcon', 'ember-drake', 'tide-leviathan',
  'thorn-ancient', 'gale-tempest', 'spell-fireball', 'spell-mend', 'spell-insight', 'spell-frost',
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeck(random) {
  const deck = DECK_LIST.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

let uidCounter = 0;
export function makeCardInstance(defId, owner) {
  const def = defById(defId);
  return {
    uid: 'c' + (++uidCounter),
    defId: def.id, name: def.name, kind: def.kind, element: def.element,
    cost: def.cost, atk: def.atk || 0, hp: def.hp || 0, maxHp: def.hp || 0,
    ability: def.ability, text: def.text, owner, frozen: false, justPlayed: false,
  };
}
