// ============================================================================
// Mila Bottega · cassetta degli attrezzi 3D condivisa da tutti i configuratori
//  - Viewer3D: la finestra 3D (luci, ruota col dito, torna alla vista iniziale)
//  - FaceCanvas: il "foglio" su cui si disegna la faccia del pezzo (in millimetri)
//  - makePlate / makeBody: pezzi estrusi con l'aspetto del PLA opaco con brillantini
// ============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FONTS, rng, luminance } from './config.js';

export { THREE };

export const isSmallScreen = () => Math.min(window.innerWidth, window.innerHeight) < 700;
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Aspetta che i caratteri delle scritte siano pronti (altrimenti il disegno userebbe un carattere qualunque) */
export async function loadFonts() {
  if (!document.fonts?.load) return;
  try {
    await Promise.all(FONTS.map((f) => document.fonts.load(f.css.replace('100px', '40px'), 'Giulia 12')));
  } catch { /* si disegna lo stesso */ }
}

// ----------------------------------------------------------------------------
// Trame condivise (grana del piatto di stampa, righe degli strati, brillantini)
// ----------------------------------------------------------------------------
let _grain, _layers, _sparkle;
function grainTexture() {
  if (_grain) return _grain;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d'), r = rng(11);
  const img = x.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(r() * 90) + (r() < 0.04 ? 55 : 0);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  _grain = new THREE.CanvasTexture(c);
  _grain.wrapS = _grain.wrapT = THREE.RepeatWrapping;
  _grain.repeat.set(1 / 26, 1 / 26); // le coordinate sono in millimetri
  return _grain;
}
function layerTexture() {
  if (_layers) return _layers;
  const c = document.createElement('canvas');
  c.width = 4; c.height = 16;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 16);
  g.addColorStop(0, '#555'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#555');
  x.fillStyle = g; x.fillRect(0, 0, 4, 16);
  _layers = new THREE.CanvasTexture(c);
  _layers.wrapS = _layers.wrapT = THREE.RepeatWrapping;
  _layers.repeat.set(1, 1 / 0.7); // uno strato ogni 0,7 mm (ingrandito per vedersi)
  return _layers;
}
function sparkleTile() {
  if (_sparkle) return _sparkle;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d'), r = rng(5);
  for (let i = 0; i < 5200; i++) {
    const a = r();
    x.fillStyle = r() < 0.62 ? `rgba(255,255,255,${0.05 + a * a * 0.5})` : `rgba(0,0,0,${0.05 + a * 0.22})`;
    const s = r() < 0.12 ? 2 : 1;
    x.fillRect(Math.floor(r() * 512), Math.floor(r() * 512), s, s);
  }
  _sparkle = c;
  return c;
}

// ----------------------------------------------------------------------------
// FaceCanvas: disegno della faccia in millimetri (origine al centro, y verso il basso)
// ----------------------------------------------------------------------------
export class FaceCanvas {
  constructor(maxPx) {
    this.maxPx = maxPx || (isSmallScreen() ? 1152 : 2048);
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.w = 0; this.h = 0; this.s = 1;
  }
  /** Prepara il foglio per un pezzo largo w e alto h millimetri */
  size(w, h) {
    if (w === this.w && h === this.h) return false;
    this.w = w; this.h = h;
    this.s = Math.min(10, this.maxPx / Math.max(w, h));
    this.canvas.width = Math.round(w * this.s);
    this.canvas.height = Math.round(h * this.s);
    return true;
  }
  /** Da qui in poi si disegna in millimetri */
  mm(ctx = this.ctx) {
    ctx.setTransform(this.s, 0, 0, this.s, this.canvas.width / 2, this.canvas.height / 2);
    return ctx;
  }
  fill(hex) {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = hex;
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  /** Brillantini e grana sopra a tutto: l'effetto del PLA opaco stampato sul piatto ruvido */
  sparkle(baseHex) {
    const c = this.ctx;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = luminance(baseHex) < 0.2 ? 0.6 : 0.4;
    c.fillStyle = c.createPattern(sparkleTile(), 'repeat');
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.restore();
  }
  /** Copia di lavoro (per non ridisegnare il fondo a ogni lettera) */
  snapshot() {
    if (!this._snap) this._snap = document.createElement('canvas');
    const b = this._snap;
    if (b.width !== this.canvas.width || b.height !== this.canvas.height) { b.width = this.canvas.width; b.height = this.canvas.height; }
    b.getContext('2d').drawImage(this.canvas, 0, 0);
  }
  restore() {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.drawImage(this._snap, 0, 0);
  }
}

/** Scritta centrata in (cx, cy): prima "spazio libero" nel colore di fondo, poi la scritta. Misure in mm. */
export function drawFittedText(ctx, text, { font, size, maxW, cx = 0, cy = 0, ink, gap = 0, gapColor }) {
  if (!text) return { size: 0, w: 0, h: 0, box: null };
  const f = FONTS[font] || FONTS[0];
  let px = size * f.k;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const setFont = () => { ctx.font = `${f.weight} ${px}px ${f.family}`; };
  setFont();
  let m = ctx.measureText(text);
  let w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  if (w > maxW) { px *= maxW / w; setFont(); m = ctx.measureText(text); w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight; }
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const x = cx - w / 2 + m.actualBoundingBoxLeft;
  const y = cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  if (gap > 0 && gapColor) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = gapColor; ctx.lineWidth = gap * 2;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = ink;
  ctx.fillText(text, x, y);
  return { size: px, w, h, box: { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 } };
}

// ----------------------------------------------------------------------------
// Pezzi 3D
// ----------------------------------------------------------------------------
const bodyMat = (hex, sides) => new THREE.MeshStandardMaterial({
  color: hex, roughness: sides ? 0.6 : 0.78, metalness: 0, envMapIntensity: 0.5,
  bumpMap: sides ? layerTexture() : grainTexture(), bumpScale: sides ? 0.9 : 0.55,
});

/**
 * Lastra estrusa con la faccia davanti dipinta da un canvas.
 * shape: THREE.Shape in mm (y verso l'alto) · w,h: misure del foglio del canvas · z0: quota della base
 */
export function makePlate({ shape, thickness, bevel = 0.5, canvas, w, h, z0 = 0, hex = '#222' }) {
  const b = Math.min(bevel, thickness / 2 - 0.05);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b,
    bevelSegments: 2, curveSegments: 24,
  });
  geo.translate(0, 0, z0 + b);
  // i due "tappi" (davanti e dietro) sono nello stesso gruppo: si separano per dare al davanti il disegno
  const caps = geo.groups.find((g) => g.materialIndex === 0), side = geo.groups.find((g) => g.materialIndex === 1);
  const half = caps.count / 2, pos = geo.attributes.position;
  const firstIsFront = pos.getZ(caps.start) > z0 + thickness / 2;
  geo.clearGroups();
  geo.addGroup(caps.start, half, firstIsFront ? 0 : 1);
  geo.addGroup(caps.start + half, half, firstIsFront ? 1 : 0);
  geo.addGroup(side.start, side.count, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(1 / w, 1 / h); // le coordinate della faccia sono in mm: si riportano a 0..1
  tex.offset.set(0.5, 0.5);
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.74, metalness: 0, envMapIntensity: 0.32, bumpMap: grainTexture(), bumpScale: 0.5 });
  const back = bodyMat(hex, false), sides = bodyMat(hex, true);
  const mesh = new THREE.Mesh(geo, [face, back, sides]);
  return {
    mesh, texture: tex,
    setColor(c) { back.color.set(c); sides.color.set(c); },
    dispose() { geo.dispose(); tex.dispose(); face.dispose(); back.dispose(); sides.dispose(); },
  };
}

/** Pezzo estruso a tinta unita (pareti, sponde, rilievi) */
export function makeBody({ shape, height, z0 = 0, hex = '#222', bevel = 0 }) {
  const geo = new THREE.ExtrudeGeometry(shape, bevel > 0
    ? { depth: height - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 2, curveSegments: 24 }
    : { depth: height, bevelEnabled: false, curveSegments: 24 });
  geo.translate(0, 0, z0 + (bevel > 0 ? bevel : 0));
  const caps = bodyMat(hex, false), sides = bodyMat(hex, true);
  const mesh = new THREE.Mesh(geo, [caps, sides]);
  return {
    mesh,
    setColor(c) { caps.color.set(c); sides.color.set(c); },
    dispose() { geo.dispose(); caps.dispose(); sides.dispose(); },
  };
}

/** Rettangolo con angoli tondi come THREE.Shape (centro nell'origine) */
export function roundRectShape(w, h, r, into = new THREE.Shape()) {
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  into.moveTo(x + r, y);
  into.lineTo(x + w - r, y);
  into.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  into.lineTo(x + w, y + h - r);
  into.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  into.lineTo(x + r, y + h);
  into.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  into.lineTo(x, y + r);
  into.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return into;
}

// ----------------------------------------------------------------------------
// Viewer3D: la finestra con il pezzo
// ----------------------------------------------------------------------------
export class Viewer3D {
  /**
   * el: contenitore · opts.interactive: si ruota col dito/mouse · opts.onFrame(t, dt, viewer)
   * opts.view: { az, pol } angoli della vista iniziale · opts.margin: aria attorno al pezzo
   */
  constructor(el, opts = {}) {
    this.el = el;
    this.opts = { interactive: true, margin: 1.2, view: { az: -0.34, pol: 1.3 }, ...opts };
    this.ok = false;
    this.size = { w: 250, h: 170 };
    this.content = null;
    this._running = false; this._visible = false; this._needs = true;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      el.classList.add('no-webgl');
      return;
    }
    this.ok = true;
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping; // i colori dei filamenti restano fedeli
    r.setClearColor(0x000000, 0);
    r.domElement.setAttribute('aria-hidden', 'true');
    el.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    const key = new THREE.DirectionalLight(0xfff4e6, 1.7);
    key.position.set(-180, 260, 420);
    const rim = new THREE.DirectionalLight(0xcfe8ff, 0.7);
    rim.position.set(260, -120, -300);
    this.scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.25));

    this.camera = new THREE.PerspectiveCamera(28, 1, 10, 6000);
    this.stage = new THREE.Group(); // qui dentro va il pezzo: l'animazione della copertina muove questo
    this.scene.add(this.stage);

    if (this.opts.interactive) {
      const c = (this.controls = new OrbitControls(this.camera, r.domElement));
      c.enablePan = false; c.enableZoom = false; c.enableDamping = true; c.dampingFactor = 0.08;
      c.rotateSpeed = 0.9;
      c.addEventListener('change', () => { this._needs = true; });
      c.addEventListener('start', () => { this._anim = null; this._touched = true; el.classList.add('is-touched'); });
      // sul telefono lo scorrimento in verticale resta alla pagina: si ruota trascinando di lato
      r.domElement.style.touchAction = 'pan-y';
    }
    this._placeCamera();

    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(el);
    this._io = new IntersectionObserver((en) => {
      this._visible = en[0].isIntersecting;
      this._visible ? this.start() : this.stop();
    }, { rootMargin: '80px' });
    this._io.observe(el);
    this._onVis = () => (document.hidden ? this.stop() : this._visible && this.start());
    document.addEventListener('visibilitychange', this._onVis);
    this.resize();
  }

  /** Mette in scena un pezzo (THREE.Object3D) largo w e alto h millimetri */
  setContent(obj, size) {
    if (!this.ok) return;
    if (this.content !== obj) {
      if (this.content) this.stage.remove(this.content);
      this.content = obj;
      if (obj) this.stage.add(obj);
    }
    if (size && (size.w !== this.size.w || size.h !== this.size.h)) { this.size = { ...size }; this._fit(); }
    this._needs = true;
  }
  invalidate() { this._needs = true; }

  _distance() {
    const { w, h } = this.size, m = this.opts.margin;
    const v = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const dV = (h / 2) * m / Math.tan(v);
    const dH = (w / 2) * m / (Math.tan(v) * this.camera.aspect);
    return Math.max(dV, dH) + 20;
  }
  _placeCamera() {
    const d = this._distance(), { az, pol } = this.opts.view;
    this.camera.position.set(d * Math.sin(pol) * Math.sin(az), d * Math.cos(pol), d * Math.sin(pol) * Math.cos(az));
    this.camera.lookAt(0, 0, 0);
    if (this.controls) { this.controls.target.set(0, 0, 0); this.controls.update(); }
    this._needs = true;
  }
  _fit() {
    if (!this.ok) return;
    if (this._touched && this.controls) {
      // tiene l'angolo scelto dalla persona, cambia solo la distanza
      this.camera.position.setLength(this._distance());
      this.controls.update();
      this._needs = true;
    } else this._placeCamera();
  }
  _sph(az, pol, d) {
    return new THREE.Vector3(d * Math.sin(pol) * Math.sin(az), d * Math.cos(pol), d * Math.sin(pol) * Math.cos(az));
  }
  /** Porta la vista a un certo angolo (az = giro attorno al pezzo). Senza angolo: vista iniziale. */
  lookFrom(az = null, ms = 620) {
    if (!this.ok) return;
    const home = az === null;
    if (home) { this._touched = false; this.el.classList.remove('is-touched'); }
    const d = this._distance(), { pol } = this.opts.view;
    const a1 = home ? this.opts.view.az : az;
    if (reducedMotion()) {
      this.camera.position.copy(this._sph(a1, pol, d)); this.camera.lookAt(0, 0, 0); this.controls?.update(); this._needs = true;
      return;
    }
    const p = this.camera.position, d0 = p.length();
    const pol0 = Math.acos(THREE.MathUtils.clamp(p.y / d0, -1, 1));
    let a0 = Math.atan2(p.x, p.z);
    // si gira dalla parte più corta
    while (a1 - a0 > Math.PI) a0 += Math.PI * 2;
    while (a1 - a0 < -Math.PI) a0 -= Math.PI * 2;
    const t0 = performance.now();
    this._anim = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      this.camera.position.copy(this._sph(a0 + (a1 - a0) * e, pol0 + (pol - pol0) * e, d0 + (d - d0) * e));
      this.camera.lookAt(0, 0, 0);
      if (k >= 1) { this._anim = null; this.controls?.update(); }
    };
  }
  resetView() { this.lookFrom(null); }
  /** Piccolo dondolio per far capire che il pezzo si può girare */
  nudge() {
    if (!this.ok || this._touched) return;
    const { az, pol } = this.opts.view, t0 = performance.now();
    this._anim = (now) => {
      const k = Math.min(1, (now - t0) / 1600);
      if (this._touched) { this._anim = null; return; }
      const a = az + Math.sin(k * Math.PI * 2) * 0.22 * (1 - k * 0.3);
      this.camera.position.copy(this._sph(a, pol, this._distance()));
      this.camera.lookAt(0, 0, 0);
      if (k >= 1) { this._anim = null; this._placeCamera(); }
    };
  }
  resize() {
    if (!this.ok) return;
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._fit();
  }
  start() {
    if (!this.ok || this._running || document.hidden) return;
    this._running = true;
    let last = performance.now();
    const tick = (now) => {
      if (!this._running) return;
      this._raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (this._anim) { this._anim(now); this._needs = true; }
      else if (this.controls) this.controls.update();
      if (this.opts.onFrame) { if (this.opts.onFrame(now / 1000, dt, this) !== false) this._needs = true; }
      if (this._needs) { this._needs = false; this.renderer.render(this.scene, this.camera); }
    };
    this._raf = requestAnimationFrame(tick);
  }
  stop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
  }
  dispose() {
    this.stop();
    if (!this.ok) return;
    this._ro.disconnect(); this._io.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    this.controls?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

// ----------------------------------------------------------------------------
// Solidi "di rivoluzione" con il gusto dei generatori di laboratorio:
// vasi a coste ritorte, a onde, sfaccettati (low poly), paralumi…
// ----------------------------------------------------------------------------
/**
 * profile(t) = raggio in mm lungo l'altezza (t da 0 in basso a 1 in alto)
 * ribs = numero di coste · amp = quanto sporgono (0..0.3) · twist = giri di torsione
 * waves = onde in altezza · seg/rows = finezza (pochi + flat = low poly)
 */
export function makeTurned({ height, profile, ribs = 0, amp = 0, twist = 0, waves = 0, waveAmp = 0, seg = 96, rows = 64, flat = false, hex = '#eee', glow = 0 }) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows, y = (t - 0.5) * height;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      let r = profile(t);
      if (ribs) r *= 1 + amp * Math.cos(ribs * a + twist * Math.PI * 2 * t);
      if (waves) r *= 1 + waveAmp * Math.sin(waves * Math.PI * 2 * t + (flat ? 0 : a));
      if (flat && j % 2) r *= 1; // le file sfalsate sotto danno le facce a diamante
      const aa = a + (flat && j % 2 ? Math.PI / seg : 0);
      pos.push(r * Math.cos(aa), y, r * Math.sin(aa));
      uv.push(i / seg, y);
    }
  }
  const W = seg + 1;
  for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) {
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    if (flat && j % 2) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
  }
  // fondo
  const base = pos.length / 3;
  pos.push(0, -height / 2, 0); uv.push(0.5, -height / 2);
  for (let i = 0; i < seg; i++) idx.push(base, i, i + 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const g = flat ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: hex, roughness: 0.62, metalness: 0, side: THREE.DoubleSide, flatShading: flat, envMapIntensity: 0.5,
    bumpMap: flat ? null : layerTexture(), bumpScale: 0.7,
    emissive: glow ? new THREE.Color(hex) : new THREE.Color(0x000000), emissiveIntensity: glow,
  });
  const mesh = new THREE.Mesh(g, mat);
  return { mesh, dispose() { g.dispose(); mat.dispose(); } };
}
