/*
 * Einspeisevergütung Karte für Home Assistant
 * custom:einspeiseverguetung-card mit den Reitern
 *  - Auswertung: Monatstabelle, Saldo und Prognose
 *  - Eingabe:    Abschläge, Abrechnungen und Vergütungssätze (schreibt direkt in die Langzeitstatistik)
 * (Die Reiter sind intern als eigene Elemente umgesetzt, in der Kartenauswahl erscheint nur die Karte.)
 * Lizenz: MIT
 */
const EWA_VERSION = '0.9.0';

/* ---------- gemeinsame Hilfen ---------- */
const EWA_DEF = {
  versorger: 'Versorger',
  stat_abschlag: 'einspeisung:abschlag_monat',
  stat_abschlag_gesamt: 'einspeisung:abschlag_gesamt',
  stat_abrechnung: 'einspeisung:abrechnung',
  stat_satz: 'einspeisung:verguetung_satz',
  quelle: '',
  eingabe_anzeigen: true
};
const EWA_STATE = { year: new Date().getFullYear() };

// Jahr: interne Auswahl (gemeinsam für alle Karten auf der Seite)
function ewaYear() {
  const opts = [];
  for (let y = 2020; y <= new Date().getFullYear() + 1; y++) opts.push(String(y));
  return { year: EWA_STATE.year, options: opts };
}
function ewaSetYear(hass, cfg, opt) {
  EWA_STATE.year = parseInt(opt);
  window.dispatchEvent(new Event('ewa-year'));
}
function ewaSource(id) { return String(id).split(':')[0]; }
const EWA_FIELDS = (extra) => ({
  computeLabel: (s) => ({
    versorger: 'Name des Einspeiseversorgers',
    titel: 'Titel der Karte (leer = automatisch)',
    stat_abschlag: 'Statistik: Abschlag monatlich',
    stat_abschlag_gesamt: 'Statistik: Abschlag Gesamtsumme',
    stat_abrechnung: 'Statistik: Abrechnung (Ausgleich)',
    stat_satz: 'Statistik: Vergütungssatz (ct/kWh)',
    quelle: 'Einspeise-Zähler (kWh, mit Langzeitstatistik)',
    eingabe_anzeigen: 'Reiter „Eingabe“ anzeigen',
    abschlag_vorgabe: 'Vorbelegter Abschlag für leere Monate (optional)'
  }[s.name] || s.name),
  computeHelper: (s) => ({
    versorger: 'Wird in Titeln und Texten angezeigt.',
    stat_abschlag: 'Format quelle:name, z. B. einspeisung:abschlag_monat. Der Teil vor dem Doppelpunkt ist die Quelle.',
    quelle: 'Aufsteigender Zähler der eingespeisten Energie; die Tagesdifferenz wird bewertet.',
    eingabe_anzeigen: 'Ausschalten für eine reine Anzeigekarte (z. B. für Benutzer ohne Admin-Rechte).'
  }[s.name] || '')
});

/* ---------- Reiter Eingabe ---------- */
class EwaEingabeCard extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({}, EWA_DEF, config || {});
    if (this._built) { this._applyTitle(); this._mode(); this._load(); }
  }
  getCardSize() { return 9; }
  _v() { return this._config.versorger || 'Versorger'; }
  _applyTitle() {
    const t = this._r && this._r.querySelector('#ttl');
    if (t) t.textContent = this._config.titel || (this._v() + ' Eingabe');
  }
  connectedCallback() {
    this._yev = () => { if (this._built) { this._year = ewaYear(this._hass, this._config).year; this._syncInputs(); this._render(); } };
    window.addEventListener('ewa-year', this._yev);
  }
  disconnectedCallback() { window.removeEventListener('ewa-year', this._yev); }
  set hass(h) {
    this._hass = h;
    if (!this._config) this._config = Object.assign({}, EWA_DEF);
    const yi = ewaYear(h, this._config);
    if (!this._built) {
      this._built = true;
      this._year = yi.year; this._lastSel = yi.year;
      this._build();
      this._load();
    } else if (yi.year !== this._lastSel) {
      this._lastSel = yi.year; this._year = yi.year;
      this._syncInputs(); this._render();
    }
  }
  _step(d) {
    const yi = ewaYear(this._hass, this._config);
    const t = yi.options[yi.options.indexOf(String(this._year)) + d];
    if (t) ewaSetYear(this._hass, this._config, t);
  }
  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        ha-card { padding: 16px; }
        :host([embedded]) ha-card { box-shadow: none; border: none; background: none; padding: 0; }
        :host([embedded]) h2 { display: none; }
        h2 { margin: 0 0 12px; font-size: 1.1em; font-weight: 500; }
        .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: end; margin-bottom: 8px; }
        label { display: flex; flex-direction: column; font-size: 0.8em; color: var(--secondary-text-color); gap: 2px; }
        select, input { font: inherit; padding: 8px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); min-width: 130px; }
        button { font: inherit; padding: 9px 16px; border-radius: 8px; border: 0; cursor: pointer; background: var(--primary-color); color: var(--text-primary-color, #fff); }
        button:disabled { opacity: .4; cursor: default; }
        button.nav { padding: 4px 12px; background: var(--secondary-background-color); color: var(--primary-text-color); }
        #msg { min-height: 1.4em; font-size: 0.9em; margin: 4px 0 8px; }
        .ok { color: var(--success-color, green); } .err { color: var(--error-color, red); }
        table { width: 100%; border-collapse: collapse; font-size: 0.9em; margin-top: 4px; }
        th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--divider-color); }
        td.n, th.n { text-align: right; }
        tr.click { cursor: pointer; } tr.click:hover { background: var(--secondary-background-color); }
        tr.empty td { color: var(--secondary-text-color); }
        tr.tot td { font-weight: 600; border-top: 2px solid var(--divider-color); }
        h3 { margin: 14px 0 2px; font-size: 0.95em; font-weight: 500; display: flex; align-items: center; gap: 10px; }
        .hint { font-size: 0.8em; color: var(--secondary-text-color); }
      </style>
      <ha-card>
        <h2 id="ttl"></h2>
        <div class="row">
          <label>Art<select id="art"><option value="abschlag">Abschlag (Monat)</option><option value="abrechnung">Abrechnung (Ausgleich)</option><option value="satz">Vergütungssatz (ab Datum)</option></select></label>
          <label id="lblm">Monat<input id="monat" type="month"></label>
          <label id="lbld" style="display:none">Abrechnung für Jahr<input id="datum" type="number" min="2000" max="2100" step="1"></label>
          <label id="lbls" style="display:none">Gültig ab<input id="sdatum" type="date"></label>
          <label><span id="lblb">Betrag in €</span><input id="betrag" type="text" inputmode="decimal" placeholder="35,00"></label>
          <button id="save">Eintragen</button>
        </div>
        <div class="hint" id="hint"></div>
        <div id="msg"></div>
        <div id="lists"></div>
      </ha-card>`;
    this._r = root;
    const q = (s) => root.querySelector(s);
    q('#art').addEventListener('change', () => this._mode());
    q('#save').addEventListener('click', () => this._save());
    this._applyTitle();
    this._syncInputs();
    this._mode();
    if (this._hass && this._hass.user && !this._hass.user.is_admin) {
      this._msg('Schreiben in die Statistik braucht einen Administrator-Benutzer.', true);
    }
  }
  _mode() {
    const q = (s) => this._r.querySelector(s);
    const a = q('#art').value;
    const V = this._v();
    q('#lblm').style.display = a === 'abschlag' ? '' : 'none';
    q('#lbld').style.display = a === 'abrechnung' ? '' : 'none';
    q('#lbls').style.display = a === 'satz' ? '' : 'none';
    q('#lblb').textContent = a === 'satz' ? 'Satz in ct/kWh' : 'Betrag in €';
    q('#betrag').placeholder = a === 'satz' ? '7,81' : '35,00';
    q('#hint').textContent = a === 'abschlag' ? 'Gleicher Monat = bestehenden Wert überschreiben.'
      : a === 'abrechnung' ? 'Betrag des Ausgleichs laut Jahresabrechnung: positiv = ' + V + ' zahlt dir, negativ = du zahlst zurück. Gleiches Jahr überschreibt.'
      : 'Neuer Einspeisesatz, gültig ab dem Datum. Frühere Zeiträume rechnen weiter mit dem damals gültigen Satz. Gleiches Datum überschreibt.';
  }
  _syncInputs() {
    const q = (s) => this._r.querySelector(s);
    const now = new Date();
    const mm = this._year === now.getFullYear() ? String(now.getMonth() + 1).padStart(2, '0') : '01';
    q('#monat').value = this._year + '-' + mm;
    q('#datum').value = this._year;
    if (!q('#sdatum').value) q('#sdatum').value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  }
  _msg(t, err) {
    const m = this._r.querySelector('#msg');
    m.textContent = t; m.className = err ? 'err' : 'ok';
  }
  _key(ms) { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  _ds(ms) { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  async _fetch(id, period) {
    const r = await this._hass.callWS({ type: 'recorder/statistics_during_period', start_time: '2020-01-01T00:00:00Z', statistic_ids: [id], period: period, types: ['mean'] });
    return (r[id] || []).filter((x) => x.mean !== null && x.mean !== undefined);
  }
  _import(id, name, hasSum, stats, unit) {
    return this._hass.callWS({ type: 'recorder/import_statistics', metadata: { has_mean: !hasSum, has_sum: hasSum, name: name, source: ewaSource(id), statistic_id: id, unit_of_measurement: unit || '€' }, stats: stats });
  }
  _fmt(v) { return Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  _fmtS(v) { return Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + ' ct/kWh'; }
  async _save() {
    const q = (s) => this._r.querySelector(s);
    const btn = q('#save');
    const art = q('#art').value;
    const c = this._config; const V = this._v();
    const v = parseFloat(String(q('#betrag').value).trim().replace(',', '.'));
    if (isNaN(v)) { this._msg('Bitte einen Betrag eingeben.', true); return; }
    const rounded = art === 'satz' ? Math.round(v * 1000) / 1000 : Math.round(v * 100) / 100;
    btn.disabled = true;
    try {
      if (art === 'abschlag') {
        const mv = q('#monat').value;
        if (!mv) { this._msg('Bitte einen Monat wählen.', true); btn.disabled = false; return; }
        const [y, m] = mv.split('-').map(Number);
        const start = new Date(y, m - 1, 1, 0, 0, 0);
        const rows = await this._fetch(c.stat_abschlag, 'month');
        const map = {};
        rows.forEach((r) => { map[this._key(r.start)] = r.mean; });
        map[y + '-' + String(m).padStart(2, '0')] = rounded;
        await this._import(c.stat_abschlag, V + ' Abschlag Monat', false, [{ start: start.toISOString(), mean: rounded, min: rounded, max: rounded }]);
        let sum = 0;
        const stats = Object.keys(map).sort().map((k) => {
          const [yy, mm] = k.split('-').map(Number);
          sum = Math.round((sum + map[k]) * 100) / 100;
          return { start: new Date(yy, mm - 1, 1, 0, 0, 0).toISOString(), state: sum, sum: sum };
        });
        await this._import(c.stat_abschlag_gesamt, V + ' Abschlag Gesamt', true, stats);
        this._msg('Abschlag ' + String(m).padStart(2, '0') + '/' + y + ' gespeichert: ' + this._fmt(rounded), false);
      } else if (art === 'abrechnung') {
        const y = parseInt(q('#datum').value);
        if (isNaN(y) || y < 2000 || y > 2100) { this._msg('Bitte ein gültiges Jahr eingeben.', true); btn.disabled = false; return; }
        const start = new Date(y, 11, 31, 0, 0, 0);
        await this._import(c.stat_abrechnung, V + ' Abrechnung', false, [{ start: start.toISOString(), mean: rounded, min: rounded, max: rounded }]);
        this._msg('Abrechnung für ' + y + ' gespeichert: ' + this._fmt(rounded), false);
      } else {
        const dv = q('#sdatum').value;
        if (!dv) { this._msg('Bitte ein Datum wählen.', true); btn.disabled = false; return; }
        if (rounded <= 0 || rounded > 100) { this._msg('Der Satz muss zwischen 0 und 100 ct/kWh liegen.', true); btn.disabled = false; return; }
        const [y, m, d] = dv.split('-').map(Number);
        const start = new Date(y, m - 1, d, 0, 0, 0);
        await this._import(c.stat_satz, V + ' Vergütungssatz', false, [{ start: start.toISOString(), mean: rounded, min: rounded, max: rounded }], 'ct/kWh');
        this._msg('Vergütungssatz ab ' + dv + ' gespeichert: ' + this._fmtS(rounded), false);
      }
      setTimeout(() => { this._load(); window.dispatchEvent(new Event('ewa-updated')); }, 1500);
    } catch (e) {
      this._msg('Fehler: ' + (e.message || JSON.stringify(e)), true);
    }
    btn.disabled = false;
  }
  async _load() {
    try {
      const c = this._config;
      const mon = await this._fetch(c.stat_abschlag, 'month');
      const abr = await this._fetch(c.stat_abrechnung, 'day');
      const sat = await this._fetch(c.stat_satz, 'day');
      this._val = {}; this._last = null;
      mon.slice().sort((a, b) => a.start - b.start).forEach((r) => {
        this._val[this._key(r.start)] = r.mean; this._last = r.mean;
      });
      this._abr = abr;
      this._sat = sat.slice().sort((a, b) => b.start - a.start);
      this._render();
      const miss = [];
      if (!mon.length) miss.push(c.stat_abschlag);
      if (!abr.length) miss.push(c.stat_abrechnung);
      if (!sat.length) miss.push(c.stat_satz);
      if (miss.length) this._msg('Noch keine Daten in: ' + miss.join(', ') + '. Der erste Eintrag legt die Statistik an.', false);
    } catch (e) {
      this._msg('Laden fehlgeschlagen: ' + (e.message || JSON.stringify(e)), true);
    }
  }
  _render() {
    if (!this._val) return;
    const y = this._year;
    const yi = ewaYear(this._hass, this._config);
    const idx = yi.options.indexOf(String(y));
    const hasPrev = idx > 0; const hasNext = idx > -1 && idx < yi.options.length - 1;
    const vorgabe = Number(this._config.abschlag_vorgabe) > 0 ? Number(this._config.abschlag_vorgabe) : '';
    const mn = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    let mhtml = '';
    let run = 0;
    for (let m = 1; m <= 12; m++) {
      const k = y + '-' + String(m).padStart(2, '0');
      const has = this._val[k] !== undefined;
      if (has) run += this._val[k];
      const pre = has ? this._val[k] : (this._last !== null ? this._last : vorgabe);
      mhtml += '<tr class="click' + (has ? '' : ' empty') + '" data-k="' + k + '" data-v="' + pre + '"><td>' + mn[m - 1] + '</td><td class="n">' + (has ? this._fmt(this._val[k]) : '–') + '</td><td class="n">' + (has ? this._fmt(run) : '–') + '</td></tr>';
    }
    mhtml += '<tr class="tot"><td>Summe ' + y + '</td><td class="n"></td><td class="n">' + this._fmt(run) + '</td></tr>';
    const ahtml = this._abr.slice().reverse().map((r) => {
      const yr = new Date(r.start).getFullYear();
      return '<tr class="click" data-d="' + yr + '" data-v="' + r.mean + '"><td>' + yr + '</td><td class="n">' + this._fmt(r.mean) + '</td></tr>';
    }).join('');
    const shtml = this._sat.map((r) => {
      const ds = this._ds(r.start);
      return '<tr class="click" data-s="' + ds + '" data-v="' + r.mean + '"><td>ab ' + ds.split('-').reverse().join('.') + '</td><td class="n">' + this._fmtS(r.mean) + '</td></tr>';
    }).join('');
    this._r.querySelector('#lists').innerHTML =
      '<h3><button class="nav" id="prev"' + (hasPrev ? '' : ' disabled') + '>◀</button> Abschläge ' + y + ' <button class="nav" id="next"' + (hasNext ? '' : ' disabled') + '>▶</button></h3>' +
      '<table><tr><th>Monat</th><th class="n">Abschlag</th><th class="n">Summe ' + y + '</th></tr>' + mhtml + '</table>' +
      '<h3>Abrechnungen</h3><table><tr><th>Jahr</th><th class="n">Ausgleich</th></tr>' + (ahtml || '<tr><td colspan="2">Noch keine Einträge</td></tr>') + '</table>' +
      '<h3>Vergütungssätze</h3><table><tr><th>Gültig</th><th class="n">Satz</th></tr>' + (shtml || '<tr><td colspan="2">Noch kein Satz eingetragen</td></tr>') + '</table>' +
      '<div class="hint">Zeile antippen, um sie ins Formular zu übernehmen. Leere Monate (–) sind noch nicht eingetragen.</div>';
    this._r.querySelector('#prev').addEventListener('click', () => this._step(-1));
    this._r.querySelector('#next').addEventListener('click', () => this._step(1));
    this._r.querySelectorAll('tr.click').forEach((tr) => tr.addEventListener('click', () => {
      const q = (s) => this._r.querySelector(s);
      q('#betrag').value = String(tr.dataset.v).replace('.', ',');
      if (tr.dataset.k) { q('#art').value = 'abschlag'; q('#monat').value = tr.dataset.k; }
      else if (tr.dataset.s) { q('#art').value = 'satz'; q('#sdatum').value = tr.dataset.s; }
      else { q('#art').value = 'abrechnung'; q('#datum').value = tr.dataset.d; }
      this._mode();
    }));
  }
}

/* ---------- Auswertungs-Karte ---------- */
const EWA_STYLE = `<style>
  ha-card { padding: 16px; }
  :host([embedded]) ha-card { box-shadow: none; border: none; background: none; padding: 0; }
  .pos { color: var(--success-color, #2e9e6b); } .neg { color: var(--error-color, #d9534f); }
  h3 { margin: 0 0 8px; font-size: 0.95em; font-weight: 500; display: flex; align-items: center; gap: 10px; }
  button { font: inherit; border: 0; cursor: pointer; }
  button.nav { padding: 4px 12px; border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); }
  button:disabled { opacity: .4; cursor: default; }
  .sum { font-size: 0.95em; line-height: 1.6; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
  th, td { padding: 4px 6px; border-bottom: 1px solid var(--divider-color); text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  tr.cur td { background: var(--secondary-background-color); }
  tr.tot td { font-weight: 600; border-top: 2px solid var(--divider-color); }
  tr.res td { font-weight: 600; padding: 8px 6px; }
  tr.res td.lbl { text-align: left; font-weight: 400; }
  tr.res td.lbl small { display: block; color: var(--secondary-text-color); font-size: 0.82em; }
  .hint { font-size: 0.8em; color: var(--secondary-text-color); margin-top: 8px; }
</style>`;

/* ---------- Reiter Auswertung ---------- */
class EwaAuswertungCard extends HTMLElement {
  setConfig(c) {
    this._c = Object.assign({}, EWA_DEF, c || {});
    this._key = null;
    if (this._hass && this._r) { this._t = Date.now(); this._load(); }
  }
  getCardSize() { return 12; }
  connectedCallback() {
    this._ev = () => setTimeout(() => this._load(), 500);
    this._yev = () => { if (this._hass && this._r) this._load(); };
    window.addEventListener('ewa-updated', this._ev);
    window.addEventListener('ewa-year', this._yev);
  }
  disconnectedCallback() {
    window.removeEventListener('ewa-updated', this._ev);
    window.removeEventListener('ewa-year', this._yev);
  }
  set hass(h) {
    this._hass = h;
    if (!this._c) this._c = Object.assign({}, EWA_DEF);
    if (!this._r) {
      this._r = this.attachShadow({ mode: 'open' });
      this._r.innerHTML = EWA_STYLE + '<ha-card><div id="c">Lade…</div></ha-card>';
    }
    const key = String(ewaYear(h, this._c).year);
    if (key !== this._key || (Date.now() - (this._t || 0)) > 300000) {
      this._key = key; this._t = Date.now(); this._load();
    }
  }
  _step(d) {
    const yi = ewaYear(this._hass, this._c);
    const t = yi.options[yi.options.indexOf(String(yi.year)) + d];
    if (t) ewaSetYear(this._hass, this._c, t);
  }
  _f(v, d) { return Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  async _load() {
    const h = this._hass;
    const el = this._r.querySelector('#c');
    const C = this._c; const V = C.versorger || 'Versorger';
    try {
      if (!C.quelle) throw new Error('Bitte in der Kartenkonfiguration den Einspeise-Zähler (kWh) auswählen.');
      const yi = ewaYear(h, C);
      const y = yi.year;
      const idx = yi.options.indexOf(String(y));
      const hasPrev = idx > 0; const hasNext = idx > -1 && idx < yi.options.length - 1;
      const now = new Date(); const cy = now.getFullYear(); const cm = now.getMonth();
      const tib = C.quelle; const sAb = C.stat_abschlag; const sAbr = C.stat_abrechnung; const sSatz = C.stat_satz;
      const q = (ids, s, e, types, period) => h.callWS({ type: 'recorder/statistics_during_period', start_time: s.toISOString(), end_time: e.toISOString(), statistic_ids: ids, period: period, types: types });
      const [a, b, c, r] = await Promise.all([
        q([tib], new Date(y - 1, 0, 1), new Date(y + 1, 0, 1), ['change'], 'day'),
        q([sAb], new Date(y, 0, 1), new Date(y + 1, 0, 1), ['mean'], 'month'),
        q([sAbr], new Date(y, 0, 1), new Date(y + 1, 0, 1), ['mean'], 'month'),
        h.callWS({ type: 'recorder/statistics_during_period', start_time: '2020-01-01T00:00:00Z', statistic_ids: [sSatz], period: 'day', types: ['mean'] })
      ]);
      const rates = (r[sSatz] || []).filter((x) => x.mean !== null && x.mean !== undefined).sort((p, s) => p.start - s.start);
      const rateAt = (ms) => {
        if (!rates.length) return 0;
        let v = rates[0].mean;
        for (let i = 0; i < rates.length; i++) { if (rates[i].start <= ms) v = rates[i].mean; else break; }
        return v;
      };
      const curRate = rateAt(Date.now());
      const kwh = {}; const verg = {};
      (a[tib] || []).forEach((s) => {
        if (s.change === null || s.change === undefined) return;
        const d = new Date(s.start); const k = d.getFullYear() + '-' + d.getMonth();
        kwh[k] = (kwh[k] || 0) + s.change;
        verg[k] = (verg[k] || 0) + s.change * rateAt(s.start) / 100;
      });
      const ab = {};
      (b[sAb] || []).forEach((s) => { const d = new Date(s.start); if (d.getFullYear() === y && s.mean !== null && s.mean !== undefined) ab[d.getMonth()] = s.mean; });
      const abr = (c[sAbr] || []).filter((s) => new Date(s.start).getFullYear() === y && s.mean !== null && s.mean !== undefined && s.mean !== 0).map((s) => s.mean);
      const ausgleich = abr.length ? abr[abr.length - 1] : null;

      const counted = (m) => y < cy || (y === cy && m <= cm);
      let lastAb = 0;
      for (let m = 0; m < 12; m++) { if (ab[m] !== undefined) lastAb = ab[m]; }
      let kwhSum = 0, vergSum = 0, abSum = 0, abAll = 0, vergAll = 0;
      const rows = [];
      for (let m = 0; m < 12; m++) {
        const key = y + '-' + m;
        const k = kwh[key];
        const v = k !== undefined ? verg[key] : null;
        const abm = ab[m] !== undefined ? ab[m] : null;
        const cnt = counted(m);
        if (cnt && k !== undefined) { kwhSum += k; vergSum += v; }
        if (cnt && abm !== null) abSum += abm;
        abAll += abm !== null ? abm : lastAb;
        if (k !== undefined) vergAll += v;
        rows.push({ m: m, k: k, v: v, ab: abm, cnt: cnt });
      }
      const saldo = vergSum - abSum;
      let rest = 0;
      if (y === cy) { for (let m = cm + 1; m < 12; m++) { const pk = kwh[(y - 1) + '-' + m]; if (pk !== undefined) rest += pk * curRate / 100; } }
      const prog = (y === cy) ? vergSum + rest - abAll : (y < cy ? saldo : null);

      const sgn = (v) => (v >= 0 ? 'pos' : 'neg');
      const mn = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
      const tbl = rows.map((rw) => {
        const diff = (rw.cnt && rw.v !== null) ? rw.v - (rw.ab || 0) : null;
        return '<tr' + (y === cy && rw.m === cm ? ' class="cur"' : '') + '><td>' + mn[rw.m] + '</td><td>' + (rw.k !== undefined && rw.cnt ? this._f(rw.k, 0) : '–') + '</td><td>' + (rw.v !== null && rw.cnt ? this._f(rw.v, 2) + ' €' : '–') + '</td><td>' + (rw.ab !== null ? this._f(rw.ab, 2) + ' €' : '–') + '</td><td class="' + (diff !== null ? sgn(diff) : '') + '">' + (diff !== null ? this._f(diff, 2) + ' €' : '–') + '</td></tr>';
      }).join('');
      const endLbl = (y === cy) ? 'Stand heute' : 'Endstand ' + y;
      const saldoRow = '<tr class="res"><td class="lbl" colspan="3">Saldo ' + y + '<small>' + endLbl + ': ' + (saldo >= 0 ? 'Der Versorger (' + V + ') schuldet dir noch Geld' : 'Du hast mehr erhalten als vergütet') + '</small></td><td colspan="2" class="' + sgn(saldo) + '">' + this._f(Math.abs(saldo), 2) + ' € ' + (saldo >= 0 ? 'Guthaben' : 'Rückzahlung') + '</td></tr>';
      const progRow = '<tr class="res"><td class="lbl" colspan="3">Prognose Jahresende<small>' + (prog !== null ? (y === cy ? 'Restmonate wie im Vorjahr, alle 12 Abschläge' : 'Endsaldo mit allen 12 Abschlägen') : 'Jahr noch nicht begonnen') + '</small></td>' + (prog !== null ? '<td colspan="2" class="' + sgn(prog) + '">' + this._f(Math.abs(prog), 2) + ' € ' + (prog >= 0 ? 'Nachzahlung an dich' : 'Rückzahlung von dir') + '</td>' : '<td colspan="2">–</td>') + '</tr>';
      let html = '<h3><button class="nav" id="prev"' + (hasPrev ? '' : ' disabled') + '>◀</button> ' + (C.titel ? C.titel + ' ' : 'Auswertung ') + y + ' <button class="nav" id="next"' + (hasNext ? '' : ' disabled') + '>▶</button></h3>' +
        '<div class="sum"><b>Einspeisung ' + y + ':</b> ' + this._f(kwhSum, 0) + ' kWh<br><b>Aktueller Satz:</b> ' + (rates.length ? this._f(curRate, 2) + ' ct/kWh' : 'nicht eingetragen') + '<br><b>Vergütung:</b> ' + this._f(vergSum, 2) + ' €<br><b>' + V + '-Abschläge:</b> ' + this._f(abSum, 2) + ' €';
      if (ausgleich !== null) {
        const ges = abAll + ausgleich; const abw = ges - vergAll;
        html += '<br><b>' + V + '-Abrechnung:</b> Ausgleich ' + this._f(ausgleich, 2) + ' € (Gesamtvergütung ' + this._f(ges, 2) + ' €)<br><b>Abweichung zu meiner Berechnung:</b> <span class="' + sgn(abw) + '">' + this._f(abw, 2) + ' €</span>';
      } else if (y <= cy) {
        html += '<br><b>' + V + '-Abrechnung:</b> noch nicht eingetragen';
      }
      html += '</div><table><tr><th>Monat</th><th>kWh</th><th>Vergütung</th><th>Abschlag</th><th>Differenz</th></tr>' + tbl +
        '<tr class="tot"><td>Summe bis heute</td><td>' + this._f(kwhSum, 0) + '</td><td>' + this._f(vergSum, 2) + ' €</td><td>' + this._f(abSum, 2) + ' €</td><td class="' + sgn(saldo) + '">' + this._f(saldo, 2) + ' €</td></tr>' +
        saldoRow + progRow + '</table>' +
        '<div class="hint">Vergütung = kWh je Tag mal dem an dem Tag gültigen Satz. Differenz = Vergütung minus Abschlag. Positiv: ' + V + ' schuldet dir Geld. Der laufende Monat ist noch nicht komplett.</div>';
      el.innerHTML = html;
      this._r.querySelector('#prev').addEventListener('click', () => this._step(-1));
      this._r.querySelector('#next').addEventListener('click', () => this._step(1));
    } catch (e) {
      el.textContent = 'Auswertung fehlgeschlagen: ' + (e.message || JSON.stringify(e));
    }
  }
}

/* ---------- Karte mit Reitern Auswertung / Eingabe ---------- */
class EwaCombinedCard extends HTMLElement {
  static getConfigElement() {
    const e = document.createElement('einspeiseverguetung-karten-editor');
    return e;
  }
  static getStubConfig() { return Object.assign({}, EWA_DEF); }
  constructor() {
    super();
    this._tab = 'auswertung';
    this._config = Object.assign({}, EWA_DEF);
    const r = this.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>
      ha-card { padding: 16px; }
      h2 { margin: 0 0 8px; font-size: 1.1em; font-weight: 500; }
      .tabs { display: flex; gap: 6px; margin-bottom: 12px; }
      .tabs button { font: inherit; padding: 6px 16px; border-radius: 18px; border: 1px solid var(--divider-color); cursor: pointer; background: var(--card-background-color); color: var(--primary-text-color); }
      .tabs button.on { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: var(--primary-color); }
    </style>
    <ha-card><h2 id="t"></h2><div class="tabs" id="tabs"><button data-t="auswertung">Auswertung</button><button data-t="eingabe">Eingabe</button></div><div id="a"></div><div id="e"></div></ha-card>`;
    this._aus = document.createElement('ewa-tab-auswertung');
    this._ein = document.createElement('ewa-tab-eingabe');
    this._aus.setAttribute('embedded', ''); this._ein.setAttribute('embedded', '');
    r.querySelector('#a').appendChild(this._aus);
    r.querySelector('#e').appendChild(this._ein);
    r.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { this._tab = b.dataset.t; this._show(); }));
  }
  setConfig(c) {
    this._config = Object.assign({}, EWA_DEF, c || {});
    const inner = Object.assign({}, this._config, { titel: '' });
    this._aus.setConfig(inner);
    this._ein.setConfig(inner);
    const t = this.shadowRoot.querySelector('#t');
    t.textContent = this._config.titel || '';
    t.style.display = this._config.titel ? '' : 'none';
    this._show();
  }
  _show() {
    const r = this.shadowRoot;
    const withIn = this._config.eingabe_anzeigen !== false;
    if (!withIn) this._tab = 'auswertung';
    r.querySelector('#tabs').style.display = withIn ? '' : 'none';
    r.querySelector('#a').style.display = this._tab === 'auswertung' ? '' : 'none';
    r.querySelector('#e').style.display = this._tab === 'eingabe' ? '' : 'none';
    r.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === this._tab));
  }
  getCardSize() { return 12; }
  set hass(h) { this._hass = h; this._aus.hass = h; this._ein.hass = h; }
}

/* ---------- Karteneditor (vorhandene Statistik wählen oder neu anlegen) ---------- */
const EWA_ID_RE = /^(?!.*__)(?!_)[\da-z_]+(?<!_):(?!_)(?!.*__)[\da-z_]+(?<!_)$/;
const EWA_NEW = '__new__';
const EWA_STAT_BASE = {
  stat_abschlag: 'abschlag_monat',
  stat_abschlag_gesamt: 'abschlag_gesamt',
  stat_abrechnung: 'abrechnung',
  stat_satz: 'verguetung_satz'
};

class EwaKartenEditor extends HTMLElement {
  constructor() {
    super();
    this._cfg = Object.assign({}, EWA_DEF);
    this._ids = [];
    this._newMode = {};
    this.attachShadow({ mode: 'open' });
  }
  setConfig(c) {
    this._type = c && c.type;
    this._cfg = Object.assign({}, EWA_DEF, c || {});
    if (this._emitted && JSON.stringify(c) === this._emitted) return; // eigene Änderung, nichts neu aufbauen
    this._render();
  }
  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (this._forms) this._forms.forEach((f) => { f.hass = h; });
    if (first) this._loadIds();
  }
  async _loadIds() {
    try {
      const l = await this._hass.callWS({ type: 'recorder/list_statistic_ids' });
      this._ids = (l || []).filter((x) => String(x.statistic_id).includes(':') && x.source !== 'recorder');
    } catch (e) { this._ids = []; }
    this._render();
  }
  _emit(patch) {
    this._cfg = Object.assign({}, this._cfg, patch);
    const out = { type: this._type || 'custom:einspeiseverguetung-card' };
    Object.keys(this._cfg).forEach((k) => {
      if (k === 'type') return;
      const v = this._cfg[k];
      if (v !== '' && v !== null && v !== undefined) out[k] = v;
    });
    this._emitted = JSON.stringify(out);
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
  }
  _used(except) {
    const keys = ['stat_abschlag', 'stat_abschlag_gesamt', 'stat_abrechnung', 'stat_satz'];
    return keys.filter((k) => k !== except).map((k) => this._cfg[k]).filter(Boolean);
  }
  _suggest(key) {
    const known = ['stat_abschlag', 'stat_abrechnung', 'stat_satz', 'stat_abschlag_gesamt'].map((k) => this._cfg[k]).find((v) => v && String(v).includes(':'));
    const prefix = known ? String(known).split(':')[0] : 'einspeisung';
    const taken = new Set(this._ids.map((x) => x.statistic_id).concat(this._used(key)));
    let id = prefix + ':' + EWA_STAT_BASE[key]; let n = 2;
    while (taken.has(id)) { id = prefix + ':' + EWA_STAT_BASE[key] + '_' + n; n++; }
    return id;
  }
  _validate(key, id) {
    if (!EWA_ID_RE.test(id)) return 'Format: quelle:name, nur Kleinbuchstaben, Ziffern und Unterstriche (z. B. einspeisung:abschlag_monat).';
    if (id.split(':')[0] === 'recorder') return 'Die Quelle "recorder" ist nicht erlaubt.';
    if (this._ids.some((x) => x.statistic_id === id)) return 'Diese Statistik gibt es schon – bitte oben in der Liste auswählen.';
    if (this._used(key).includes(id)) return 'Diese ID wird bereits für ein anderes Feld verwendet.';
    return '';
  }
  _statField(key, label, help) {
    const wrap = document.createElement('div');
    wrap.className = 'fld';
    const cur = this._cfg[key] || '';
    const exists = this._ids.some((x) => x.statistic_id === cur);
    const sel = document.createElement('select');
    const add = (v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); };
    this._ids.forEach((x) => add(x.statistic_id, (x.name || x.statistic_id) + '  ·  ' + x.statistic_id));
    if (cur && !exists) add(cur, cur + '  (noch keine Daten)');
    add(EWA_NEW, '➕ Neu anlegen…');
    sel.value = this._newMode[key] ? EWA_NEW : (cur || EWA_NEW);
    wrap.innerHTML = '<label></label><div class="help"></div>';
    wrap.querySelector('label').textContent = label;
    wrap.querySelector('.help').textContent = help;
    wrap.insertBefore(sel, wrap.querySelector('.help'));
    sel.addEventListener('change', () => {
      if (sel.value === EWA_NEW) { this._newMode[key] = true; this._render(); return; }
      this._newMode[key] = false;
      this._emit({ [key]: sel.value });
      this._render();
    });
    if (this._newMode[key]) {
      const box = document.createElement('div');
      box.className = 'newbox';
      const inp = document.createElement('input');
      inp.type = 'text'; inp.value = this._newVal && this._newVal[key] !== undefined ? this._newVal[key] : this._suggest(key);
      const msg = document.createElement('div'); msg.className = 'msg';
      const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Übernehmen';
      const check = () => { const m = this._validate(key, inp.value.trim()); msg.textContent = m; btn.disabled = !!m; };
      inp.addEventListener('input', () => { this._newVal = this._newVal || {}; this._newVal[key] = inp.value; check(); });
      const apply = () => {
        const id = inp.value.trim();
        if (this._validate(key, id)) return;
        this._newMode[key] = false; if (this._newVal) delete this._newVal[key];
        this._emit({ [key]: id });
        this._render();
      };
      btn.addEventListener('click', apply);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
      box.appendChild(inp); box.appendChild(btn); box.appendChild(msg);
      const hint = document.createElement('div'); hint.className = 'help';
      hint.textContent = 'Neue Statistik: Sie wird mit dem ersten Eintrag im Reiter „Eingabe“ angelegt. Bis dahin zeigt die Karte „noch keine Daten“.';
      box.appendChild(hint);
      wrap.appendChild(box);
      setTimeout(check, 0);
    }
    return wrap;
  }
  _form(schema) {
    const f = document.createElement('ha-form');
    f.hass = this._hass; f.data = this._cfg; f.schema = schema;
    const fields = EWA_FIELDS();
    f.computeLabel = fields.computeLabel; f.computeHelper = fields.computeHelper;
    f.addEventListener('value-changed', (e) => { e.stopPropagation(); this._emit(e.detail.value); });
    this._forms.push(f);
    return f;
  }
  _render() {
    const r = this.shadowRoot;
    r.innerHTML = `<style>
      .fld { margin: 14px 0; }
      .fld label { display: block; font-size: 0.9em; margin-bottom: 4px; color: var(--primary-text-color); }
      select, input[type=text] { width: 100%; box-sizing: border-box; font: inherit; padding: 10px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }
      .help { font-size: 0.8em; color: var(--secondary-text-color); margin-top: 4px; }
      .newbox { margin-top: 8px; padding: 10px; border-left: 3px solid var(--primary-color); display: flex; flex-direction: column; gap: 6px; }
      .newbox button { align-self: flex-start; font: inherit; padding: 6px 14px; border-radius: 8px; border: 0; cursor: pointer; background: var(--primary-color); color: var(--text-primary-color, #fff); }
      .newbox button:disabled { opacity: .4; cursor: default; }
      .msg { font-size: 0.82em; color: var(--error-color, #d9534f); min-height: 1em; }
      h4 { margin: 18px 0 0; font-size: 0.95em; font-weight: 500; }
    </style>`;
    this._forms = [];
    const top = [
      { name: 'versorger', selector: { text: {} } },
      { name: 'titel', selector: { text: {} } }
    ];
    top.push({ name: 'quelle', selector: { entity: { domain: 'sensor' } } });
    top.push({ name: 'eingabe_anzeigen', selector: { boolean: {} } });
    r.appendChild(this._form(top));
    const h = document.createElement('h4'); h.textContent = 'Statistiken (vorhanden wählen oder neu anlegen)';
    r.appendChild(h);
    const help = 'Format quelle:name, z. B. einspeisung:abschlag_monat.';
    r.appendChild(this._statField('stat_abschlag', 'Statistik: Abschlag monatlich', help));
    r.appendChild(this._statField('stat_abschlag_gesamt', 'Statistik: Abschlag Gesamtsumme', help));
    r.appendChild(this._statField('stat_abrechnung', 'Statistik: Abrechnung (Ausgleich)', help));
    r.appendChild(this._statField('stat_satz', 'Statistik: Vergütungssatz (ct/kWh)', help));
    r.appendChild(this._form([{ name: 'abschlag_vorgabe', selector: { number: { min: 0, max: 10000, step: 0.01, mode: 'box', unit_of_measurement: '€' } } }]));
  }
}

/* ---------- Registrierung ---------- */
// Die Reiter sind interne Elemente; in der Kartenauswahl erscheint nur die Karte.
customElements.define('ewa-tab-eingabe', EwaEingabeCard);
customElements.define('ewa-tab-auswertung', EwaAuswertungCard);
customElements.define('einspeiseverguetung-karten-editor', EwaKartenEditor);
customElements.define('einspeiseverguetung-card', EwaCombinedCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'einspeiseverguetung-card',
  name: 'Einspeisevergütung',
  description: 'Auswertung (Saldo, Prognose, Monatstabelle) und Eingabe von Abschlägen, Abrechnung und Vergütungssatz'
});
console.info('%c EINSPEISEVERGÜTUNG-KARTE %c v' + EWA_VERSION, 'color:#fff;background:#2e9e6b;font-weight:700', '');
