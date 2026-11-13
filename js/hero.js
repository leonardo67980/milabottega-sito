// ============================================================================
// Mila Bottega · la vetrina della copertina: tanti oggetti diversi, costruiti
// al momento, che si danno il cambio. Vasi, portapiante, paralumi, portachiavi,
// sottobicchieri, la targa, il coperchio… nessuno è il protagonista.
// ============================================================================
import { fil, filIndex } from './config.js';
import { THREE, Viewer3D, FaceCanvas, drawFittedText, makePlate, makeTurned, roundRectShape, loadFonts, reducedMotion, isSmallScreen } from './cover3d.js';
import { loadPlugin } from '../configuratori/index.js';

const C = (id) => filIndex(id);
const HEX = (id) => fil(C(id)).hex;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

// ---------------------------------------------------------------- oggetti costruiti qui
function vaso() {
  const profile = (t) => 20 + 34 * Math.sin(Math.PI * Math.min(1, t * 1.12) ** 0.85) ** 1.25 + (t > 0.86 ? (t - 0.86) * 60 : 0);
  const o = makeTurned({ height: 150, profile, ribs: 14, amp: 0.085, twist: 0.55, hex: HEX('bianco-avorio') });
  return { object: o.mesh, size: { w: 150, h: 170 }, solid: true };
}
function portapiante() {
  const g = new THREE.Group();
  const pot = makeTurned({ height: 95, profile: (t) => 40 + 22 * Math.sin(t * Math.PI * 0.62), seg: 9, rows: 4, flat: true, hex: HEX('verde-bambu') });
  g.add(pot.mesh);
  // una piantina stilizzata
  const leafMat = new THREE.MeshStandardMaterial({ color: '#3E7D4F', roughness: 0.7, side: THREE.DoubleSide, flatShading: true });
  const leafGeo = new THREE.ConeGeometry(11, 62, 4);
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(leafGeo, leafMat), a = (i / 7) * Math.PI * 2;
    m.position.set(Math.cos(a) * 16, 62 + (i % 2) * 8, Math.sin(a) * 16);
    m.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    m.scale.set(1, 1, 0.25);
    g.add(m);
  }
  g.position.y = -18;
  const w = new THREE.Group(); w.add(g);
  return { object: w, size: { w: 150, h: 185 }, solid: true };
}
function paralume() {
  const o = makeTurned({ height: 130, profile: (t) => 68 - 30 * t, waves: 5, waveAmp: 0.06, ribs: 28, amp: 0.035, hex: HEX('giallo-limone'), glow: 0.35 });
  return { object: o.mesh, size: { w: 200, h: 200 }, solid: true };
}
function portachiavi(name) {
  const W = 86, H = 34, fc = new FaceCanvas(1024);
  const shape = roundRectShape(W, H, H / 2);
  const hole = new THREE.Path(); hole.absarc(-W / 2 + 12, 0, 4.2, 0, Math.PI * 2, true); shape.holes.push(hole);
  const base = HEX('rosa-sakura'), ink = HEX('nero');
  let plate;
  return {
    size: { w: W * 1.15, h: H * 2.2 }, text: name,
    get object() { return plate.mesh; },
    update(o = {}) {
      fc.size(W, H); fc.fill(base);
      drawFittedText(fc.mm(), (o.text ?? name), { font: 2, size: 26, maxW: 54, cx: 7, cy: 0, ink });
      fc.sparkle(base);
      if (!plate) plate = makePlate({ shape, thickness: 4, bevel: 0.7, canvas: fc.canvas, w: W, h: H, z0: -2, hex: base });
      plate.texture.needsUpdate = true;
    },
  };
}
function sottobicchiere() {
  const R = 48, fc = new FaceCanvas(1024), shape = new THREE.Shape();
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * Math.PI * 2, r = R * (1 + 0.08 * Math.cos(8 * a));
    i ? shape.lineTo(r * Math.cos(a), r * Math.sin(a)) : shape.moveTo(r, 0);
  }
  const base = HEX('bianco-avorio'), ink = HEX('terracotta');
  let plate;
  return {
    size: { w: 125, h: 110 },
    get object() { return plate.mesh; },
    update(o = {}) {
      const p = o.progress ?? 1, S = 2 * R * 1.1;
      fc.size(S, S); fc.fill(base);
      const c = fc.mm();
      c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 1.2; c.lineCap = 'round';
      [9, 20, 31].forEach((r, k) => { if (p > k / 3) { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2 * Math.min(1, (p - k / 3) * 3)); c.stroke(); } });
      const n = Math.round(16 * p);
      for (let i = 0; i < n; i++) {
        const a = (i / 16) * Math.PI * 2;
        c.beginPath(); c.moveTo(9 * Math.cos(a), 9 * Math.sin(a)); c.lineTo(31 * Math.cos(a), 31 * Math.sin(a)); c.stroke();
        c.beginPath(); c.arc(38 * Math.cos(a + Math.PI / 16), 38 * Math.sin(a + Math.PI / 16), 1.7, 0, Math.PI * 2); c.fill();
      }
      fc.sparkle(base);
      if (!plate) plate = makePlate({ shape, thickness: 5, bevel: 0.8, canvas: fc.canvas, w: S, h: S, z0: -2.5, hex: base });
      plate.texture.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- le scene, tutte alla pari
const SCENES = [
  { kind: 'vaso', name: 'Vaso a coste', what: 'Casa · Bianco avorio' },
  { kind: 'plugin', plugin: 'targa', name: 'Targa famiglia', what: 'Casa · tre colori', state: { nome: 'Famiglia Rossi', numero: '12', base: C('bianco-avorio'), tetto: C('verde-erba'), fig: C('terracotta'), ink: C('nero'), font: 1, adulti: 2, bambini: 1, cane: true } },
  { kind: 'portapiante', name: 'Portapiante', what: 'Casa · Verde bambù' },
  { kind: 'portachiavi', name: 'Portachiavi con nome', what: 'Regali · Rosa sakura + Nero', arg: 'Sofia' },
  { kind: 'paralume', name: 'Paralume a onde', what: 'Casa · Giallo limone' },
  { kind: 'plugin', plugin: 'coperchio', name: 'Coperchio con nome', what: 'Cucina · Nero + Rosso scarlatto', state: { model: 'tm7', base: C('nero'), ink: C('rosso-scarlatto'), pattern: 'linee', density: 15, seed: 12, text: 'Giulia', font: 0, frame: false } },
  { kind: 'sottobicchiere', name: 'Sottobicchiere', what: 'Casa · Avorio + Terracotta' },
];
const BUILD = { vaso, portapiante, paralume, portachiavi, sottobicchiere };

export async function initHero(el, { onScene } = {}) {
  const small = isSmallScreen(), still = reducedMotion();
  const plugins = {};
  for (const id of new Set(SCENES.filter((s) => s.kind === 'plugin').map((s) => s.plugin))) plugins[id] = await loadPlugin(id);
  await loadFonts();

  // ogni scena diventa { object, size, solid?, text?, update(opts) }
  const made = new Map();
  function item(s) {
    if (made.has(s)) return made.get(s);
    let it;
    if (s.kind === 'plugin') {
      const pl = plugins[s.plugin], pv = pl.createPreview({ maxPx: small ? 1024 : 1536 });
      it = { size: pv.size(s.state), text: s.state[pl.textKey], get object() { return pv.object; }, update: (o) => pv.update(s.state, o) };
    } else it = BUILD[s.kind](s.arg);
    made.set(s, it);
    return it;
  }

  const aim = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  if (!still) {
    addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; aim.x = (e.clientX / innerWidth) * 2 - 1; aim.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      aim.x = Math.max(-1, Math.min(1, e.gamma / 28));
      aim.y = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 28));
    }, { passive: true });
  }

  let i = 0, phase = 'draw', t = 0, typed = -1, spin = 0, frame = 0, turn = 0;
  const scene = () => SCENES[i];
  function show(progress, chars) {
    const it = item(scene());
    it.update?.({ progress, text: it.text != null ? Array.from(it.text).slice(0, chars).join('') : undefined });
    viewer.setContent(it.object, it.size);
  }
  const announce = () => onScene?.({ name: scene().name, what: scene().what });

  const viewer = new Viewer3D(el, {
    interactive: false, margin: small ? 1.2 : 1.32, view: { az: 0, pol: Math.PI / 2 },
    onFrame(time, dt) {
      if (still) return false;
      frame++; t += dt; turn += dt;
      const it = item(scene()), len = it.text != null ? Array.from(it.text).length : 0;
      if (phase === 'draw') {
        const k = Math.min(1, t / (it.update ? 1.1 : 0.2));
        if (it.update && (frame % 2 === 0 || k >= 1)) show(ease(k), 0);
        if (k >= 1) { phase = 'type'; t = 0; typed = 0; }
      } else if (phase === 'type') {
        const n = Math.min(len, Math.floor(t / 0.1));
        if (n !== typed) { typed = n; show(1, n); }
        if (n >= len) { phase = 'hold'; t = 0; }
      } else if (phase === 'hold') {
        if (t > (it.solid ? 3.4 : 2.4)) { phase = 'out'; t = 0; }
      } else if (phase === 'out') {
        const k = Math.min(1, t / 0.5);
        spin = ease(k) * (Math.PI / 2);
        if (k >= 1) { i = (i + 1) % SCENES.length; show(0, 0); announce(); phase = 'in'; t = 0; turn = 0; }
      } else if (phase === 'in') {
        const k = Math.min(1, t / 0.5);
        spin = -(1 - ease(k)) * (Math.PI / 2);
        if (k >= 1) { spin = 0; phase = 'draw'; t = 0; }
      }
      cur.x += (aim.x - cur.x) * Math.min(1, dt * 4);
      cur.y += (aim.y - cur.y) * Math.min(1, dt * 4);
      const g = viewer.stage, solid = item(scene()).solid;
      const sc = phase === 'out' ? 1 - ease(Math.min(1, t / 0.5)) * 0.25 : phase === 'in' ? 0.75 + ease(Math.min(1, t / 0.5)) * 0.25 : 1;
      g.scale.setScalar(sc);
      if (solid) g.rotation.set(0.2 + cur.y * 0.12, turn * 0.55 + cur.x * 0.4 + spin, 0.04, 'YXZ');
      else g.rotation.set(-0.5 + cur.y * 0.16 + Math.sin(time * 0.7) * 0.03, -0.42 + cur.x * 0.3 + spin + Math.sin(time * 0.45) * 0.05, 0.07 + Math.sin(time * 0.6) * 0.012, 'YXZ');
      g.position.y = Math.sin(time * 0.9) * 3;
      return true;
    },
  });
  if (!viewer.ok) return null;
  viewer.stage.rotation.set(0.2, 0.3, 0.04, 'YXZ');
  announce();
  show(still ? 1 : 0, still ? 99 : 0);
  el.classList.add('is-ready');
  return viewer;
}
