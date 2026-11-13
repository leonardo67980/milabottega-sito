// ============================================================================
// IL CATALOGO di Mila Bottega
// I prodotti NON si scrivono più qui: stanno nel file data/prodotti.json,
// che si modifica dal pannello di gestione (pagina /admin). Vedi LEGGIMI.md.
// Questo file li legge e li passa al resto del sito.
// ============================================================================
const DATA = await fetch(new URL('../data/prodotti.json', import.meta.url), { cache: 'no-cache' }).then((r) => r.json());

export const CATEGORIE = DATA.categorie.map((c) => c.nome);
export const CATEGORIE_TESTI = Object.fromEntries(DATA.categorie.map((c) => [c.nome, c.testo || '']));

const parseSet = (s) => { try { return typeof s === 'string' ? JSON.parse(s || '{}') : (s || {}); } catch { return {}; } };

export const PRODOTTI = DATA.prodotti.filter((p) => !p.nascosto).map((p) => {
  const foto = (p.foto || []).filter((f) => f && f.src);
  const copertina = p.copertina && p.copertina.src ? p.copertina : foto[0] || { src: 'assets/brand/logo.png', alt: p.nome, tipo: 'illustrazione' };
  return {
    ...p,
    nomeBreve: p.nomeBreve || p.nome,
    etsyUrl: p.etsyUrl || null,
    configuratore: p.configuratore || null,
    lungo: p.lungo || [],
    copertina,
    foto: foto.length ? foto : [copertina],
    dettagli: (p.dettagli || []).map((d) => [d.nome, d.valore]),
    faq: (p.faq || []).map((d) => [d.domanda, d.risposta]),
    storia: p.storia && p.storia.length ? p.storia : undefined,
    varianti: p.varianti && p.varianti.length ? p.varianti.map((v) => ({ ...v, set: parseSet(v.set) })) : undefined,
  };
});

export const prodotto = (id) => PRODOTTI.find((p) => p.id === id) || null;
export const prodottoPerConfiguratore = (pluginId) => PRODOTTI.find((p) => p.configuratore === pluginId) || null;
/** Prima i disponibili, poi quelli in arrivo (nell'ordine del catalogo) */
export const prodottiOrdinati = () => [...PRODOTTI].sort((a, b) => (a.stato === 'disponibile' ? 0 : 1) - (b.stato === 'disponibile' ? 0 : 1));
export const prodottiDi = (cat) => prodottiOrdinati().filter((p) => p.categoria === cat);
