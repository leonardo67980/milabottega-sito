// ============================================================================
// Configuratore · Targa famiglia a forma di casa                (codici MBT-…)
// Anteprima semplice: serve anche da esempio per aggiungere altri prodotti.
// ============================================================================
import { FILAMENTS, FONTS, fil, filIndex, clamp, cleanText, contrast, b36, un36, packCode } from '../js/config.js';
import { THREE, FaceCanvas, drawFittedText, makePlate } from '../js/cover3d.js';

const W = 210, H = 140, THICK = 4;
const MAX_NAME = 22, MAX_NUM = 4;

function houseShape() {
  const s = new THREE.Shape();
  s.moveTo(-95, -70);
  s.lineTo(95, -70); s.lineTo(95, 18); s.lineTo(105, 18); s.lineTo(105, 26);
  s.lineTo(62, 44); s.lineTo(62, 66); s.lineTo(42, 66); s.lineTo(42, 52.4); // comignolo
  s.lineTo(0, 70);
  s.lineTo(-105, 26); s.lineTo(-105, 18); s.lineTo(-95, 18);
  s.closePath();
  return s;
}

// omini semplici (coordinate canvas: y verso il basso, i piedi stanno su baseY)
function person(ctx, x, baseY, h, dress) {
  const r = h * 0.17, w = h * 0.36;
  ctx.beginPath(); ctx.arc(x, baseY - h + r, r, 0, Math.PI * 2); ctx.fill();
  const top = baseY - h + 2 * r + h * 0.03;
  ctx.beginPath();
  if (dress) {
    ctx.moveTo(x - w * 0.42, top); ctx.lineTo(x + w * 0.42, top);
    ctx.lineTo(x + w * 0.78, baseY - h * 0.2); ctx.lineTo(x - w * 0.78, baseY - h * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(x - w * 0.3, baseY - h * 0.22, w * 0.22, h * 0.22);
    ctx.fillRect(x + w * 0.08, baseY - h * 0.22, w * 0.22, h * 0.22);
  } else {
    ctx.roundRect(x - w / 2, top, w, h * 0.36, w * 0.22); ctx.fill();
    ctx.fillRect(x - w * 0.36, top + h * 0.3, w * 0.3, baseY - top - h * 0.3);
    ctx.fillRect(x + w * 0.06, top + h * 0.3, w * 0.3, baseY - top - h * 0.3);
  }
}
function dog(ctx, x, baseY, h) {
  ctx.beginPath(); ctx.ellipse(x, baseY - h * 0.38, h * 0.3, h * 0.38, 0.25, 0, Math.PI * 2); ctx.fill(); // corpo seduto
  ctx.beginPath(); ctx.arc(x - h * 0.2, baseY - h * 0.82, h * 0.2, 0, Math.PI * 2); ctx.fill(); // testa
  ctx.beginPath(); ctx.ellipse(x - h * 0.4, baseY - h * 0.76, h * 0.14, h * 0.09, 0, 0, Math.PI * 2); ctx.fill(); // muso
  ctx.beginPath(); ctx.ellipse(x - h * 0.08, baseY - h * 0.78, h * 0.08, h * 0.17, -0.3, 0, Math.PI * 2); ctx.fill(); // orecchio
  ctx.beginPath(); ctx.ellipse(x + h * 0.34, baseY - h * 0.1, h * 0.2, h * 0.07, -0.5, 0, Math.PI * 2); ctx.fill(); // coda
}

function paint(fc, st, o = {}) {
  const base = fil(st.base).hex, roof = fil(st.tetto).hex, fig = fil(st.fig).hex, ink = fil(st.ink).hex;
  const nome = o.text ?? st.nome, p = o.progress ?? 1;
  fc.size(W, H);
  fc.fill(base);
  const ctx = fc.mm();
  // comignolo e tetto
  ctx.fillStyle = fig; ctx.fillRect(40, -68, 24, 30);
  ctx.strokeStyle = roof; ctx.lineWidth = 12; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(-112, -19); ctx.lineTo(0, -66); ctx.lineTo(112, -19); ctx.stroke();
  // famiglia
  ctx.fillStyle = fig;
  const list = [];
  for (let i = 0; i < st.adulti; i++) list.push({ t: i === 1 ? 'f' : 'm', h: 44 });
  for (let i = 0; i < st.bambini; i++) list.push({ t: i % 2 ? 'f' : 'm', h: 27 - i * 3 });
  if (st.cane) list.push({ t: 'd', h: 26 });
  const shown = Math.ceil(list.length * p);
  let x = -78;
  list.slice(0, shown).forEach((f) => {
    const w = f.t === 'd' ? f.h * 0.95 : f.h * 0.58;
    if (f.t === 'd') dog(ctx, x + w * 0.55, 56, f.h); else person(ctx, x + w / 2, 56, f.h, f.t === 'f');
    x += w + 5;
  });
  // numero civico e nome
  if (st.numero && p >= 1) drawFittedText(ctx, st.numero, { font: 3, size: 62, maxW: 62, cx: 58, cy: 36, ink });
  const m = drawFittedText(ctx, nome, { font: st.font, size: 30, maxW: 150, cx: 0, cy: -9, ink });
  fc.sparkle(base);
  return { textSize: m.size, textW: m.w, textH: m.h };
}

const AVORIO = filIndex('bianco-avorio'), ERBA = filIndex('verde-erba'), TERRA = filIndex('terracotta'), NERO = filIndex('nero');

export default {
  id: 'targa',
  nome: 'Targa famiglia',
  prefixes: ['MBT'],
  textKey: 'nome',
  maxText: MAX_NAME,

  defaults() {
    return { nome: 'Famiglia Rossi', numero: '12', base: AVORIO, tetto: ERBA, fig: TERRA, ink: NERO, font: 1, adulti: 2, bambini: 1, cane: true };
  },

  controls: [
    { key: 'nome', type: 'text', label: 'Il nome sulla targa', max: MAX_NAME, placeholder: 'Es. Famiglia Rossi' },
    { key: 'numero', type: 'text', label: 'Numero civico (se lo vuoi)', max: MAX_NUM, placeholder: 'Es. 12' },
    { key: 'font', type: 'font', label: 'Il carattere' },
    { key: 'adulti', type: 'segment', label: 'Grandi', options: [0, 1, 2].map((v) => ({ v, label: String(v) })) },
    { key: 'bambini', type: 'segment', label: 'Bambini', options: [0, 1, 2, 3].map((v) => ({ v, label: String(v) })) },
    { key: 'cane', type: 'toggle', label: 'C\'è anche il cane' },
    { key: 'base', type: 'color', label: 'Colore della targa' },
    { key: 'tetto', type: 'color', label: 'Colore del tetto' },
    { key: 'fig', type: 'color', label: 'Colore della famiglia' },
    { key: 'ink', type: 'color', label: 'Colore delle scritte' },
  ],

  onChange(st) {
    st.nome = cleanText(st.nome, MAX_NAME);
    st.numero = cleanText(st.numero, MAX_NUM);
    st.adulti = clamp(+st.adulti || 0, 0, 2); st.bambini = clamp(+st.bambini || 0, 0, 3);
  },

  randomize(st) {
    const pick = (n) => Math.floor(Math.random() * n);
    let base, ink, t = 0;
    do { base = pick(FILAMENTS.length); ink = pick(FILAMENTS.length); } while (contrast(fil(base).hex, fil(ink).hex) < 4 && ++t < 80);
    Object.assign(st, { base, ink, tetto: pick(FILAMENTS.length), fig: pick(FILAMENTS.length), font: pick(FONTS.length), adulti: 1 + pick(2), bambini: pick(4), cane: Math.random() < 0.5 });
  },

  warnings(st) {
    const out = [], b = fil(st.base).hex;
    if (contrast(b, fil(st.ink).hex) < 1.6) out.push('Scritte e targa hanno colori molto simili: si leggerà poco.');
    if (contrast(b, fil(st.fig).hex) < 1.3) out.push('La famiglia ha quasi lo stesso colore della targa.');
    return out;
  },

  encode(st) {
    const params = b36(st.base) + b36(st.tetto) + b36(st.fig) + b36(st.ink) + String(clamp(st.font, 0, 9)) + String(st.adulti) + String(st.bambini) + (st.cane ? '1' : '0');
    return packCode('MBT', params, [st.nome, st.numero]);
  },

  decode(u) {
    const p = u.params;
    if (p.length !== 8) return { ok: false, error: 'Il codice della targa è incompleto o ha qualche carattere in più.' };
    const st = {
      base: un36(p[0]), tetto: un36(p[1]), fig: un36(p[2]), ink: un36(p[3]), font: +p[4], adulti: +p[5], bambini: +p[6], cane: p[7] === '1',
      nome: cleanText(u.texts[0] || '', MAX_NAME), numero: cleanText(u.texts[1] || '', MAX_NUM),
    };
    const okCol = ['base', 'tetto', 'fig', 'ink'].every((k) => st[k] < FILAMENTS.length);
    if (!okCol || !(st.font < FONTS.length) || !(st.adulti <= 2) || !(st.bambini <= 3)) return { ok: false, error: 'Nel codice c\'è un valore che non conosco: forse è stato copiato male.' };
    return { ok: true, state: st };
  },

  summary(st) {
    const fam = [st.adulti ? `${st.adulti} ${st.adulti === 1 ? 'grande' : 'grandi'}` : null, st.bambini ? `${st.bambini} ${st.bambini === 1 ? 'bambino' : 'bambini'}` : null, st.cane ? 'cane' : null].filter(Boolean).join(' + ') || 'senza figure';
    return ['Targa famiglia', `targa ${fil(st.base).name}`, `tetto ${fil(st.tetto).name}`, `famiglia ${fil(st.fig).name} (${fam})`, `scritte ${fil(st.ink).name}`, FONTS[st.font].name,
      st.nome ? `«${st.nome}»` : 'senza nome', st.numero ? `n. ${st.numero}` : null].filter(Boolean).join(' · ');
  },

  spec(st) {
    return [
      ['Prodotto', 'Targa famiglia a forma di casa'],
      ['Nome', st.nome ? `«${st.nome}»` : '(nessuno)'],
      ['Numero civico', st.numero || '(nessuno)'],
      ['Carattere del nome', FONTS[st.font].name],
      ['Grandi', String(st.adulti)], ['Bambini', String(st.bambini)], ['Cane', st.cane ? 'sì' : 'no'],
      ['Colore targa', fil(st.base).name], ['Colore tetto', fil(st.tetto).name],
      ['Colore famiglia e comignolo', fil(st.fig).name], ['Colore scritte', fil(st.ink).name],
    ];
  },

  createPreview(opts = {}) {
    const fc = new FaceCanvas(opts.maxPx);
    const root = new THREE.Group();
    let plate = null;
    return {
      object: root,
      canvas: fc.canvas,
      size: () => ({ w: W, h: H }),
      update(st, o = {}) {
        const m = paint(fc, st, o);
        if (!plate) {
          plate = makePlate({ shape: houseShape(), thickness: THICK, bevel: 0.6, canvas: fc.canvas, w: W, h: H, z0: -THICK / 2, hex: fil(st.base).hex });
          root.add(plate.mesh);
        }
        plate.setColor(fil(st.base).hex);
        plate.texture.needsUpdate = true;
        return m;
      },
      dispose() { plate?.dispose(); },
    };
  },
};
