// ============================================================================
// Mila Bottega · pagina di un prodotto (prodotto.html?p=<id>)
// Tutto quello che si vede viene dal catalogo in js/prodotti.js
// ============================================================================
import { CONFIG, codeFromHash } from './config.js';
import { PRODOTTI, prodotto, prodottiOrdinati } from './prodotti.js';
import { $, $$, esc, initSite, initReveals, productCard, storyHTML, initStory, etsyBtn, avvisamiLink, socialLink, tipoTag, toast, reduced } from './site.js';

initSite();

const id = new URLSearchParams(location.search).get('p');
const p = prodotto(id);
const main = $('#pagina');

if (!p) {
  document.title = 'Prodotto non trovato · Mila Bottega';
  main.innerHTML = `
    <section class="section wrap pad-top">
      <p class="eyebrow">Ops</p>
      <h1 class="h2">Questo oggetto non c'è <em>(o non c'è più).</em></h1>
      <p class="lead">Ecco tutto quello che facciamo:</p>
      <div class="cards">${prodottiOrdinati().map((x) => productCard(x)).join('')}</div>
    </section>`;
  initReveals();
} else {
  const ok = p.stato === 'disponibile';
  document.title = `${p.nome} · Mila Bottega`;
  $('meta[name=description]')?.setAttribute('content', p.breve);
  const others = prodottiOrdinati().filter((x) => x.id !== p.id).slice(0, 3);
  const cta = ok
    ? `${p.configuratore ? '<a class="btn btn-green" href="#configuratore">Crea il tuo</a>' : ''}${etsyBtn(p, p.configuratore ? 'btn btn-line' : 'btn btn-green')}`
    : `${p.configuratore ? '<a class="btn btn-green" href="#configuratore">Prova l\'anteprima</a>' : ''}${avvisamiLink(p, 'btn btn-line')}${socialLink('Seguici su Instagram', 'link')}`;

  main.innerHTML = `
    <section class="phero wrap">
      <div class="phero-txt">
        <p class="crumbs"><a href="collezione.html">Collezione</a> <span aria-hidden="true">/</span> ${esc(p.categoria)}</p>
        <p class="card-meta"><span class="stato ${ok ? 'ok' : 'soon'}">${ok ? 'Disponibile su Etsy' : 'In arrivo'}</span></p>
        <h1>${esc(p.nome)}</h1>
        <p class="lead">${esc(p.breve)}</p>
        ${p.lungo.map((t) => `<p>${esc(t)}</p>`).join('')}
        <div class="phero-cta">${cta}</div>
        ${p.nota ? `<p class="nota">${esc(p.nota)}</p>` : ''}
      </div>
      <div class="phero-gallery">
        <button type="button" class="phero-main" data-zoom="${esc(p.foto[0].src)}" data-tipo="${esc(p.foto[0].tipo)}" aria-label="Ingrandisci la foto">
          <img src="${esc(p.foto[0].src)}" alt="${esc(p.foto[0].alt)}" fetchpriority="high">
          ${tipoTag(p.foto[0].tipo)}
        </button>
        ${p.foto.length > 1 ? `<div class="thumbs" role="list">${p.foto.map((f, i) => `
          <button type="button" role="listitem" class="${i === 0 ? 'is-on' : ''}" data-i="${i}" aria-label="Foto ${i + 1}: ${esc(f.alt)}">
            <img src="${esc(f.src)}" alt="" loading="lazy" decoding="async">${f.tipo !== 'foto' ? '<i>ant.</i>' : ''}
          </button>`).join('')}</div>` : ''}
      </div>
    </section>

    ${p.storia?.length ? `<section class="section wrap"><p class="eyebrow" data-reveal>La storia</p><h2 class="h2" data-reveal>Com'è fatto, <em>da vicino.</em></h2>${storyHTML(p)}</section>` : ''}

    ${p.varianti?.length ? `<section class="section wrap"><p class="eyebrow" data-reveal>I modelli</p><h2 class="h2" data-reveal>Quale fa <em>per te?</em></h2>
      <div class="varianti">${p.varianti.map((v) => `
        <article class="variante" data-reveal>
          <img src="${esc(v.foto)}" alt="${esc(v.alt)}" loading="lazy" decoding="async">
          <div><p class="variante-n">${esc(v.nome)}</p><h3>${esc(v.forma)}</h3><p class="variante-m">${esc(v.misure)}</p><p>${esc(v.testo)}</p>
          ${p.configuratore ? `<button type="button" class="btn btn-small btn-line" data-set='${esc(JSON.stringify(v.set))}'>Prova il ${esc(v.nome)}</button>` : ''}</div>
        </article>`).join('')}</div></section>` : ''}

    ${p.configuratore ? `
    <section class="cfg-section layers-dark" id="configuratore">
      <div class="wrap">
        <p class="eyebrow eyebrow-light">${ok ? 'Configuratore' : 'Anteprima'}</p>
        <h2 class="h2">${ok ? 'Crea il tuo, <em>adesso.</em>' : 'Intanto, <em>provalo.</em>'}</h2>
        <p class="lead">Scegli, guarda in 3D, prendi il codice. È solo un'anteprima: non compri niente da qui.</p>
        <div id="cfg" class="cfg"><p class="cfg-loading">Sto preparando l'anteprima…</p></div>
      </div>
    </section>` : ''}

    <section class="section wrap details">
      <div>
        <p class="eyebrow" data-reveal>In breve</p>
        <h2 class="h2" data-reveal>I dettagli</h2>
      </div>
      <dl class="dl" data-reveal>${p.dettagli.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    </section>

    ${p.faq?.length ? `<section class="section wrap faq-wrap"><div><p class="eyebrow" data-reveal>Domande</p><h2 class="h2" data-reveal>Buono <em>a sapersi</em></h2></div>
      <div class="faq">${p.faq.map(([q, a]) => `<details data-reveal><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>` : ''}

    <section class="section wrap">
      <p class="eyebrow" data-reveal>Continua a guardare</p>
      <h2 class="h2" data-reveal>Altro dalla <em>bottega</em></h2>
      <div class="cards cards-3">${others.map((x) => productCard(x)).join('')}</div>
    </section>`;

  // galleria
  const mainBtn = $('.phero-main'), thumbs = $('.thumbs');
  thumbs?.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const f = p.foto[+b.dataset.i];
    $$('button', thumbs).forEach((x) => x.classList.toggle('is-on', x === b));
    mainBtn.dataset.zoom = f.src; mainBtn.dataset.tipo = f.tipo;
    const img = $('img', mainBtn);
    img.src = f.src; img.alt = f.alt;
    $('.tag-tipo', mainBtn)?.remove();
    mainBtn.insertAdjacentHTML('beforeend', tipoTag(f.tipo));
  });

  initStory(main);
  initReveals();

  // configuratore
  const cfgRoot = $('#cfg');
  if (cfgRoot) {
    let pr = null;
    const ensure = () => (pr ||= Promise.all([import('./configuratore.js'), import('../configuratori/index.js')]).then(async ([m, reg]) => {
      const plugin = await reg.loadPlugin(p.configuratore);
      return m.mountConfigurator(cfgRoot, { plugin, product: p, initial: codeFromHash(), useHash: true });
    }).catch((e) => { console.error(e); cfgRoot.innerHTML = '<p class="cfg-error">L\'anteprima non riesce a partire su questo dispositivo.</p>'; }));
    if (codeFromHash()) ensure().then((api) => { if (api?.loadedFromCode) { $('#configuratore').scrollIntoView(); toast('Ecco l\'oggetto del link: puoi cambiarlo come vuoi.'); } });
    else if (location.hash === '#configuratore') ensure();
    const io = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) { io.disconnect(); ensure(); } }, { rootMargin: '600px' });
    io.observe(cfgRoot);
    main.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-set]');
      if (!b) return;
      const api = await ensure();
      api?.patch(JSON.parse(b.dataset.set));
      $('#configuratore').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    });
  }
}
