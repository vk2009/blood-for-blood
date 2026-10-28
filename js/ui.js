// HUD helpers, the dialogue/choice box, inventory panel and save storage.
import { translate, translateHud, translateName } from './i18n.js';
export { translateHud, translateName };
const $ = (id) => document.getElementById(id);
export const fmtPesos = (n) => Math.round(n).toLocaleString('es-CL');

// ---------------------------------------------------------------- saves
// v2 saves (open-world branch): older saves point at different story beats.
const KEYS = { auto: 'bfb.save2.auto', manual: 'bfb.save2.manual' };
export const Saves = {
  read(slot) {
    try { const s = localStorage.getItem(KEYS[slot]); return s ? JSON.parse(s) : null; } catch { return null; }
  },
  write(slot, data) {
    try { localStorage.setItem(KEYS[slot], JSON.stringify(data)); return true; } catch { return false; }
  },
  latest() {
    const a = this.read('auto'), m = this.read('manual');
    if (!a) return m; if (!m) return a;
    return a.time >= m.time ? a : m;
  },
  clearAuto() { try { localStorage.removeItem(KEYS.auto); } catch { /* ignore */ } },
};
export function describeSave(s) {
  const d = new Date(s.time);
  return `${s.chapter || ''} — ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// ---------------------------------------------------------------- dialogue
const ADVANCE = ['KeyE', 'Space', 'Enter', 'NumpadEnter', 'Mouse0'];
export class Talk {
  constructor(input) {
    this.input = input;
    this.el = $('dialogue'); this.name = $('d-name'); this.text = $('d-text'); this.en = $('d-en'); this.hint = $('d-hint'); this.list = $('choices');
    this.mode = null;            // 'say' | 'choice' | null
    this.full = ''; this.shown = 0; this.age = 0;
    this.resolve = null;
    this.options = []; this.sel = 0;
    this.advWaiters = [];
    this.list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li && this.mode === 'choice') this.pick(+li.dataset.i);
    });
  }
  get open() { return this.mode !== null; }

  say(name, text, { cinematic = false } = {}) {
    this.finish();
    this.mode = 'say';
    this.full = text; this.shown = 0; this.age = 0;
    const nEn = translateName(name);
    this.name.innerHTML = '';
    this.name.textContent = name || '';
    if (nEn) { const sm = document.createElement('small'); sm.textContent = ` · ${nEn}`; this.name.appendChild(sm); }
    this.name.style.display = name ? '' : 'none';
    this.text.textContent = '';
    this.en.textContent = translateHud(text) || '';
    this.list.innerHTML = '';
    this.hint.innerHTML = '<kbd>E</kbd> continue';
    this.el.classList.add('show');
    return new Promise((r) => { this.resolve = r; });
  }

  // options: strings or { text, used }
  choice(options, title = '') {
    this.finish();
    this.mode = 'choice';
    this.age = 0;
    this.options = options.map((o) => (typeof o === 'string' ? { text: o } : o));
    this.sel = Math.max(0, this.options.findIndex((o) => !o.used));
    this.name.textContent = title || 'Choose';
    this.name.style.display = '';
    this.text.textContent = '';
    this.en.textContent = '';
    this.list.innerHTML = '';
    this.options.forEach((o, i) => {
      const li = document.createElement('li');
      li.dataset.i = i;
      li.innerHTML = `<kbd>${i + 1}</kbd><span></span>`;
      li.querySelector('span').textContent = o.text;
      if (o.used) li.classList.add('used');
      this.list.appendChild(li);
    });
    this.hint.innerHTML = '<kbd>1</kbd>–<kbd>' + this.options.length + '</kbd> or <kbd>W</kbd>/<kbd>S</kbd> + <kbd>E</kbd>';
    this.highlight();
    this.el.classList.add('show');
    return new Promise((r) => { this.resolve = r; });
  }
  highlight() { [...this.list.children].forEach((li, i) => li.classList.toggle('sel', i === this.sel)); }
  pick(i) {
    if (this.age < 0.25 || !this.options[i]) return;
    const r = this.resolve;
    this.resolve = null; this.mode = null;
    this.list.innerHTML = '';
    this.el.classList.remove('show');
    r?.(i);
  }

  waitAdvance(minDelay = 0) {
    return new Promise((r) => this.advWaiters.push({ t: minDelay, r }));
  }

  // Resolve whatever is pending and hide the box.
  finish() {
    if (this.resolve) { const r = this.resolve; this.resolve = null; r(this.mode === 'choice' ? 0 : undefined); }
    this.mode = null;
  }
  close() {
    this.finish();
    this.el.classList.remove('show');
    this.list.innerHTML = '';
  }

  update(dt) {
    const I = this.input;
    const adv = ADVANCE.some((k) => I.pressed(k));
    for (let i = this.advWaiters.length - 1; i >= 0; i--) {
      const w = this.advWaiters[i];
      w.t -= dt;
      if (adv && w.t <= 0) { this.advWaiters.splice(i, 1); w.r(); }
    }
    if (!this.mode) return;
    this.age += dt;
    if (this.mode === 'say') {
      if (this.shown < this.full.length) {
        this.shown = Math.min(this.full.length, this.shown + dt * 55);
        this.text.textContent = this.full.slice(0, Math.floor(this.shown));
        if (adv && this.age > 0.12) { this.shown = this.full.length; this.text.textContent = this.full; }
      } else if (adv && this.age > 0.2) {
        const r = this.resolve; this.resolve = null; this.mode = null;
        this.el.classList.remove('show');
        r?.();
      }
    } else if (this.mode === 'choice') {
      for (let i = 0; i < this.options.length; i++) if (I.pressed(`Digit${i + 1}`) || I.pressed(`Numpad${i + 1}`)) { this.pick(i); return; }
      if (I.pressed('KeyW') || I.pressed('ArrowUp')) { this.sel = (this.sel + this.options.length - 1) % this.options.length; this.highlight(); }
      if (I.pressed('KeyS') || I.pressed('ArrowDown')) { this.sel = (this.sel + 1) % this.options.length; this.highlight(); }
      if (I.pressed('KeyE') || I.pressed('Enter') || I.pressed('Space')) this.pick(this.sel);
    }
  }
}

// ---------------------------------------------------------------- HUD
export class UI {
  constructor() {
    this.el = {
      objective: $('objective'), objChapter: $('obj-chapter'), objText: $('obj-text'), objDist: $('obj-dist'),
      money: $('money'), moneyVal: $('money-val'), prompt: $('prompt'), banner: $('banner'), bannerTitle: $('banner-title'),
      bannerSub: $('banner-sub'), toasts: $('toasts'), saving: $('saving'), savingText: $('saving-text'), vignette: $('vignette'),
      card: $('card'), cardTitle: $('card-title'), cardSub: $('card-sub'), fade: $('fade'), qte: $('qte'), qteLabel: $('qte-label'),
      waypoint: $('waypoint'), wpDist: $('wp-dist'), zoneName: $('zone-name'), zoneRegion: $('zone-region'), hpFill: $('hp-fill'),
      plates: $('plates'),
    };
    this.bannerTimer = null;
  }
  cinema(on) { document.body.classList.toggle('cinema', on); }
  showCard(title, sub = '') {
    this.el.cardTitle.textContent = title;
    this.el.cardSub.textContent = sub;
    const en = translateHud(`${title}\n${sub}`);
    document.getElementById('card-en').textContent = en ? en.replace(/^\n/, '') : '';
    this.el.card.classList.add('show');
  }
  hideCard(instant = false) {
    const c = this.el.card;
    if (instant) { c.style.transition = 'none'; c.classList.remove('show'); void c.offsetWidth; c.style.transition = ''; }
    else c.classList.remove('show');
  }
  fade(on) { this.el.fade.classList.toggle('show', on); }
  qte(label) {
    if (label) { this.el.qteLabel.textContent = label; this.el.qte.classList.add('show'); }
    else this.el.qte.classList.remove('show');
  }
  setObjective(chapter, text, flash = true) {
    const o = this.el.objective;
    o.classList.toggle('empty', !text);
    this.el.objChapter.textContent = chapter || '';
    this.el.objText.textContent = text || '';
    document.getElementById('obj-en').textContent = [translateHud(chapter), translateHud(text)].filter(Boolean).join(' — ');
    if (flash && text) { o.classList.remove('flash'); void o.offsetWidth; o.classList.add('flash'); }
  }
  setDistance(m) { this.el.objDist.textContent = m == null ? '' : `${Math.round(m)} m`; }
  setMoney(n, bump = false) {
    this.el.moneyVal.textContent = fmtPesos(n);
    if (bump) { this.el.money.classList.remove('bump'); void this.el.money.offsetWidth; this.el.money.classList.add('bump'); }
  }
  prompt(html, locked = false) {
    const p = this.el.prompt;
    if (!html) { p.classList.remove('show'); return; }
    p.innerHTML = html;
    p.classList.toggle('locked', locked);
    p.classList.add('show');
  }
  banner(title, sub = '') {
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = [sub, translateHud(title)].filter(Boolean).join('  ·  ');
    this.el.banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => this.el.banner.classList.remove('show'), 3200);
  }
  toast(text, label = 'Notice', bad = false) {
    const t = document.createElement('div');
    t.className = 'toast' + (bad ? ' bad' : '');
    t.innerHTML = `<small></small><span></span>`;
    t.querySelector('small').textContent = label;
    t.querySelector('span').textContent = text;
    this.el.toasts.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
  saving(text = 'Saving…') {
    this.el.savingText.textContent = text;
    this.el.saving.classList.add('show');
    clearTimeout(this.savingTimer);
    this.savingTimer = setTimeout(() => this.el.saving.classList.remove('show'), 1800);
  }
  hit() {
    const v = this.el.vignette;
    v.classList.add('hit');
    requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove('hit')));
  }
  setHealth(k) {
    this.el.hpFill.style.width = `${Math.max(0, k) * 100}%`;
    document.getElementById('health').classList.toggle('low', k < 0.3);
  }
  setZone(name, region) {
    this.el.zoneName.textContent = name;
    const en = translateHud(name);
    this.el.zoneRegion.textContent = [en, region].filter(Boolean).join(' · ');
  }
}

// ---------------------------------------------------------------- inventory panel
export class InventoryPanel {
  constructor(items, foods) {
    this.items = items;
    this.foods = foods;
    this.root = $('inventory');
    this.list = $('inv-list');
    this.detail = $('inv-detail');
    this.sel = 0;
    this.root.querySelector('[data-close]').addEventListener('click', () => this.onClose?.());
    this.list.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-i]');
      if (li) { this.sel = +li.dataset.i; this.render(); }
    });
    this.detail.addEventListener('click', (e) => {
      if (e.target.closest('[data-eat]')) this.eatSelected();
    });
  }
  get isOpen() { return !this.root.classList.contains('hidden'); }
  open(inv, pesos, food = {}, hp = 100, sel = 0) {
    this.pesos = pesos; this.hp = hp;
    this.entries = [
      ...Object.entries(food).filter(([, n]) => n > 0).map(([id, n]) => ({ kind: 'food', id, n })),
      ...inv.map((id) => ({ kind: 'item', id })),
    ];
    this.sel = Math.min(sel, Math.max(0, this.entries.length - 1));
    this.render();
    this.root.classList.remove('hidden');
  }
  close() { this.root.classList.add('hidden'); }
  eatSelected() {
    const e = this.entries[this.sel];
    if (e?.kind === 'food') this.onEat?.(e.id);
  }
  render() {
    this.root.querySelector('.inv-money').textContent = `$ ${fmtPesos(this.pesos)} · ❤ ${Math.round(this.hp)}/100`;
    this.list.innerHTML = '';
    const big = this.detail.querySelector('.inv-icon-big'), h3 = this.detail.querySelector('h3'), p = this.detail.querySelector('p');
    this.detail.querySelector('.eat')?.remove();
    if (!this.entries.length) {
      this.list.innerHTML = '<li class="empty"><span class="ic">·</span>Empty pockets.</li>';
      h3.textContent = ''; big.textContent = '';
      p.textContent = 'Emilio owns almost nothing. That is not an accident.';
      return;
    }
    this.entries.forEach((e, i) => {
      const it = e.kind === 'food' ? this.foods[e.id] : this.items[e.id];
      const li = document.createElement('li');
      li.dataset.i = i;
      li.innerHTML = `<span class="ic">${it.icon}</span><span></span>`;
      li.lastChild.textContent = e.kind === 'food' ? `${it.name} ×${e.n}` : it.name;
      if (i === this.sel) li.classList.add('sel');
      this.list.appendChild(li);
    });
    const e = this.entries[this.sel];
    const it = e.kind === 'food' ? this.foods[e.id] : this.items[e.id];
    big.textContent = it.icon;
    h3.textContent = it.name;
    p.textContent = e.kind === 'food' ? `${it.desc}\n(${it.en})\n\nRestores ${it.heal} health.` : (typeof it.desc === 'function' ? it.desc(this) : it.desc);
    if (e.kind === 'food') {
      const b = document.createElement('button');
      b.className = 'eat'; b.dataset.eat = '1';
      b.innerHTML = '<kbd>E</kbd> Eat';
      this.detail.appendChild(b);
    }
  }
  update(input) {
    if (input.pressed('KeyE')) { this.eatSelected(); return; }
    if (!this.entries?.length) return;
    if (input.pressed('KeyS') || input.pressed('ArrowDown')) { this.sel = (this.sel + 1) % this.entries.length; this.render(); }
    if (input.pressed('KeyW') || input.pressed('ArrowUp')) { this.sel = (this.sel + this.entries.length - 1) % this.entries.length; this.render(); }
  }
}
