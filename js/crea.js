// ============================================================================
// Mila Bottega · «Crea il tuo oggetto»: si sceglie l'oggetto, poi parte il suo
// configuratore. Gli oggetti con un configuratore si prendono dal catalogo
// (js/prodotti.js, voce «configuratore»); gli altri compaiono come «presto».
// ============================================================================
import { codeFromHash, unpackCode } from './config.js';
import { PRODOTTI, prodotto, prodottoPerConfiguratore } from './prodotti.js';
import { $, $$, esc, initSite, initReveals, toast, tipoTag } from './site.js';
import { pluginIdForPrefix, loadPlugin } from '../configuratori/index.js';

initSite();

const hub = $('#hub'), cfgRoot = $('#cfg'), now = $('#hubNow');
const withCfg = PRODOTTI.filter((p) => p.configuratore);
// qualche oggetto senza configuratore, per far vedere cosa arriverà
const soon = PRODOTTI.filter((p) => !p.configuratore).slice(0, Math.max(0, 6 - withCfg.length));

hub.innerHTML = withCfg.map((p) => `
  <button type="button" class="hub-card" data-p="${p.id}" aria-pressed="false">
    <span class="hub-img"><img src="${esc(p.copertina.src)}" alt="" loading="lazy" decoding="async">${tipoTag(p.copertina.tipo)}</span>
    <b>${esc(p.nomeBreve)}</b>
    <small>${p.stato === 'disponibile' ? 'Si può ordinare su Etsy' : 'In arrivo · prova l\'anteprima'}</small>
  </button>`).join('') + soon.map((p) => `
  <a class="hub-card is-soon" href="prodotto.html?p=${p.id}">
    <span class="hub-img"><img src="${esc(p.copertina.src)}" alt="" loading="lazy" decoding="async"></span>
    <b>${esc(p.nomeBreve)}</b>
    <small>Configuratore presto</small>
  </a>`).join('');

// da dove si parte: codice nel link → prodotto chiesto (?p=) → primo della lista
let code = codeFromHash(), startId = null;
if (code) {
  const u = unpackCode(code), pid = u.ok ? pluginIdForPrefix(u.prefix) : null;
  startId = pid ? prodottoPerConfiguratore(pid)?.id : null;
  if (!startId) code = null;
}
const asked = prodotto(new URLSearchParams(location.search).get('p'));
if (!startId && asked?.configuratore) startId = asked.id;
let pending = null;
try { pending = JSON.parse(sessionStorage.getItem('mb-patch') || 'null'); sessionStorage.removeItem('mb-patch'); } catch {}

let current = null, token = 0;
async function open(id, initial = null) {
  const p = prodotto(id);
  if (!p || current === id) return;
  current = id;
  const my = ++token;
  $$('.hub-card[data-p]', hub).forEach((b) => { const on = b.dataset.p === id; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
  now.innerHTML = `Stai creando: <b>${esc(p.nome)}</b> · <a class="link link-light" href="prodotto.html?p=${p.id}">vedi la scheda</a>`;
  cfgRoot._cfg?.viewer?.dispose();
  cfgRoot.className = 'cfg';
  cfgRoot.innerHTML = '<p class="cfg-loading">Sto preparando l\'anteprima…</p>';
  if (!initial) history.replaceState(null, '', location.pathname + '?p=' + id);
  try {
    const [m, plugin] = await Promise.all([import('./configuratore.js'), loadPlugin(p.configuratore)]);
    if (my !== token) return;
    const api = await m.mountConfigurator(cfgRoot, { plugin, product: p, initial, useHash: true });
    if (my !== token) return;
    if (api.loadedFromCode) toast('Ecco l\'oggetto del link: puoi cambiarlo come vuoi.');
    if (pending) {
      // una scelta portata da un'altra pagina (es. un colore): si applica se questo oggetto ce l'ha
      const ok = Object.fromEntries(Object.entries(pending).filter(([k]) => k in api.state));
      pending = null;
      if (Object.keys(ok).length) api.patch(ok);
    }
  } catch (e) {
    console.error(e);
    cfgRoot.innerHTML = '<p class="cfg-error">L\'anteprima non riesce a partire su questo dispositivo. Puoi comunque ordinare su Etsy e scriverci lì come lo vuoi.</p>';
  }
}
hub.addEventListener('click', (e) => { const b = e.target.closest('.hub-card[data-p]'); if (b) open(b.dataset.p); });
open(startId || withCfg[0]?.id, code);
initReveals();
