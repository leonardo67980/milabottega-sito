// ============================================================================
// Mila Bottega · pagine: iniziale, collezione, colori, laboratorio, domande
// (ogni blocco parte solo se nella pagina c'è il suo pezzo)
// ============================================================================
import { CONFIG, FILAMENTS, codeFromHash, luminance } from './config.js';
import { CATEGORIE, CATEGORIE_TESTI, prodottiOrdinati, prodottiDi } from './prodotti.js';
import { $, $$, esc, initSite, initReveals, productCard, tipoTag } from './site.js';

initSite({ home: document.body.classList.contains('home') });

// pulsanti Etsy scritti nell'HTML
$$('a[data-etsy]:not([href])').forEach((a) => { a.href = CONFIG.ETSY_URL; a.target = '_blank'; a.rel = 'noopener'; });

// un link con un codice (#c=…) aperto su una pagina senza configuratore: si va a «Crea il tuo»
if (codeFromHash()) location.replace('crea.html' + location.hash);

/** Si porta una scelta (es. un colore) alla pagina «Crea il tuo» */
function goCrea(patch) {
  try { sessionStorage.setItem('mb-patch', JSON.stringify(patch)); } catch {}
  location.href = 'crea.html';
}

// ---------------------------------------------------------------- vetrina 3D della copertina
const heroEl = $('#hero3d');
if (heroEl) {
  const start = () => import('./hero.js').then((m) => m.initHero(heroEl, {
    onScene({ name, what }) {
      const n = $('#heroName'), d = $('#heroDesc');
      if (n) n.textContent = name;
      if (d) d.textContent = what;
    },
  })).then((v) => { if (!v) heroEl.classList.add('no-webgl'); }).catch((e) => { console.error(e); heroEl.classList.add('no-webgl'); });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 600 }); else setTimeout(start, 60);
}

// ---------------------------------------------------------------- prima pagina: la collezione per categoria
const rows = $('#catRows');
if (rows) {
  rows.innerHTML = CATEGORIE.map((c) => {
    const list = prodottiDi(c);
    if (!list.length) return '';
    return `
    <section class="catrow" data-reveal aria-label="${esc(c)}">
      <header class="catrow-head">
        <h3>${esc(c)}</h3>
        <p>${esc(CATEGORIE_TESTI[c] || '')}</p>
        <a class="link" href="collezione.html?cat=${encodeURIComponent(c)}">Vedi ${list.length === 1 ? 'la scheda' : 'tutti e ' + list.length}</a>
      </header>
      <div class="catrow-list">
        ${list.slice(0, 4).map((p) => `
        <a class="mini" href="prodotto.html?p=${p.id}">
          <span class="mini-img"><img src="${esc(p.copertina.src)}" alt="${esc(p.copertina.alt)}" loading="lazy" decoding="async">${tipoTag(p.copertina.tipo)}</span>
          <b>${esc(p.nomeBreve)}</b>
          <span class="stato ${p.stato === 'disponibile' ? 'ok' : 'soon'}">${p.stato === 'disponibile' ? 'Disponibile' : 'In arrivo'}</span>
        </a>`).join('')}
      </div>
    </section>`;
  }).join('');
}

// ---------------------------------------------------------------- pagina collezione
const grid = $('#collezioneGrid'), filters = $('#collezioneFiltri');
if (grid) {
  const list = prodottiOrdinati();
  grid.innerHTML = list.map((p) => productCard(p)).join('');
  const cats = CATEGORIE.filter((c) => list.some((p) => p.categoria === c));
  const want = new URLSearchParams(location.search).get('cat');
  const start = cats.includes(want) ? want : 'Tutti';
  filters.innerHTML = ['Tutti', ...cats].map((c) => `<button type="button" class="chip" aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  const apply = (cat) => {
    $$('button', filters).forEach((x) => { const on = x.dataset.cat === cat; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    $$('.card', grid).forEach((c) => {
      const on = cat === 'Tutti' || c.dataset.cat === cat;
      c.hidden = !on;
      if (on) c.classList.add('is-in');
    });
  };
  filters.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) apply(b.dataset.cat); });
  apply(start);
}

// ---------------------------------------------------------------- i nostri colori (bobine)
const spools = $('#spools');
if (spools) {
  spools.innerHTML = FILAMENTS.map((f, i) => `
    <button type="button" class="spool ${luminance(f.hex) > 0.6 ? 'is-light' : ''} ${f.speckle ? 'is-speckle' : ''}" style="--c:${f.hex};--d:${(i % 11) * 40}ms" data-i="${i}" aria-pressed="false" data-reveal>
      <span class="spool-disc" aria-hidden="true"><i></i></span>
      <span class="spool-name">${esc(f.name)}</span>
    </button>`).join('');
  const bar = $('#spoolBar'), nameEl = $('#spoolName');
  let sel = null;
  spools.addEventListener('click', (e) => {
    const b = e.target.closest('.spool');
    if (!b) return;
    sel = +b.dataset.i;
    $$('.spool', spools).forEach((s) => { s.classList.toggle('is-on', s === b); s.setAttribute('aria-pressed', String(s === b)); });
    nameEl.textContent = FILAMENTS[sel].name;
    bar.style.setProperty('--c', FILAMENTS[sel].hex);
    bar.hidden = false;
  });
  bar?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-use]');
    if (b && sel !== null) goCrea({ [b.dataset.use]: sel });
  });
}

initReveals();
