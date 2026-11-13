// ============================================================================
// Mila Bottega · area laboratorio: da un codice all'anteprima e alla scheda
// completa, per rifare l'oggetto nel generatore. Legge i codici di tutti i
// prodotti: riconosce il prodotto dall'inizio del codice (MB6, MB7, MBT…).
// ============================================================================
import { unpackCode, codeFromHash } from './config.js';
import { prodottoPerConfiguratore } from './prodotti.js';
import { Viewer3D, loadFonts } from './cover3d.js';
import { loadPlugin, pluginIdForPrefix, PREFISSI } from '../configuratori/index.js';
import { $, esc, toast, copyText } from './site.js';

document.documentElement.classList.add('js');
const inp = $('#codeIn'), out = $('#labOut'), msg = $('#labMsg'), viewEl = $('#labView');
let viewer = null, previews = {}, last = null;

$('#labPrefissi').textContent = Object.keys(PREFISSI).join(', ');

async function read(raw, { silent = false } = {}) {
  const u = unpackCode(raw);
  msg.className = 'lab-msg';
  if (!u.ok) { if (!silent) { msg.textContent = u.error; msg.classList.add('is-err'); } return null; }
  const pid = pluginIdForPrefix(u.prefix);
  if (!pid) { msg.textContent = `Non conosco i codici che cominciano con «${u.prefix}».`; msg.classList.add('is-err'); return null; }
  const plugin = await loadPlugin(pid);
  const d = plugin.decode(u);
  if (!d.ok) { msg.textContent = d.error; msg.classList.add('is-err'); return null; }
  const st = d.state;
  plugin.onChange?.(st);
  msg.textContent = u.warning || 'Codice letto correttamente.';
  msg.classList.add(u.warning ? 'is-warn' : 'is-ok');

  await loadFonts();
  if (!viewer) viewer = new Viewer3D(viewEl, { interactive: true });
  const pv = (previews[pid] ||= plugin.createPreview());
  const metrics = pv.update(st) || {};
  if (viewer.ok) viewer.setContent(pv.object, pv.size(st));
  else { viewEl.querySelector('canvas')?.remove(); pv.canvas.className = 'cfg-flat'; viewEl.appendChild(pv.canvas); }

  const canonical = plugin.encode(st);
  const prod = prodottoPerConfiguratore(pid);
  const rows = plugin.spec(st, metrics);
  const summary = plugin.summary(st);
  last = { code: canonical, summary, rows, state: st, plugin: pid };
  out.hidden = false;
  out.innerHTML = `
    <p class="lab-prod">${esc(prod?.nome || plugin.nome)}</p>
    <p class="lab-sum">${esc(summary)}</p>
    <table class="lab-table"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
    <p class="lab-code">Codice: <code>${esc(canonical)}</code></p>
    <div class="lab-btns">
      <button type="button" class="btn btn-small btn-green" id="labCopy">Copia la scheda</button>
      <button type="button" class="btn btn-small btn-line" id="labPrint">Stampa</button>
      <button type="button" class="btn btn-small btn-line" id="labReset">Vista iniziale</button>
    </div>`;
  $('#labCopy').onclick = async () => toast((await copyText([prod?.nome || plugin.nome, canonical, summary, '', ...rows.map(([k, v]) => `${k}: ${v}`)].join('\n'))) ? 'Scheda copiata.' : 'Non riesco a copiare.');
  $('#labPrint').onclick = () => print();
  $('#labReset').onclick = () => viewer?.resetView();
  history.replaceState(null, '', '#c=' + canonical);
  document.body.classList.add('has-code');
  window.__lab = last;
  return last;
}

$('#labForm').addEventListener('submit', (e) => { e.preventDefault(); read(inp.value); });
inp.addEventListener('paste', () => setTimeout(() => read(inp.value), 0));
const h = codeFromHash();
if (h) { inp.value = h; read(h); }
window.__read = read;
