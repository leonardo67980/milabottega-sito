// ============================================================================
// Mila Bottega · motore del configuratore (uguale per tutti i prodotti)
// Riceve un «plugin» (configuratori/<nome>.js) e costruisce da solo:
// comandi, anteprima 3D, codice, riepilogo, link da condividere.
// È solo un'anteprima: non crea file e non vende niente.
// ============================================================================
import { CONFIG, FILAMENTS, FONTS, fil, unpackCode, codeFromHash } from './config.js';
import { Viewer3D, loadFonts, reducedMotion } from './cover3d.js';
import { $, $$, esc, toast, copyText, etsyUrl, etsyBtn, avvisamiLink, socialLink } from './site.js';

let uid = 0;

function controlHTML(c, id) {
  const lab = `<div class="ctl-head"><label class="ctl-label" ${['text', 'range'].includes(c.type) ? `for="${id}"` : `id="${id}-l"`}>${esc(c.label)}</label><span class="ctl-val" data-val></span></div>`;
  switch (c.type) {
    case 'segment':
      return `${lab}<div class="seg" role="radiogroup" aria-labelledby="${id}-l">${c.options.map((o) =>
        `<button type="button" role="radio" data-v="${esc(o.v)}"><b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>`;
    case 'text':
      return `${lab}<input class="inp" id="${id}" type="text" maxlength="${c.max}" placeholder="${esc(c.placeholder || '')}" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done">`;
    case 'font':
      return `${lab}<div class="fonts" role="radiogroup" aria-labelledby="${id}-l">${FONTS.map((f, i) =>
        `<button type="button" role="radio" data-v="${i}" style="font-family:${esc(f.family)};font-weight:${f.weight}"><span>${esc(f.name)}</span></button>`).join('')}</div>`;
    case 'color':
      return `${lab}<div class="swatches" role="radiogroup" aria-labelledby="${id}-l">${FILAMENTS.map((f, i) =>
        `<button type="button" role="radio" data-v="${i}" style="--c:${f.hex}" title="${esc(f.name)}" aria-label="${esc(f.name)}"></button>`).join('')}</div>`;
    case 'tiles':
      return `${lab}<div class="tiles" role="radiogroup" aria-labelledby="${id}-l">${c.options.map((o) =>
        `<button type="button" role="radio" data-v="${esc(o.v)}"><canvas width="132" height="88" aria-hidden="true"></canvas><span>${esc(o.label)}</span></button>`).join('')}</div>`;
    case 'range':
      return `${lab}<div class="rng"><small>${esc(c.lo || '')}</small><input id="${id}" type="range" min="${c.min}" max="${c.max}" step="1"><small>${esc(c.hi || '')}</small></div>`;
    case 'seed':
      return `${lab}<button type="button" class="btn btn-small btn-ghost-dark" data-seed>
        <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.500M4 20v-4.5h4.500" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${esc(c.button || 'Cambia')}</button>`;
    case 'toggle':
      return `<label class="tog"><input type="checkbox" id="${id}"><i aria-hidden="true"></i><span>${esc(c.label)}</span></label>`;
    default:
      return '';
  }
}

/**
 * Monta il configuratore dentro a root.
 * opts: { plugin, product, initial (codice o null), useHash (scrive #c=CODICE nell'indirizzo) }
 */
export async function mountConfigurator(root, { plugin, product = null, initial = null, useHash = true } = {}) {
  const n = ++uid;
  const state = plugin.defaults();
  const live = !product || product.stato === 'disponibile';

  const tryCode = (code) => {
    const u = unpackCode(code);
    if (!u.ok || !plugin.prefixes.includes(u.prefix)) return false;
    const d = plugin.decode(u);
    if (!d.ok) return false;
    Object.assign(state, d.state);
    return true;
  };
  let loadedFromCode = initial ? tryCode(initial) : false;

  root.classList.add('cfg');
  root.innerHTML = `
    <div class="cfg-stage">
      <div class="cfg-view" data-view role="img" aria-label="Anteprima in 3D del tuo oggetto"></div>
      <div class="cfg-stage-ui">
        <span class="cfg-hint"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12h8M5 9l-3 3 3 3M19 9l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Trascina per girarlo</span>
        <button type="button" class="chip" data-reset>Vista iniziale</button>
        <button type="button" class="chip" data-flip>Guarda il retro</button>
      </div>
    </div>
    <div class="cfg-panel">
      <div class="cfg-controls">
        ${plugin.controls.map((c, i) => `<div class="ctl ctl-${c.type}" data-key="${c.key}">${controlHTML(c, `cfg${n}-${i}`)}</div>`).join('')}
        <button type="button" class="btn btn-small btn-ghost-dark cfg-rand" data-rand>
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.900 5.600L19.500 10l-5.600 1.900L12 17.500l-1.900-5.600L4.500 10l5.600-1.400z" fill="currentColor"/></svg> Sorprendimi</button>
      </div>
      <div class="ticket" aria-live="polite">
        <p class="ticket-k">Il tuo codice</p>
        <output class="ticket-code" data-code></output>
        <p class="ticket-sum" data-sum></p>
        <ul class="ticket-warn" data-warn></ul>
        <div class="ticket-btns">
          <button type="button" class="btn btn-primary" data-copy>Copia il codice</button>
          ${live ? etsyBtn(product, 'btn btn-light', 'Ordina su Etsy') : `<span class="soon-pill">In arrivo su Etsy</span>`}
        </div>
        <button type="button" class="link link-light" data-share>Copia il link per farlo vedere a qualcuno</button>
        ${live ? `
        <ol class="steps3">
          <li><b>Crea qui</b> il tuo oggetto: è un'anteprima, giocaci quanto vuoi.</li>
          <li><b>Copia il codice</b> con il pulsante qui sopra.</li>
          <li><b>Su Etsy</b> scegli il prodotto e incolla il codice nel campo «personalizzazione».</li>
        </ol>
        <p class="ticket-note">Dopo l'ordine, prima di stampare ti mandiamo la bozza: si parte solo quando ti piace.</p>`
        : `<p class="ticket-note">Questo prodotto non è ancora in vendita: l'anteprima serve a farti un'idea. Tieni da parte il codice, e fatti avvisare quando arriva. ${product ? avvisamiLink(product, 'link link-light') : ''} ${socialLink('Seguici su Instagram', 'link link-light')}</p>`}
      </div>
    </div>`;

  const ctlEls = $$('.ctl', root);
  const codeEl = $('[data-code]', root), sumEl = $('[data-sum]', root), warnEl = $('[data-warn]', root);
  const viewEl = $('[data-view]', root);

  let preview = null, viewer = null, metrics = {}, paintQueued = false, hashT = null, thumbKey = '';

  const code = () => plugin.encode(state);

  function paint() {
    paintQueued = false;
    if (!preview) return;
    metrics = preview.update(state) || {};
    viewer?.setContent(preview.object, preview.size(state));
  }
  function refresh(changedKey) {
    // comandi: valore scelto, cosa mostrare e cosa no
    plugin.controls.forEach((c, i) => {
      const el = ctlEls[i], v = state[c.key];
      el.hidden = c.show ? !c.show(state) : false;
      const val = $('[data-val]', el);
      if (c.type === 'text') {
        const inp = $('input', el);
        if (inp.value !== v && document.activeElement !== inp) inp.value = v;
        val.textContent = `${Array.from(v).length}/${c.max}`;
      } else if (c.type === 'range') { $('input', el).value = v; val.textContent = String(v); }
      else if (c.type === 'toggle') $('input', el).checked = !!v;
      else if (c.type === 'seed') val.textContent = 'variante ' + v;
      else {
        $$('[role=radio]', el).forEach((b) => {
          const on = String(v) === b.dataset.v;
          b.setAttribute('aria-checked', String(on));
          b.tabIndex = on ? 0 : -1;
        });
        if (c.type === 'color') val.textContent = fil(v).name;
        else if (c.type === 'font') val.textContent = FONTS[v]?.name || '';
        else if (c.type === 'tiles') val.textContent = c.options.find((o) => o.v === v)?.label || '';
      }
    });
    // miniature dei motivi: si ridisegnano solo se cambiano i colori
    const tk = plugin.controls.filter((c) => c.type === 'color').map((c) => state[c.key]).join('.');
    if (plugin.thumb && tk !== thumbKey) {
      thumbKey = tk;
      plugin.controls.forEach((c, i) => {
        if (c.type !== 'tiles') return;
        $$('button', ctlEls[i]).forEach((b) => plugin.thumb($('canvas', b), c.key, b.dataset.v, state));
      });
    }
    const cd = code();
    codeEl.textContent = cd;
    sumEl.textContent = plugin.summary(state);
    warnEl.innerHTML = (plugin.warnings?.(state) || []).map((w) => `<li>${esc(w)}</li>`).join('');
    if (!paintQueued) { paintQueued = true; requestAnimationFrame(paint); }
    if (useHash && changedKey !== undefined) {
      clearTimeout(hashT);
      hashT = setTimeout(() => history.replaceState(null, '', '#c=' + encodeURIComponent(code()).replace(/%2D/gi, '-')), 250);
    }
    root.dispatchEvent(new CustomEvent('cfg:change', { detail: { state, code: cd } }));
  }
  function set(key, value) {
    const c = plugin.controls.find((x) => x.key === key);
    state[key] = typeof plugin.defaults()[key] === 'number' ? Number(value) : value;
    plugin.onChange?.(state, key);
    refresh(key);
    return c;
  }

  // --- ascolto dei comandi
  plugin.controls.forEach((c, i) => {
    const el = ctlEls[i];
    if (c.type === 'text') $('input', el).addEventListener('input', (e) => set(c.key, e.target.value));
    else if (c.type === 'range') $('input', el).addEventListener('input', (e) => set(c.key, +e.target.value));
    else if (c.type === 'toggle') $('input', el).addEventListener('change', (e) => set(c.key, e.target.checked));
    else if (c.type === 'seed') $('[data-seed]', el).addEventListener('click', () => set(c.key, 1 + Math.floor(Math.random() * 999)));
    else {
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[role=radio]');
        if (b) set(c.key, typeof state[c.key] === 'number' ? +b.dataset.v : b.dataset.v);
      });
      // frecce della tastiera fra le scelte
      el.addEventListener('keydown', (e) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
        const all = $$('[role=radio]', el), k = all.indexOf(document.activeElement);
        if (k < 0) return;
        e.preventDefault();
        const nx = all[(k + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length];
        nx.focus(); nx.click();
      });
    }
  });
  $('[data-rand]', root).addEventListener('click', () => { plugin.randomize?.(state); plugin.onChange?.(state); refresh(null); });
  $('[data-reset]', root).addEventListener('click', () => { flipped = false; viewer?.resetView(); });
  let flipped = false;
  $('[data-flip]', root).addEventListener('click', (e) => {
    flipped = !flipped;
    viewer?.lookFrom(flipped ? Math.PI - 0.5 : null);
    e.currentTarget.textContent = flipped ? 'Guarda il davanti' : 'Guarda il retro';
  });
  $('[data-copy]', root).addEventListener('click', async (e) => {
    const b = e.currentTarget;
    const ok = await copyText(code());
    toast(ok ? 'Codice copiato. Ora incollalo su Etsy, nel campo «personalizzazione».' : 'Non riesco a copiare da solo: seleziona il codice e copialo a mano.');
    if (ok) { b.textContent = 'Copiato!'; setTimeout(() => (b.textContent = 'Copia il codice'), 1800); }
  });
  $('[data-share]', root).addEventListener('click', async () => {
    const u = new URL(location.href);
    u.hash = 'c=' + code();
    toast((await copyText(u.toString())) ? 'Link copiato: chi lo apre vede il tuo oggetto.' : 'Non riesco a copiare il link.');
  });
  // «Ordina su Etsy»: prima si copia il codice, così è già pronto da incollare
  $$('[data-etsy]', root).forEach((a) => a.addEventListener('click', () => { copyText(code()).then((ok) => ok && toast('Codice copiato: incollalo su Etsy nel campo «personalizzazione».')); }));
  codeEl.addEventListener('click', () => { const r = document.createRange(); r.selectNodeContents(codeEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });

  plugin.onChange?.(state);
  refresh();

  // --- anteprima 3D (quando i caratteri sono pronti)
  await loadFonts();
  preview = plugin.createPreview();
  viewer = new Viewer3D(viewEl, { interactive: true });
  if (!viewer.ok) { preview.canvas.className = 'cfg-flat'; viewEl.appendChild(preview.canvas); }
  paint();
  root.classList.add('is-ready');
  if (viewer.ok && !reducedMotion()) viewer.nudge();

  const api = {
    state, plugin, viewer,
    code,
    summary: () => plugin.summary(state),
    metrics: () => metrics,
    set,
    patch(obj) { Object.assign(state, obj); plugin.onChange?.(state); refresh(null); },
    loadCode(c) { const ok = tryCode(c); if (ok) { plugin.onChange?.(state); refresh(); } return ok; },
    loadedFromCode,
  };
  root._cfg = api;
  return api;
}

export { codeFromHash, CONFIG, etsyUrl };
