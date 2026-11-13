// ============================================================================
// Configuratore · Coperchio copri-display TM6 / TM7      (codici MB6-… e MB7-…)
// I motivi riprendono quelli del generatore di laboratorio (stessi nomi).
// ============================================================================
import { FILAMENTS, FONTS, fil, filIndex, rng, clamp, cleanText, contrast, b36, un36, packCode } from '../js/config.js';
import { THREE, FaceCanvas, drawFittedText, makePlate, makeBody, roundRectShape } from '../js/cover3d.js';

// Misure vere (mm)
export const MODELS = {
  tm7: { label: 'TM7', W: 252.4, D: 169.4, R: 17, H: 13, T: 2, wall: 2, lineW: 1.6, knob: null, desc: 'vaschetta 252 × 169 mm' },
  tm6: { label: 'TM6', W: 181.5, D: 117.5, R: 7, H: 3.5, T: 1.5, rim: 2, lineW: 1.4, knob: { x: 181.5 / 2 - 8.8 + 22.5, y: 3.5, r: 22.5 }, desc: 'lastra 181 × 117 mm' },
};
const MARGIN = 4, FRAME_W = 1.6, TEXT_GAP = 3, MAX_TEXT = 20;

// Motivi: «app» è il nome nel generatore di laboratorio. Non cambiare l'ordine (fa parte dei codici).
export const PATTERNS = [
  { id: 'nessuno', name: 'Nessuno', app: 'Nessuno (liscio)', def: 0 },
  { id: 'linee', name: 'Linee', app: 'Linee astratte', def: 14, seeded: true },
  { id: 'triangoli', name: 'Triangoli', app: 'Linee geometriche (low poly)', def: 7, seeded: true },
  { id: 'onde', name: 'Onde', app: 'Onde', def: 12, angle: 0 },
  { id: 'righe', name: 'Righe', app: 'Righe', def: 14, angle: 30 },
  { id: 'esagoni', name: 'Esagoni', app: "Nido d'ape", def: 11 },
  { id: 'pois', name: 'Pois', app: 'Pois', def: 12 },
  { id: 'fiocchi', name: 'Fiocchi di neve', app: 'Fiocchi di neve (motivo di Natale)', def: 12, seeded: true },
];
const patIndex = (id) => Math.max(0, PATTERNS.findIndex((p) => p.id === id));

// ----------------------------------------------------------------------------
// Geometria del piano (canvas: mm, origine al centro, y verso il basso)
// ----------------------------------------------------------------------------
function rrPath(ctx, M, inset) {
  const w = M.W - 2 * inset, h = M.D - 2 * inset, r = Math.max(0.5, M.R - inset);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
}
function clipArea(ctx, M, inset) {
  rrPath(ctx, M, inset);
  ctx.clip();
  if (M.knob) {
    ctx.beginPath();
    ctx.rect(-M.W, -M.D, 2 * M.W, 2 * M.D);
    ctx.arc(M.knob.x, -M.knob.y, M.knob.r + inset, 0, Math.PI * 2);
    ctx.clip('evenodd');
  }
}
/** Il punto (x,y) sta dentro al piano, lontano almeno «inset» dal bordo? */
function inside(M, x, y, inset) {
  const hw = M.W / 2 - inset, hh = M.D / 2 - inset, r = Math.max(0.5, M.R - inset);
  const qx = Math.abs(x) - (hw - r), qy = Math.abs(y) - (hh - r);
  const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  if (d > 0) return false;
  if (M.knob && Math.hypot(x - M.knob.x, y + M.knob.y) < M.knob.r + inset) return false;
  return true;
}

/** Motivi originali Mila Bottega dentro al riquadro b: restituisce linee, pois e fiocchi da disegnare */
function patternGeometry(kind, M, areaInset, { n, seed, w, angle }) {
  const bw = M.W - 2 * areaInset, bh = M.D - 2 * areaInset;
  const b = { minX: -bw / 2, minY: -bh / 2, maxX: bw / 2, maxY: bh / 2, w: bw, h: bh, cx: 0, cy: 0 };
  const rand = rng(seed);
  const lines = [], dots = [], flakes = [];
  const pad = Math.max(b.w, b.h) * 0.05;
  if (kind === 'triangoli') {
    // rete low poly: griglia mossa a caso, ogni quadrato diviso da una diagonale a caso
    const cols = Math.max(2, Math.round(n)), rows = Math.max(2, Math.round((n * b.h) / b.w));
    const cw = (b.w + 2 * pad) / cols, ch = (b.h + 2 * pad) / rows;
    const P = [];
    for (let j = 0; j <= rows; j++) {
      P.push([]);
      for (let i = 0; i <= cols; i++) {
        const edge = i === 0 || j === 0 || i === cols || j === rows;
        const jx = edge ? 0 : (rand() - 0.5) * cw * 0.7, jy = edge ? 0 : (rand() - 0.5) * ch * 0.7;
        P[j].push([b.minX - pad + i * cw + jx, b.minY - pad + j * ch + jy]);
      }
    }
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      if (i < cols) lines.push({ pts: [P[j][i], P[j][i + 1]] });
      if (j < rows) lines.push({ pts: [P[j][i], P[j + 1][i]] });
      if (i < cols && j < rows) lines.push({ pts: rand() < 0.5 ? [P[j][i], P[j + 1][i + 1]] : [P[j][i + 1], P[j + 1][i]] });
    }
  } else if (kind === 'linee') {
    // linee astratte: corde lunghe fra due lati diversi del riquadro
    const side = (s, t) => [
      [b.minX + t * b.w, b.minY], [b.maxX, b.minY + t * b.h], [b.maxX - t * b.w, b.maxY], [b.minX, b.maxY - t * b.h],
    ][s];
    const count = Math.max(3, Math.round(n));
    for (let k = 0; k < count; k++) {
      const s1 = Math.floor(rand() * 4), s2 = (s1 + 1 + Math.floor(rand() * 3)) % 4;
      const a = side(s1, 0.1 + rand() * 0.8), c = side(s2, 0.1 + rand() * 0.8);
      const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1;
      lines.push({ pts: [[a[0] - (dx / l) * pad, a[1] - (dy / l) * pad], [c[0] + (dx / l) * pad, c[1] + (dy / l) * pad]] });
    }
  } else if (kind === 'onde' || kind === 'righe') {
    // linee parallele (dritte o a onda), ruotate di «angle» gradi
    const a = (angle * Math.PI) / 180, R = Math.hypot(b.w, b.h) / 2 + pad;
    const count = Math.max(2, Math.round(n)), gap = (2 * R) / count;
    const amp = kind === 'onde' ? gap * 0.32 : 0, period = Math.max(20, gap * 4);
    for (let k = 0; k <= count; k++) {
      const v = -R + k * gap, pts = [];
      for (let u = -R; u <= R + 1e-6; u += kind === 'onde' ? 2 : 2 * R) {
        const vv = v + amp * Math.sin((u / period) * Math.PI * 2);
        pts.push([b.cx + u * Math.cos(a) - vv * Math.sin(a), b.cy + u * Math.sin(a) + vv * Math.cos(a)]);
      }
      lines.push({ pts });
    }
  } else if (kind === 'esagoni') {
    const s = Math.max(4, b.w / Math.max(2, n)) / Math.sqrt(3); // lato dell'esagono
    const dx = s * Math.sqrt(3), dy = s * 1.5;
    for (let j = -1; j * dy <= b.h + dy; j++)
      for (let i = -1; i * dx <= b.w + dx; i++) {
        const cx = b.minX + i * dx + (j % 2 ? dx / 2 : 0), cy = b.minY + j * dy;
        const pts = [];
        for (let k = 0; k < 6; k++) pts.push([cx + s * Math.cos(Math.PI / 6 + (k * Math.PI) / 3), cy + s * Math.sin(Math.PI / 6 + (k * Math.PI) / 3)]);
        lines.push({ pts, closed: true });
      }
  } else if (kind === 'pois') {
    const g = Math.max(4, b.w / Math.max(2, n)), r = Math.max(w * 0.8, g * 0.22);
    for (let j = 0; j * g * 0.87 <= b.h + g; j++)
      for (let i = -1; i * g <= b.w + g; i++) {
        const x = b.minX + i * g + (j % 2 ? g / 2 : 0), y = b.minY + j * g * 0.87;
        if (inside(M, x, y, areaInset + r)) dots.push({ x, y, r }); // solo pois interi
      }
  } else if (kind === 'fiocchi') {
    const count = Math.round(n * 2.4), k = b.h / 160;
    for (let t = 0; t < 900 && flakes.length < count; t++) {
      const r = (4.5 + rand() * rand() * 9) * k;
      const x = b.minX + rand() * b.w, y = b.minY + rand() * b.h, rot = rand() * Math.PI;
      if (!inside(M, x, y, areaInset + r)) continue;
      if (flakes.some((f) => Math.hypot(f.x - x, f.y - y) < f.r + r + 2.5 * k)) continue;
      flakes.push({ x, y, r, rot });
    }
  }
  return { lines, dots, flakes };
}

function drawFlake(ctx, f, scale = 1) {
  const r = f.r * scale;
  ctx.save();
  ctx.translate(f.x, f.y); ctx.rotate(f.rot);
  ctx.lineWidth = Math.max(0.8, r * 0.15);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let a = 0; a < 6; a++) {
    const c = Math.cos((a * Math.PI) / 3), s = Math.sin((a * Math.PI) / 3);
    ctx.moveTo(0, 0); ctx.lineTo(c * r, s * r);
    for (const [at, len] of [[0.45, 0.3], [0.72, 0.2]]) {
      for (const sg of [-1, 1]) {
        const ba = (a * Math.PI) / 3 + sg * (Math.PI / 3);
        ctx.moveTo(c * r * at, s * r * at);
        ctx.lineTo(c * r * at + Math.cos(ba) * r * len, s * r * at + Math.sin(ba) * r * len);
      }
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawPattern(ctx, geo, { ink, w, progress = 1, skipBox = null }) {
  ctx.strokeStyle = ink; ctx.fillStyle = ink;
  ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const hits = (x, y, r) => skipBox && x + r > skipBox.x0 && x - r < skipBox.x1 && y + r > skipBox.y0 && y - r < skipBox.y1;
  // le linee si "tirano" una dopo l'altra (per l'animazione della copertina)
  const L = geo.lines.length, upto = L * progress;
  for (let i = 0; i < L && i < upto; i++) {
    const { pts, closed } = geo.lines[i];
    const f = Math.min(1, upto - i);
    ctx.beginPath();
    if (f >= 1 || closed) {
      if (closed && f < 1) ctx.globalAlpha = f;
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      if (closed) ctx.closePath();
    } else {
      const span = (pts.length - 1) * f, whole = Math.floor(span), part = span - whole;
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k <= whole; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      if (whole < pts.length - 1) {
        const a = pts[whole], c = pts[whole + 1];
        ctx.lineTo(a[0] + (c[0] - a[0]) * part, a[1] + (c[1] - a[1]) * part);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const dN = geo.dots.length * progress;
  geo.dots.forEach((d, i) => {
    if (i >= dN || hits(d.x, d.y, d.r)) return;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r * Math.min(1, dN - i), 0, Math.PI * 2); ctx.fill();
  });
  const fN = geo.flakes.length * progress;
  geo.flakes.forEach((f, i) => {
    if (i >= fN || hits(f.x, f.y, f.r)) return;
    drawFlake(ctx, f, Math.min(1, fN - i));
  });
}

// ----------------------------------------------------------------------------
// Il disegno della faccia
// ----------------------------------------------------------------------------
function textOptions(M, st, inkHex, gapHex) {
  return {
    font: st.font, size: M.D * 0.4, maxW: (M.W - 2 * MARGIN) * (M.knob ? 0.7 : 0.8) - (st.frame ? 8 : 0),
    cx: M.knob ? -3 : 0, cy: 0, ink: inkHex, gap: st.pattern === 'nessuno' ? 0 : TEXT_GAP, gapColor: gapHex,
  };
}

/** Dipinge la faccia del coperchio. opts.progress 0..1 = quanto motivo è già "disegnato". */
export function paintLid(fc, st, opts = {}) {
  const M = MODELS[st.model] || MODELS.tm7;
  const base = fil(st.base).hex, ink = fil(st.ink).hex;
  const progress = opts.progress ?? 1;
  const text = opts.text ?? st.text;
  const resized = fc.size(M.W, M.D);
  const P = PATTERNS[patIndex(st.pattern)];
  const dotty = P.id === 'pois' || P.id === 'fiocchi';
  const key = [st.model, st.base, st.ink, st.pattern, st.density, st.seed, st.frame, dotty ? text + '|' + st.font : ''].join('/');
  const ctx = fc.ctx;

  if (progress >= 1 && !resized && fc._key === key) fc.restore();
  else {
    fc.fill(base);
    fc.mm();
    ctx.save();
    clipArea(ctx, M, MARGIN);
    let areaInset = MARGIN;
    if (st.frame) {
      ctx.strokeStyle = ink; ctx.lineWidth = FRAME_W;
      rrPath(ctx, M, MARGIN + FRAME_W / 2); ctx.stroke();
      if (M.knob) { ctx.beginPath(); ctx.arc(M.knob.x, -M.knob.y, M.knob.r + MARGIN + FRAME_W / 2, 0, Math.PI * 2); ctx.stroke(); }
      areaInset += FRAME_W + Math.max(2, FRAME_W);
    }
    ctx.restore();
    if (P.id !== 'nessuno') {
      let skipBox = null;
      if (dotty && text) {
        // pois e fiocchi restano interi: quelli sotto alla scritta si tolgono
        const m = drawFittedText(ctx, text, { ...textOptions(M, st, 'rgba(0,0,0,0)', null), gap: 0 });
        if (m.box) skipBox = { x0: m.box.x0 - TEXT_GAP, x1: m.box.x1 + TEXT_GAP, y0: m.box.y0 - TEXT_GAP, y1: m.box.y1 + TEXT_GAP };
      }
      ctx.save();
      clipArea(ctx, M, areaInset);
      const geo = patternGeometry(P.id, M, areaInset, { n: st.density, seed: st.seed, w: M.lineW, angle: P.angle || 0 });
      drawPattern(ctx, geo, { ink, w: M.lineW, progress, skipBox });
      ctx.restore();
    }
    if (progress >= 1) { fc.snapshot(); fc._key = key; } else fc._key = null;
  }
  fc.mm();
  const m = drawFittedText(ctx, text, textOptions(M, st, ink, base));
  fc.sparkle(base);
  return { textSize: m.size, textW: m.w, textH: m.h };
}

// ----------------------------------------------------------------------------
// La forma vera in 3D
// ----------------------------------------------------------------------------
function tm6Shape(M) {
  const { W, D, R, knob } = M, x = W / 2, y = D / 2;
  const dx = knob.x - x, dy = Math.sqrt(knob.r ** 2 - dx ** 2), a = Math.atan2(dy, dx);
  const s = new THREE.Shape();
  s.moveTo(-x + R, -y);
  s.lineTo(x - R, -y);
  s.absarc(x - R, -y + R, R, -Math.PI / 2, 0, false);
  s.lineTo(x, knob.y - dy);
  s.absarc(knob.x, knob.y, knob.r, -(Math.PI - a), Math.PI - a, true); // incavo per la manopola
  s.lineTo(x, y - R);
  s.absarc(x - R, y - R, R, 0, Math.PI / 2, false);
  s.lineTo(-x + R, y);
  s.absarc(-x + R, y - R, R, Math.PI / 2, Math.PI, false);
  s.lineTo(-x, -y + R);
  s.absarc(-x + R, -y + R, R, Math.PI, Math.PI * 1.5, false);
  return s;
}
function tm6Rim(M) {
  // sponde sopra, sotto e a sinistra; a destra (lato manopola) niente
  const { W, D, R, rim } = M, x = W / 2, y = D / 2, xr = x - R, ri = Math.max(0.5, R - rim);
  const s = new THREE.Shape();
  s.moveTo(xr, y);
  s.lineTo(-x + R, y);
  s.absarc(-x + R, y - R, R, Math.PI / 2, Math.PI, false);
  s.lineTo(-x, -y + R);
  s.absarc(-x + R, -y + R, R, Math.PI, Math.PI * 1.5, false);
  s.lineTo(xr, -y);
  s.lineTo(xr - 3, -y + rim);
  s.lineTo(-x + R, -y + rim);
  s.absarc(-x + R, -y + R, ri, Math.PI * 1.5, Math.PI, true);
  s.lineTo(-x + rim, y - R);
  s.absarc(-x + R, y - R, ri, Math.PI, Math.PI / 2, true);
  s.lineTo(xr - 3, y - rim);
  s.closePath();
  return s;
}

function buildLid(model, canvas, hex) {
  const M = MODELS[model], g = new THREE.Group(), parts = [];
  if (model === 'tm6') {
    const plate = makePlate({ shape: tm6Shape(M), thickness: M.T, bevel: 0.45, canvas, w: M.W, h: M.D, z0: M.rim, hex });
    const rim = makeBody({ shape: tm6Rim(M), height: M.rim + 0.05, z0: 0, hex });
    parts.push(plate, rim);
    g.userData.plate = plate;
  } else {
    const plate = makePlate({ shape: roundRectShape(M.W, M.D, M.R), thickness: M.T, bevel: 0.6, canvas, w: M.W, h: M.D, z0: M.H - M.T, hex });
    const ring = roundRectShape(M.W, M.D, M.R);
    ring.holes.push(roundRectShape(M.W - 2 * M.wall, M.D - 2 * M.wall, M.R - M.wall, new THREE.Path()));
    const walls = makeBody({ shape: ring, height: M.H - M.T + 0.05, z0: 0, hex });
    parts.push(plate, walls);
    g.userData.plate = plate;
  }
  parts.forEach((p) => { p.mesh.position.z = -M.H / 2; g.add(p.mesh); });
  g.userData.parts = parts;
  return g;
}

// ----------------------------------------------------------------------------
// Il plugin
// ----------------------------------------------------------------------------
const NERO = filIndex('nero'), ROSSO = filIndex('rosso-scarlatto');

export default {
  id: 'coperchio',
  nome: 'Coperchio copri-display',
  prefixes: ['MB6', 'MB7'],
  textKey: 'text',
  maxText: MAX_TEXT,

  defaults() {
    return { model: 'tm7', base: NERO, ink: ROSSO, pattern: 'linee', density: 14, seed: 12, text: 'Giulia', font: 0, frame: false };
  },

  // Lo schema dei comandi: il motore del configuratore li disegna da solo
  controls: [
    { key: 'model', type: 'segment', label: 'Il tuo robot', options: [
      { v: 'tm7', label: 'TM7', sub: 'vaschetta 252 × 169 mm' },
      { v: 'tm6', label: 'TM6', sub: 'lastra 181 × 117 mm' },
    ] },
    { key: 'text', type: 'text', label: 'Il nome o la scritta', max: MAX_TEXT, placeholder: 'Es. Giulia, Famiglia Rossi…' },
    { key: 'font', type: 'font', label: 'Il carattere' },
    { key: 'base', type: 'color', label: 'Colore del coperchio' },
    { key: 'ink', type: 'color', label: 'Colore di scritta e motivo' },
    { key: 'pattern', type: 'tiles', label: 'Il motivo di fondo', options: PATTERNS.map((p) => ({ v: p.id, label: p.name })) },
    { key: 'density', type: 'range', label: 'Quanto motivo', min: 3, max: 24, lo: 'poco', hi: 'tanto', show: (s) => s.pattern !== 'nessuno' },
    { key: 'seed', type: 'seed', label: 'Disegno', button: 'Cambia disegno', show: (s) => PATTERNS[patIndex(s.pattern)].seeded },
    { key: 'frame', type: 'toggle', label: 'Cornice lungo il bordo' },
  ],

  /** Dopo un cambio: sistema i valori che dipendono da altri */
  onChange(st, key) {
    if (key === 'pattern') { const d = PATTERNS[patIndex(st.pattern)].def; if (d) st.density = d; }
    st.text = cleanText(st.text, MAX_TEXT);
    st.density = clamp(Math.round(st.density) || 7, 2, 40);
    st.seed = clamp(Math.round(st.seed) || 1, 1, 999);
  },

  randomize(st) {
    const r = Math.random;
    const pick = (n) => Math.floor(r() * n);
    let base, ink, tries = 0;
    do { base = pick(FILAMENTS.length); ink = pick(FILAMENTS.length); } while (contrast(fil(base).hex, fil(ink).hex) < 3 && ++tries < 60);
    const P = PATTERNS[1 + pick(PATTERNS.length - 1)];
    Object.assign(st, { base, ink, pattern: P.id, density: clamp(P.def + pick(7) - 3, 3, 24), seed: 1 + pick(999), font: pick(FONTS.length), frame: r() < 0.25 });
  },

  warnings(st) {
    const out = [];
    if (contrast(fil(st.base).hex, fil(st.ink).hex) < 1.6) out.push('Questi due colori sono molto simili: scritta e motivo si vedranno poco.');
    if (!st.text.trim() && st.pattern === 'nessuno' && !st.frame) out.push('Così il coperchio è tutto liscio: aggiungi un nome o un motivo.');
    return out;
  },

  encode(st) {
    const params = b36(st.base) + b36(st.ink) + String(patIndex(st.pattern)) + String(clamp(st.font, 0, 9)) + (st.frame ? '1' : '0')
      + String(clamp(st.density, 0, 99)).padStart(2, '0') + b36(st.seed, 2);
    return packCode(st.model === 'tm6' ? 'MB6' : 'MB7', params, [cleanText(st.text, MAX_TEXT)]);
  },

  decode(u) {
    const p = u.params;
    if (p.length !== 9) return { ok: false, error: 'Il codice del coperchio è incompleto o ha qualche carattere in più.' };
    const st = {
      model: u.prefix === 'MB6' ? 'tm6' : 'tm7',
      base: un36(p[0]), ink: un36(p[1]), pattern: PATTERNS[+p[2]]?.id, font: +p[3], frame: p[4] === '1',
      density: parseInt(p.slice(5, 7), 10), seed: un36(p.slice(7, 9)), text: cleanText(u.texts[0] || '', MAX_TEXT),
    };
    if (!(st.base < FILAMENTS.length) || !(st.ink < FILAMENTS.length) || !st.pattern || !(st.font < FONTS.length)
      || !Number.isFinite(st.density) || !Number.isFinite(st.seed)) return { ok: false, error: 'Nel codice c\'è un valore che non conosco: forse è stato copiato male.' };
    st.density = clamp(st.density, 2, 40); st.seed = clamp(st.seed, 1, 999);
    return { ok: true, state: st };
  },

  summary(st) {
    const P = PATTERNS[patIndex(st.pattern)];
    const mot = P.id === 'nessuno' ? 'nessun motivo' : `motivo ${P.name} (${st.density}${P.seeded ? ', var. ' + st.seed : ''})`;
    return [
      MODELS[st.model].label, `coperchio ${fil(st.base).name}`, `scritta ${fil(st.ink).name}`, mot,
      FONTS[st.font].name, st.frame ? 'con cornice' : null, st.text ? `«${st.text}»` : 'senza scritta',
    ].filter(Boolean).join(' · ');
  },

  /** Scheda completa per il laboratorio: tutti i parametri con i nomi del generatore */
  spec(st, metrics = {}) {
    const M = MODELS[st.model], P = PATTERNS[patIndex(st.pattern)];
    const mm = (v) => String(+(+v).toFixed(1)).replace('.', ',');
    const rows = [
      ['Robot', st.model === 'tm6' ? 'TM6 (lastra con sponde e incavo per la manopola, 181,5 × 117,5 mm)' : 'TM7 (copri-display a vaschetta, 252,4 × 169,4 × 13 mm)'],
      ['Colore coperchio (c1)', `${fil(st.base).name}`],
      ['Colore disegno (c2)', `${fil(st.ink).name}`],
      ['Motivo', `${P.app}  [${P.id}]`],
    ];
    if (P.id !== 'nessuno') {
      rows.push(['Quantità (linee / celle in larghezza)', String(st.density)]);
      if (P.id !== 'pois' && P.id !== 'fiocchi') rows.push(['Spessore delle linee', `${mm(M.lineW)} mm`]);
      if (P.id === 'onde' || P.id === 'righe') rows.push(['Inclinazione', `${P.angle}°`]);
      if (P.seeded) rows.push(['Variante', `${st.seed}  (nel generatore il disegno può venire un po' diverso: fa fede l'anteprima qui accanto)`]);
    }
    rows.push(['Distanza dal bordo', `${MARGIN} mm`]);
    rows.push(['Cornice lungo il bordo', st.frame ? `sì, ${mm(FRAME_W)} mm` : 'no']);
    rows.push(['Scritta', st.text ? `«${st.text}»` : '(nessuna)']);
    if (st.text) {
      rows.push(['Carattere', FONTS[st.font].name]);
      rows.push(['Posizione scritta', M.knob ? 'al centro, 3 mm verso sinistra (per l\'incavo)' : 'al centro (x 0, y 0)']);
      if (metrics.textW) rows.push(['Grandezza scritta (circa)', `larga ${mm(metrics.textW)} mm, alta ${mm(metrics.textH)} mm · corpo ${mm(metrics.textSize)}`]);
      if (P.id !== 'nessuno') rows.push(['Spazio libero attorno alla scritta', `${TEXT_GAP} mm`]);
    }
    rows.push(['Stile', 'Intarsio bicolore a filo']);
    return rows;
  },

  /** Miniatura per le tessere di scelta del motivo */
  thumb(canvas, key, value, st) {
    if (key !== 'pattern') return;
    const T = { W: 66, D: 44, R: 5, lineW: 1.5, knob: null };
    const s = canvas.width / T.W, ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, canvas.width / 2, canvas.height / 2);
    ctx.save();
    rrPath(ctx, T, 0); ctx.clip();
    ctx.fillStyle = fil(st.base).hex; ctx.fillRect(-T.W, -T.D, 2 * T.W, 2 * T.D);
    if (value !== 'nessuno') {
      const n = { linee: 9, triangoli: 4, onde: 6, righe: 7, esagoni: 5, pois: 6 }[value];
      const geo = value === 'fiocchi'
        ? { lines: [], dots: [], flakes: [{ x: -19, y: -5, r: 9, rot: 0.2 }, { x: 7, y: 8, r: 11, rot: 0.5 }, { x: 23, y: -11, r: 6, rot: 0 }, { x: -3, y: -14, r: 4, rot: 0.3 }, { x: -23, y: 14, r: 4.5, rot: 0.1 }, { x: 26, y: 13, r: 3.5, rot: 0.4 }] }
        : patternGeometry(value, T, 1.5, { n, seed: 4, w: T.lineW, angle: PATTERNS[patIndex(value)].angle || 0 });
      drawPattern(ctx, geo, { ink: fil(st.ink).hex, w: T.lineW });
    }
    ctx.restore();
  },

  /** L'anteprima 3D. Restituisce l'oggetto da mettere nel Viewer3D e la funzione che lo aggiorna. */
  createPreview(opts = {}) {
    const fc = new FaceCanvas(opts.maxPx);
    const root = new THREE.Group();
    let lid = null, model = null;
    return {
      object: root,
      canvas: fc.canvas,
      size: (st) => ({ w: MODELS[st.model].W, h: MODELS[st.model].D }),
      update(st, o = {}) {
        const metrics = paintLid(fc, st, o);
        if (model !== st.model) {
          if (lid) { root.remove(lid); lid.userData.parts.forEach((p) => p.dispose()); }
          lid = buildLid(st.model, fc.canvas, fil(st.base).hex);
          root.add(lid);
          model = st.model;
        }
        lid.userData.parts.forEach((p) => p.setColor(fil(st.base).hex));
        lid.userData.plate.texture.needsUpdate = true;
        return metrics;
      },
      dispose() { if (lid) lid.userData.parts.forEach((p) => p.dispose()); },
    };
  },
};
