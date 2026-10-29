// Chapter III–IV: Gustavo's empire. Five numbers that pull against each other:
//   Reputation · Product · Fear · Heat (0–100) and Money (dollars, the wallet).
// Everything is run from the ledger on the desk in his office at Los Pollos
// Hermanos. Each week costs payroll and the cartel's cut; neglect shows up as
// a DEA raid (heat), a mutiny (no reputation and no fear) or a bullet.
import { sfx } from './sfx.js';
import { fmtPesos } from './ui.js';

export const EMPIRE_START = {
  rep: 35, product: 30, fear: 20, heat: 10,
  week: 1, restaurants: 1, routes: 1, moves: 0, revenge: 0, crisis: null, warned: {},
};
const STATS = [
  ['rep', 'Reputation', '#e8c46a'], ['product', 'Product', '#7fd0ea'],
  ['fear', 'Fear', '#b884ff'], ['heat', 'Heat', '#ff5a3a'],
];
export const CREW = {
  victor: { name: 'Victor', perk: 'Watches every road: −4 heat a week.' },
  tyrus: { name: 'Tyrus', perk: 'Muscle at every door: +3 fear a week.' },
  mike: { name: 'Mike Ehrmantraut', perk: 'Unlocks “Clean house” (big heat cut) and the highway job.' },
  gale: { name: 'Gale Boetticher', perk: 'Purer product: +2 product a week, better lab investments.' },
  saul: { name: 'Saul Goodman', perk: 'Launders the money: +15% income, cheaper pay-offs.' },
};
const MAX_MOVES = 2;
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const usd = (n) => `$ ${fmtPesos(n)}`;

export class Empire {
  constructor(G, state) {
    this.G = G;
    this.state = state;
    this.el = document.getElementById('empire');
  }
  get E() { return this.state.empire; }
  crew(id) { return !!this.state.flags['crew:' + id]; }
  crewCount() { return Object.keys(CREW).filter((k) => this.crew(k)).length; }
  start(money = 60000) {
    if (!this.state.empire) this.state.empire = JSON.parse(JSON.stringify(EMPIRE_START));
    if (money != null) this.G.setPesos(money, 'Madrigal seed money');
    this.render();
  }

  // ---------------------------------------------------------------- stats
  add(k, n, why = null) {
    const E = this.E;
    if (!E || !n) return;
    const before = E[k];
    E[k] = clamp(E[k] + n);
    const d = E[k] - before;
    if (d && why !== false) {
      const label = STATS.find((s) => s[0] === k)?.[1] || k;
      const bad = k === 'heat' ? d > 0 : d < 0;
      this.G.ui.toast(`${d > 0 ? '+' : '−'}${Math.abs(d)} ${label}`, why || 'Empire', bad);
    }
    this.render();
  }
  apply(fx, why) { for (const [k, n] of Object.entries(fx)) if (k === 'money') this.G.addPesos(n, why); else this.add(k, n, why); }

  // ---------------------------------------------------------------- economy
  week() {
    const E = this.E;
    const legit = E.restaurants * 6000;
    const street = E.routes * (2000 + E.product * 120);
    const cut = Math.round(street * 0.2);
    let income = legit + street - cut;
    if (this.crew('saul')) income = Math.round(income * 1.15);
    const payroll = 3000 + this.crewCount() * 2500 + E.routes * 1500;
    return { legit, street, cut, income, payroll, net: income - payroll };
  }

  // ---------------------------------------------------------------- the ledger (desk in the office)
  moves() {
    const E = this.E, G = this.G;
    const m = [
      { id: 'restaurant', text: `Open a new Los Pollos Hermanos (${usd(40000)}) — +reputation, a little heat`, cost: 40000, ok: E.restaurants < 6,
        fx: { rep: 6, heat: 3 }, then: () => { E.restaurants++; } },
      { id: 'route', text: `Add a distribution route (${usd(25000)}) — more money, much more heat`, cost: 25000, ok: E.routes < 5,
        need: E.product >= 20 + E.routes * 10 ? null : `Product must be ${20 + E.routes * 10}+ before buyers trust a new route.`,
        fx: { heat: 8, rep: 2 }, then: () => { E.routes++; } },
      { id: 'lab', text: `Invest in the lab (${usd(30000)}) — +product`, cost: 30000, ok: E.product < 100,
        fx: { product: this.crew('gale') ? 20 : 12 } },
      { id: 'payoff', text: `Pay off officials (${usd(this.crew('saul') ? 14000 : 20000)}) — −heat`, cost: this.crew('saul') ? 14000 : 20000, ok: E.heat > 0,
        fx: { heat: this.crew('saul') ? -25 : -15 } },
      { id: 'message', text: 'Send a message to a rival crew (free) — +fear, −reputation, +heat', cost: 0, ok: true,
        fx: { fear: 12, rep: -8, heat: 5 } },
      { id: 'charity', text: `Sponsor a charity fun-run for the DEA (${usd(15000)}) — +reputation, −heat`, cost: 15000, ok: true,
        fx: { rep: 10, heat: -6 } },
    ];
    if (this.crew('mike')) m.push({ id: 'clean', text: `Mike: clean house (${usd(10000)}) — −heat, +fear`, cost: 10000, ok: E.heat > 0, fx: { heat: -25, fear: 4 } });
    return m.filter((x) => x.ok);
  }
  statusLines() {
    const E = this.E, w = this.week();
    return [
      `Week ${E.week} · ${usd(this.G.pesos)} in the safe · ${E.restaurants} restaurant${E.restaurants > 1 ? 's' : ''} · ${E.routes} route${E.routes > 1 ? 's' : ''} · crew ${this.crewCount()}/5`,
      `Next week: about ${usd(w.income)} in (after Don Eladio’s cut of ${usd(w.cut)}), ${usd(w.payroll)} payroll — net ${w.net < 0 ? '−' : '+'}${usd(Math.abs(w.net))}.`,
    ];
  }
  async ledger(T) {
    const G = this.G, E = this.E;
    if (!E) return;
    G.emit('ledger:open');
    sfx.click();
    for (;;) {
      const [a, b] = this.statusLines();
      await T.say('Ledger', `${a}\n${b}`);
      const moves = this.moves();
      const left = MAX_MOVES - E.moves;
      const opts = moves.map((m) => ({ text: m.text, used: left <= 0 || G.pesos < m.cost }));
      opts.push({ text: 'Read the crew & threat report' }, { text: 'End the week — collect, pay everyone' }, { text: 'Close the ledger' });
      const c = await T.choice(opts, left > 0 ? `Your moves this week: ${left} left` : 'No moves left this week');
      if (c === moves.length + 2) return;
      if (c === moves.length + 1) { await this.endWeek(T); return; }
      if (c === moves.length) { await this.report(T); continue; }
      const m = moves[c];
      if (left <= 0) { await T.say('Gustavo', 'Two moves a week. More than that and you start making mistakes. End the week.'); continue; }
      if (m.need) { await T.say('Gustavo', m.need); continue; }
      if (G.pesos < m.cost) { await T.say('Gustavo', 'Not enough in the safe. Patience.'); continue; }
      if (m.cost) G.addPesos(-m.cost, m.text.split(' (')[0]);
      E.moves++;
      m.then?.();
      this.apply(m.fx, m.text.split(' (')[0]);
      this.G.emit('empire:changed');
    }
  }
  async report(T) {
    const E = this.E;
    const crew = Object.entries(CREW).map(([k, c]) => `${this.crew(k) ? '✓' : '·'} ${c.name}${this.crew(k) ? ' — ' + c.perk : ''}`).join('\n');
    await T.say('Crew', crew);
    const warn = [];
    if (E.heat >= 75) warn.push('Heat is very high. One more push and the DEA comes through the door.');
    if (E.rep < 20 && E.fear < 30) warn.push('Nobody respects you and nobody fears you. Your own people are talking.');
    if (E.routes >= 4) warn.push('Don Eladio counts your routes. He has noticed how fast you are growing.');
    await T.say('Threats', warn.length ? warn.join('\n') : 'Quiet. For now.');
  }

  async endWeek(T) {
    const G = this.G, E = this.E, w = this.week();
    G.addPesos(w.income, `Week ${E.week} income`);
    G.addPesos(-w.payroll, 'Payroll');
    const lines = [`Week ${E.week} closes. ${usd(w.income)} in, ${usd(w.payroll)} out. Don Eladio took ${usd(w.cut)} before you ever saw it.`];
    // drift
    let heat = E.routes * 3 + (E.restaurants >= 4 ? 2 : 0) + Math.round(w.street / 20000) - 4;
    if (this.crew('victor')) heat -= 4;
    let fear = -2 + (this.crew('tyrus') ? 3 : 0);
    let rep = E.product >= 50 ? 1 : 0;
    let product = this.crew('gale') ? 2 : -1;
    if (G.pesos <= 0 && w.net < 0) { rep -= 10; fear -= 5; lines.push('There was not enough to pay everyone. Men who are not paid start to talk.'); }
    this.add('heat', heat, false); this.add('fear', fear, false); this.add('rep', rep, false); this.add('product', product, false);
    E.week++;
    E.moves = 0;
    sfx.coin();
    await T.say('Ledger', lines.join('\n'));
    await T.say('Ledger', `Reputation ${E.rep} · Product ${E.product} · Fear ${E.fear} · Heat ${E.heat}`);
    await this.checkCrisis(T);
    G.emit('empire:week');
    G.emit('empire:changed');
    this.render();
  }

  // ---------------------------------------------------------------- consequences
  async checkCrisis(T) {
    const G = this.G, E = this.E;
    if (E.rep < 8 && E.fear < 12) {
      await T.say('', '*Nobody fears Gustavo Fring any more, and nobody likes him enough to warn him.*');
      G.gameOver('His own men decided he was finished. Gustavo Fring did not see the next morning.\n(Keep Reputation or Fear up — when both collapse, the organization turns on you.)');
      return;
    }
    if (E.heat >= 100 && E.crisis !== 'raid') {
      E.crisis = 'raid';
      await T.say('Victor (phone)', 'Mr. Fring — the DEA has a warrant for the Madrigal warehouse. They are on their way. Fifteen minutes, maybe less.');
      this.startCrisis('crisisRaid');
      return;
    }
    if (E.rep < 15 && E.fear < 25 && E.crisis !== 'mutiny') {
      E.crisis = 'mutiny';
      await T.say('Victor (phone)', 'Mr. Fring. Some of the street crews say they work for themselves now. They are waiting in the lot behind the restaurant. Armed.');
      this.startCrisis('crisisMutiny');
      return;
    }
    if (E.heat >= 75 && !E.warned.heat) { E.warned.heat = true; await T.say('Gustavo', '(Too many eyes. Pay someone, or slow down — before someone else slows me down.)'); }
    if (E.rep < 25 && E.fear < 35 && !E.warned.rep) { E.warned.rep = true; await T.say('Gustavo', '(They are starting to wonder what I am. A man with no respect and no fear does not stay in charge.)'); }
  }
  startCrisis(id) {
    const ow = this.G.ow;
    if (this.state.side && this.state.side.id !== id) ow.abandon();
    const J = ow.jobFor(id);
    if (J && !J.active) J.start('go');
  }
  endCrisis() { if (this.E) this.E.crisis = null; this.render(); }

  // ---------------------------------------------------------------- Chapter III goal
  ready() {
    const E = this.E;
    return !!E && this.crewCount() >= 5 && E.revenge >= 3 && E.restaurants >= 3 && E.product >= 50;
  }
  progress() {
    const E = this.E;
    if (!E) return '';
    return `Build the empire: crew ${this.crewCount()}/5 · strikes on the Salamancas ${E.revenge}/3 · restaurants ${E.restaurants}/3 · product ${E.product}/50`;
  }

  onEvent(e) {
    if ((e === 'empire:changed' || e === 'empire:week') && this.G.S.at('empire') && this.ready()) this.G.emit('empire:ready');
  }

  // ---------------------------------------------------------------- HUD
  render() {
    const E = this.E, G = this.G;
    const show = !!E && G.S.past?.('burial') && (G.mode === 'play' || G.mode === 'talk');
    this.el.classList.toggle('show', !!show);
    if (!show) return;
    const html = STATS.map(([k, label, color]) => {
      const v = E[k];
      const warn = k === 'heat' ? v >= 75 : (k === 'rep' || k === 'fear') ? v < 20 : false;
      return `<div class="er${warn ? ' warn' : ''}"><span>${label}</span><i><u style="width:${v}%;background:${color}"></u></i><em>${v}</em></div>`;
    }).join('');
    const key = html + E.week + E.moves;
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.el.innerHTML = `<h4><span>Empire</span><span>Week ${E.week}</span></h4>${html}<small>Ledger: desk in your office at Los Pollos · moves left ${MAX_MOVES - E.moves}</small>`;
  }
  update() { this.render(); }
}
