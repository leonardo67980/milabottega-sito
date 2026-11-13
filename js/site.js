// ============================================================================
// Mila Bottega · pezzi comuni a tutte le pagine (menu, piè di pagina, schede,
// racconto con le foto, comparsa dei blocchi mentre si scorre…)
// ============================================================================
import { CONFIG } from './config.js';
import { CATEGORIE } from './prodotti.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const etsyUrl = (p) => (p && p.etsyUrl) || CONFIG.ETSY_URL;
const TIPO = { anteprima: 'Anteprima', illustrazione: 'Illustrazione' };
export const tipoTag = (t) => (TIPO[t] ? `<span class="tag-tipo">${TIPO[t]}</span>` : '');

const ARROW = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const etsyBtn = (p, cls = 'btn btn-primary', label = 'Ordina su Etsy') =>
  `<a class="${cls}" href="${esc(etsyUrl(p))}" target="_blank" rel="noopener" data-etsy>${label} ${ARROW}<span class="sr">(si apre in una nuova scheda)</span></a>`;

// ----------------------------------------------------------------------------
// Menu in alto e piè di pagina
// ----------------------------------------------------------------------------
export function mountNav({ home = false } = {}) {
  const h = $('#nav');
  if (!h) return;
  const links = [['collezione.html', 'Collezione'], ['crea.html', 'Crea il tuo'], ['colori.html', 'Colori'], ['laboratorio.html', 'Il laboratorio'], ['domande.html', 'Domande']];
  const here = location.pathname.split('/').pop() || 'index.html';
  h.className = 'nav';
  h.innerHTML = `
    <a class="nav-logo" href="${home ? '#top' : 'index.html'}" aria-label="Mila Bottega, pagina iniziale">
      <img class="logo-light" src="assets/brand/marchio_bianco.png" alt="" width="34" height="35">
      <img class="logo-dark" src="assets/brand/marchio.png" alt="" width="34" height="35">
      <span>MILA <b>BOTTEGA</b></span>
    </a>
    <nav class="nav-links" id="navLinks" aria-label="Menu principale">
      ${links.map(([u, t]) => `<a href="${u}"${u === here ? ' aria-current="page" class="is-here"' : ''}>${t}</a>`).join('')}
      <a class="btn btn-small nav-cta" href="${esc(CONFIG.ETSY_URL)}" target="_blank" rel="noopener">Ordina su Etsy ${ARROW}</a>
    </nav>
    <button class="nav-burger" aria-expanded="false" aria-controls="navLinks" aria-label="Apri il menu"><i></i><i></i></button>`;
  const burger = $('.nav-burger', h);
  const close = () => { h.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('menu-open'); };
  burger.addEventListener('click', () => {
    const open = !h.classList.contains('is-open');
    h.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
  });
  $$('.nav-links a', h).forEach((a) => a.addEventListener('click', close));
  addEventListener('keydown', (e) => e.key === 'Escape' && close());
  const onScroll = () => h.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

export function mountFooter() {
  const f = $('#footer');
  if (!f) return;
  const soc = (url, name) => `<a href="${esc(url)}" ${url === '#' ? 'data-placeholder' : 'target="_blank" rel="noopener"'}>${name}</a>`;
  f.className = 'footer layers-dark';
  f.innerHTML = `
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <img src="assets/brand/logo_bianco.png" alt="Mila Bottega" width="120" height="153" loading="lazy">
        <p>Oggetti personalizzati in 3D, stampati uno alla volta e rifiniti a mano in una piccola bottega di Pisa.</p>
      </div>
      <div>
        <h3>La collezione</h3>
        <ul>${CATEGORIE.map((c) => `<li><a href="collezione.html?cat=${encodeURIComponent(c)}">${esc(c)}</a></li>`).join('')}<li><a href="crea.html">Crea il tuo oggetto</a></li></ul>
      </div>
      <div>
        <h3>Scrivici</h3>
        <ul>
          <li><a href="mailto:${CONFIG.EMAIL}">${CONFIG.EMAIL}</a></li>
          <li>${soc(CONFIG.INSTAGRAM_URL, 'Instagram')}</li>
          <li>${soc(CONFIG.FACEBOOK_URL, 'Facebook')}</li>
          <li><a href="${esc(CONFIG.ETSY_URL)}" target="_blank" rel="noopener">Il negozio su Etsy</a></li>
        </ul>
      </div>
      <div>
        <h3>Buono a sapersi</h3>
        <p class="footer-note">Questo sito non vende: è la nostra vetrina. Gli ordini e i pagamenti si fanno su Etsy.</p>
        <p class="footer-note">Niente cookie, niente tracciamento, nessun dato raccolto: qui si guarda e basta.</p>
      </div>
    </div>
    <div class="wrap footer-legal">
      <span>Mila Bottega · Oggetti stampati in 3D in Italia</span>
      <span>I colori a schermo sono indicativi. I marchi citati appartengono ai rispettivi proprietari.</span>
      <a class="lab-link" href="codice.html" rel="nofollow">Area laboratorio</a>
    </div>`;
}

/** I link social «segnaposto» (href="#") non portano da nessuna parte: lo diciamo */
export function initPlaceholders() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-placeholder]');
    if (!a) return;
    e.preventDefault();
    toast('La pagina social arriva presto. Intanto scrivici a ' + CONFIG.EMAIL);
  });
}

export const socialLink = (label = 'Seguici su Instagram', cls = 'link') => {
  const u = CONFIG.INSTAGRAM_URL;
  return `<a class="${cls}" href="${esc(u)}" ${u === '#' ? 'data-placeholder' : 'target="_blank" rel="noopener"'}>${label}</a>`;
};
export const avvisamiLink = (p, cls = 'btn btn-small btn-line') =>
  `<a class="${cls}" href="mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent('Avvisami: ' + p.nomeBreve)}&body=${encodeURIComponent('Ciao, avvisatemi quando «' + p.nome + '» è disponibile. Grazie!')}">Avvisami</a>`;

// ----------------------------------------------------------------------------
// Messaggino che compare in basso
// ----------------------------------------------------------------------------
let toastT;
export function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('is-on'), 3200);
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* metodo di riserva */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-999px;top:0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

// ----------------------------------------------------------------------------
// Comparsa dei blocchi mentre si scorre + indicatore «strato n / tot»
// ----------------------------------------------------------------------------
export function initReveals(root = document) {
  const items = $$('[data-reveal]:not(.is-in)', root);
  if (reduced() || !('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('is-in')); return; }
  const io = new IntersectionObserver((en) => en.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((i) => io.observe(i));
}

export function initLayerMeter() {
  const m = document.createElement('div');
  m.className = 'meter';
  m.setAttribute('aria-hidden', 'true');
  m.innerHTML = '<span class="meter-bar"><i></i></span><span class="meter-txt">strato <b>001</b>/240</span>';
  document.body.appendChild(m);
  const bar = $('i', m), num = $('b', m);
  let tick = false;
  const upd = () => {
    tick = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const k = max > 0 ? Math.min(1, scrollY / max) : 0;
    bar.style.transform = `scaleX(${k})`;
    num.textContent = String(Math.max(1, Math.round(k * 240))).padStart(3, '0');
    m.classList.toggle('is-done', k > 0.995);
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
}

/** Scorrimento morbido verso un blocco della pagina, senza sporcare l'indirizzo */
export function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-placeholder')) return;
    const id = a.getAttribute('href').slice(1);
    const t = id ? document.getElementById(id) : null;
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  });
}

// ----------------------------------------------------------------------------
// Scheda prodotto (per la Collezione)
// ----------------------------------------------------------------------------
export function productCard(p) {
  const big = false;
  const ok = p.stato === 'disponibile';
  return `
  <article class="card ${ok ? 'is-live' : 'is-soon'} ${big ? 'card-big' : ''}" data-cat="${esc(p.categoria)}" data-reveal>
    <a class="card-media" href="prodotto.html?p=${p.id}" tabindex="-1" aria-hidden="true">
      <img src="${esc(p.copertina.src)}" alt="" loading="lazy" decoding="async">
      ${tipoTag(p.copertina.tipo)}
    </a>
    <div class="card-body">
      <p class="card-meta"><span class="cat">${esc(p.categoria)}</span><span class="stato ${ok ? 'ok' : 'soon'}">${ok ? 'Disponibile su Etsy' : 'In arrivo'}</span></p>
      <h3><a href="prodotto.html?p=${p.id}">${esc(p.nomeBreve)}</a></h3>
      <p class="card-txt">${esc(p.breve)}</p>
      <p class="card-cta">
        <a class="btn btn-small ${ok ? 'btn-green' : 'btn-line'}" href="prodotto.html?p=${p.id}">${ok ? 'Scopri e personalizza' : (p.configuratore ? 'Prova l\'anteprima' : 'Dai un\'occhiata')}</a>
        ${ok ? etsyBtn(p, 'link', 'Ordina su Etsy') : avvisamiLink(p, 'link') + socialLink('Seguici su Instagram', 'link')}
      </p>
    </div>
  </article>`;
}

// ----------------------------------------------------------------------------
// Il racconto con le foto (a sinistra la foto resta ferma, a destra scorrono i capitoli)
// ----------------------------------------------------------------------------
export function storyHTML(p) {
  if (!p.storia?.length) return '';
  return `
  <div class="story" data-story>
    <div class="story-stage" aria-hidden="true">
      <div class="story-frame">
        ${p.storia.map((s, i) => `<img class="${i === 0 ? 'is-on' : ''}" src="${esc(s.foto)}" alt="" loading="lazy" decoding="async">`).join('')}
        <span class="story-count"><b>01</b> / ${String(p.storia.length).padStart(2, '0')}</span>
      </div>
    </div>
    <div class="story-chapters">
      ${p.storia.map((s, i) => `
      <article class="chapter" data-i="${i}">
        <img class="chapter-img" src="${esc(s.foto)}" alt="${esc(s.alt)}" loading="lazy" decoding="async">
        <p class="chapter-n">${String(i + 1).padStart(2, '0')}</p>
        <h3>${esc(s.titolo)}</h3>
        <p>${esc(s.testo)}</p>
      </article>`).join('')}
    </div>
  </div>`;
}
export function initStory(root = document) {
  $$('[data-story]', root).forEach((st) => {
    const imgs = $$('.story-frame img', st), chapters = $$('.chapter', st), count = $('.story-count b', st);
    const set = (i) => {
      imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
      chapters.forEach((c, k) => c.classList.toggle('is-on', k === i));
      count.textContent = String(i + 1).padStart(2, '0');
    };
    set(0);
    const io = new IntersectionObserver((en) => en.forEach((e) => e.isIntersecting && set(+e.target.dataset.i)), { rootMargin: '-45% 0px -45% 0px' });
    chapters.forEach((c) => io.observe(c));
  });
}

// ----------------------------------------------------------------------------
// Foto in grande
// ----------------------------------------------------------------------------
export function initLightbox() {
  let dlg;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    if (!b) return;
    e.preventDefault();
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'lightbox';
      dlg.innerHTML = '<form method="dialog"><button class="lightbox-x" aria-label="Chiudi">Chiudi</button></form><img alt=""><p></p>';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
    }
    const img = b.querySelector('img');
    $('img', dlg).src = b.dataset.zoom;
    $('img', dlg).alt = img?.alt || '';
    $('p', dlg).textContent = (b.dataset.tipo && TIPO[b.dataset.tipo] ? TIPO[b.dataset.tipo] + ' · ' : '') + (img?.alt || '');
    dlg.showModal();
  });
}

/** Tutto ciò che serve a ogni pagina */
export function initSite(opts = {}) {
  document.documentElement.classList.add('js');
  mountNav(opts);
  mountFooter();
  initPlaceholders();
  initAnchors();
  initLightbox();
  if (opts.meter !== false) initLayerMeter();
  initReveals();
}
