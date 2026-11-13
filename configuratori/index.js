// ============================================================================
// Elenco dei configuratori (uno per tipo di prodotto).
// Per aggiungerne uno: crea configuratori/<nome>.js copiando targa.js,
// poi aggiungi qui sotto una riga in PLUGINS e i suoi prefissi in PREFISSI.
// ============================================================================
export const PLUGINS = {
  coperchio: () => import('./coperchio.js'),
  targa: () => import('./targa.js'),
};

// Inizio del codice  →  configuratore che lo sa leggere
export const PREFISSI = {
  MB6: 'coperchio',
  MB7: 'coperchio',
  MBT: 'targa',
};

export async function loadPlugin(id) {
  if (!PLUGINS[id]) throw new Error('Configuratore sconosciuto: ' + id);
  return (await PLUGINS[id]()).default;
}
export const pluginIdForPrefix = (prefix) => PREFISSI[String(prefix || '').toUpperCase()] || null;
