// ============================================================================
// Mila Bottega · impostazioni condivise da tutto il sito
// ============================================================================
// QUI si cambiano i link. Basta modificare il testo fra virgolette.
export const CONFIG = {
  // Indirizzo del negozio Etsy (usato da tutti i pulsanti «Ordina su Etsy»)
  ETSY_URL: 'https://www.etsy.com/it/shop/MilaBottega',
  // Email di contatto
  EMAIL: 'info@milabottega.it',
  // SEGNAPOSTO: mettere qui i link veri delle pagine social (ora '#' = nessun link)
  INSTAGRAM_URL: '#',
  FACEBOOK_URL: '#',
  // Indirizzo pubblico del sito (serve solo per i link da condividere)
  SITE_URL: 'https://milabottega.it/',
};

// ----------------------------------------------------------------------------
// I 22 filamenti veri. ATTENZIONE: l'ordine fa parte dei codici già dati ai
// clienti. Non cambiare l'ordine e non togliere righe: i colori nuovi si
// aggiungono IN FONDO. I colori a schermo sono indicativi.
// ----------------------------------------------------------------------------
export const FILAMENTS = [
  { id: 'caramello', name: 'Caramello', hex: '#AE835B' },
  { id: 'grigio-nardo', name: 'Grigio nardo', hex: '#77777A' },
  { id: 'desert-tan', name: 'Desert tan', hex: '#E0D2AE' },
  { id: 'terracotta', name: 'Terracotta', hex: '#B15533' },
  { id: 'rosso-scarlatto', name: 'Rosso scarlatto', hex: '#D93A34' },
  { id: 'marmo-bianco', name: 'Marmo bianco', hex: '#EDEAE4', speckle: true },
  { id: 'verde-erba', name: 'Verde erba', hex: '#5DBE78' },
  { id: 'blu-ghiaccio', name: 'Blu ghiaccio', hex: '#A3D8E1' },
  { id: 'rosa-sakura', name: 'Rosa sakura', hex: '#E8AFCF' },
  { id: 'marrone-cacao', name: 'Marrone cacao', hex: '#6F5034' },
  { id: 'bianco-giada', name: 'Bianco giada', hex: '#F8F8F4' },
  { id: 'giallo-girasole', name: 'Giallo girasole', hex: '#FCC419' },
  { id: 'nero', name: 'Nero', hex: '#1B1B1E' },
  { id: 'viola', name: 'Viola', hex: '#5E43B7' },
  { id: 'verde-bambu', name: 'Verde bambù', hex: '#12A150' },
  { id: 'bianco-avorio', name: 'Bianco avorio', hex: '#F1EBDD' },
  { id: 'arancia-mandarino', name: 'Arancia mandarino', hex: '#F4915A' },
  { id: 'giallo-limone', name: 'Giallo limone', hex: '#F4DA5C' },
  { id: 'antracite', name: 'Antracite', hex: '#3C3D40' },
  { id: 'marrone-latte', name: 'Marrone latte', hex: '#CDB09E' },
  { id: 'blu-cobalto', name: 'Blu cobalto', hex: '#1556B5' },
  { id: 'beige', name: 'Beige', hex: '#F2E1D4' },
];
export const filIndex = (id) => Math.max(0, FILAMENTS.findIndex((f) => f.id === id));
export const fil = (i) => FILAMENTS[i] || FILAMENTS[0];

// I caratteri per le scritte (anche qui: non cambiare l'ordine, i nuovi in fondo)
export const FONTS = [
  { id: 'great-vibes', name: 'Great Vibes', css: '400 100px "Great Vibes"', family: '"Great Vibes"', weight: 400, k: 1 },
  { id: 'dancing-script', name: 'Dancing Script', css: '700 100px "Dancing Script"', family: '"Dancing Script"', weight: 700, k: 0.9 },
  { id: 'pacifico', name: 'Pacifico', css: '400 100px "Pacifico"', family: '"Pacifico"', weight: 400, k: 0.72 },
  { id: 'montserrat', name: 'Montserrat', css: '800 100px "Montserrat"', family: '"Montserrat"', weight: 800, k: 0.6 },
];
export const fontCss = (i, sizePx) => {
  const f = FONTS[i] || FONTS[0];
  return `${f.weight} ${sizePx}px ${f.family}`;
};

// ----------------------------------------------------------------------------
// Piccoli attrezzi
// ----------------------------------------------------------------------------
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Generatore di numeri "a caso" ripetibile: stesso seme = stesso disegno */
export function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Luminosità percepita 0..1 di un colore #rrggbb */
export function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(hexA, hexB) {
  const a = luminance(hexA), b = luminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Toglie caratteri invisibili e accorcia */
export function cleanText(s, max = 20) {
  return Array.from(String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ')).slice(0, max).join('');
}

// ----------------------------------------------------------------------------
// MOTORE DEI CODICI (uguale per tutti i prodotti)
//
//   PREFISSO-PARAMETRI-TESTO[-TESTO2...]
//   es.  MB7-c4100140cn-Giulia
//
// PREFISSO  = dice quale prodotto è (MB6, MB7 coperchi; MBT targa; ...)
// PARAMETRI = lettere e cifre minuscole scelte dal configuratore del prodotto,
//             l'ultima è una cifra di controllo (scopre gli errori di battitura)
// TESTO     = le scritte, leggibili: lettere e cifre restano uguali, lo spazio
//             diventa «_», tutto il resto diventa «.codice.» (es. è = .e8.)
// Il codice usa solo caratteri sicuri per link e campi di testo.
// ----------------------------------------------------------------------------
const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
export const b36 = (n, len = 1) => Math.max(0, Math.round(n)).toString(36).padStart(len, '0').slice(-len);
export const un36 = (s) => {
  const v = parseInt(s, 36);
  return Number.isFinite(v) ? v : NaN;
};

export function encText(s) {
  let out = '';
  for (const ch of String(s)) {
    if (/[A-Za-z0-9]/.test(ch)) out += ch;
    else if (ch === ' ') out += '_';
    else out += '.' + ch.codePointAt(0).toString(16) + '.';
  }
  return out;
}
export function decText(s) {
  // in un solo passaggio: così un «_» vero (scritto come .5f.) non diventa uno spazio
  return String(s).replace(/\.([0-9a-fA-F]{1,6})\.|_/g, (m, h) => {
    if (m === '_') return ' ';
    try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ''; }
  });
}
function checksum(str) {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1679;
  return B36[h % 36];
}

/** Compone un codice. params = stringa di lettere/cifre; texts = elenco di scritte */
export function packCode(prefix, params, texts = []) {
  const t = texts.map(encText);
  const body = [prefix, params, ...t].join('-');
  return [prefix, params + checksum(body), ...t].join('-');
}

/** Legge un codice. Restituisce { ok, prefix, params, texts } oppure { ok:false, error } */
export function unpackCode(raw) {
  let s = String(raw || '').trim();
  // accetta anche un link intero o «c=CODICE»
  const m = s.match(/[#?&]c=([^&#\s]+)/);
  if (m) s = m[1];
  try { s = decodeURIComponent(s); } catch { /* resta com'è */ }
  s = s.replace(/[\s«»"']/g, '');
  const parts = s.split('-');
  if (parts.length < 2 || !/^MB[0-9A-Za-z]{1,3}$/.test(parts[0])) {
    return { ok: false, error: 'Questo non sembra un codice Mila Bottega: deve cominciare con «MB».' };
  }
  const prefix = parts[0].toUpperCase();
  const block = parts[1].toLowerCase();
  if (block.length < 2 || !/^[0-9a-z]+$/.test(block)) return { ok: false, error: 'Il codice è incompleto.' };
  const params = block.slice(0, -1), k = block.slice(-1);
  const textsRaw = parts.slice(2);
  const good = checksum([prefix, params, ...textsRaw].join('-')) === k;
  return {
    ok: true, prefix, params, texts: textsRaw.map(decText), checksumOk: good,
    warning: good ? null : 'La cifra di controllo non torna: forse il codice è stato copiato male. Controlla con il cliente.',
  };
}

/** Prefisso di un codice (anche dentro a un link) senza leggerlo tutto */
export function codePrefix(raw) {
  const r = unpackCode(raw);
  return r.ok ? r.prefix : null;
}

/** Legge «#c=CODICE» dall'indirizzo della pagina */
export function codeFromHash() {
  const m = location.hash.match(/[#&]c=([^&]+)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}
