# Il sito di Mila Bottega

Questa cartella **è** il sito. Non c'è niente da installare o da "compilare": sono solo file.
Il sito è una vetrina: non vende, non ha carrello, non usa cookie e non raccoglie dati. Gli ordini si fanno su Etsy.

## Come metterlo online

È un sito "statico": basta copiare tutta la cartella così com'è su un servizio di hosting, anche gratuito
(per esempio Netlify, Cloudflare Pages o GitHub Pages), e collegare il dominio milabottega.it.
Le cartelle `_riferimenti` e `_screenshots` non servono online: si possono lasciare fuori.

Per provarlo sul computer: aprire un terminale nella cartella, scrivere `python3 -m http.server`
e poi aprire nel browser `http://localhost:8000`. (Aprendo i file con un doppio clic l'anteprima 3D non parte.)

## Cosa c'è dentro

| File o cartella | A cosa serve |
|---|---|
| `index.html` | La pagina iniziale: vetrina 3D, collezione per categoria, "fatto a mano" |
| `collezione.html` | Tutti i prodotti, con il filtro per categoria |
| `prodotto.html` | La pagina di un prodotto (una sola, vale per tutti: `prodotto.html?p=nome-del-prodotto`) |
| `crea.html` | "Crea il tuo oggetto": si sceglie l'oggetto e parte il suo configuratore |
| `colori.html`, `laboratorio.html`, `domande.html` | I colori, chi siamo, le domande generali |
| `codice.html` | **Area laboratorio**: incolli il codice del cliente e vedi anteprima e scheda completa |
| `js/config.js` | Link (Etsy, email, social) e l'elenco dei 22 colori |
| `js/prodotti.js` | **Il catalogo**: tutti i prodotti, le categorie, testi e immagini |
| `configuratori/` | Un file per ogni configuratore (`coperchio.js`, `targa.js`) |
| `js/hero.js` | Gli oggetti 3D che girano nella vetrina della prima pagina |
| `assets/foto` | Le foto vere · `assets/render` le anteprime · `assets/illustrazioni` i disegni · `assets/brand` logo e banner |
| `css/`, `vendor/`, altri file in `js/` | Grafica e meccanica: di norma non si toccano |

Il sito è di **tutta la bottega**: nessun prodotto è "il protagonista". Nelle liste compaiono prima quelli
disponibili e poi quelli in arrivo, tutti con la scheda della stessa grandezza.

## Cambiare il link di Etsy, l'email, i social

Aprire `js/config.js` con un editor di testo. In cima c'è questo blocco:

```
ETSY_URL: 'https://www.etsy.com/it/shop/MilaBottega',
EMAIL: 'info@milabottega.it',
INSTAGRAM_URL: '#',
FACEBOOK_URL: '#',
```

Si cambia solo il testo fra gli apici. **Instagram e Facebook ora sono segnaposto (`#`)**: finché restano così,
chi li tocca vede il messaggio "la pagina social arriva presto". Mettere i link veri appena ci sono.

Ogni prodotto può avere il link al suo annuncio Etsy (`etsyUrl` nel catalogo). Se è vuoto (`null`) si usa il link del negozio.

## Aggiungere un prodotto

1. Mettere le foto in `assets/foto` (meglio quadrate, non enormi: 1600 px di lato bastano).
2. Aprire `js/prodotti.js`, copiare un blocco che va da `{` a `},` e incollarlo dove si vuole nell'elenco.
3. Cambiare:
   - `id`: un nome corto senza spazi né accenti (es. `pallina-natale`). Diventa l'indirizzo della pagina.
   - `nome`, `nomeBreve`, `breve` (una frase), `lungo` (uno o più paragrafi).
   - `categoria`: Casa, Cucina, Regali, Natale, Dipinti a mano (o una nuova: va aggiunta in `CATEGORIE` in cima al file,
     con la sua riga di presentazione in `CATEGORIE_TESTI`).
   - `stato`: `'disponibile'` oppure `'in-arrivo'`.
   - `copertina` e `foto`: il percorso della foto, una descrizione (`alt`) e il `tipo`:
     `'foto'` se è vera, `'anteprima'` se è un disegno del programma, `'illustrazione'` se è un disegno. Il sito mette l'etichetta da solo.
   - `dettagli` e `faq`: coppie "titolo, testo".
   - facoltativi: `storia` (il racconto con le foto che scorrono), `varianti`, `nota`.
4. Salvare. La scheda compare da sola nella Collezione e in prima pagina, nella sua categoria, e la pagina è `prodotto.html?p=<id>`.

Per i prodotti "in arrivo" con una sola immagine c'è una scorciatoia: i blocchi `inArrivo({ ... })`, più corti
(nome, categoria, frase breve, testo, immagine, cosa si personalizza). Per passare a un blocco completo con più foto,
storia e domande, copiare quello del coperchio.

Quando un prodotto "in arrivo" va in vendita: cambiare `stato` in `'disponibile'`, mettere le foto vere e, se c'è, il link in `etsyUrl`.

Attenzione alla punteggiatura: ogni testo sta fra apici `'...'`, e un apostrofo dentro al testo si scrive `\'` (es. `'l\'albero'`).

## Aggiungere un configuratore a un prodotto (lavoro da programmatore)

1. Copiare `configuratori/targa.js` (è l'esempio più semplice) con un nome nuovo, es. `pallina.js`.
   Dentro si definiscono: le scelte di partenza, l'elenco dei comandi, come si disegna l'anteprima,
   come si scrive e si legge il codice (con un inizio tutto suo, es. `MBP`) e la scheda per il laboratorio.
2. In `configuratori/index.js` aggiungere una riga in `PLUGINS` e l'inizio del codice in `PREFISSI`.
3. Nel catalogo, nel prodotto, scrivere `configuratore: 'pallina'`. Il prodotto compare da solo fra quelli da scegliere in "Crea il tuo oggetto".

Il resto (finestra 3D, pulsanti, codice, link da condividere, area laboratorio) è già pronto e uguale per tutti.

## I codici

- Esempio: `MB7-c4100140cn-Giulia`. L'inizio dice il prodotto (`MB6` e `MB7` coperchi, `MBT` targa),
  poi ci sono le scelte, una lettera di controllo e la scritta, che resta leggibile.
- In `codice.html` si incolla il codice (o un link intero) e si ottengono anteprima e tutti i parametri con i nomi del generatore.
  Se la lettera di controllo non torna, la pagina avvisa che il codice forse è stato copiato male.
- **Non cambiare l'ordine** dei colori in `js/config.js` né dei motivi e dei caratteri: i codici già dati ai clienti
  cambierebbero significato. Le cose nuove si aggiungono sempre **in fondo** agli elenchi.

## Cose da ricordare

- **Su Etsy non nominare mai il sito** (annunci, negozio, messaggi, bigliettini): vedi `_riferimenti`. Il sito, a sua volta, parla di Etsy solo come posto dove ordinare.
- Niente prezzi sul sito: stanno su Etsy.
- Non scrivere mai che gli oggetti sono "senza vernice" o "non dipinti": alcuni sono dipinti a mano. La formula giusta è
  "stampati con filamenti colorati veri, rifiniti a mano, alcuni dipinti a mano".
- Le immagini dei prodotti in arrivo sono illustrazioni o anteprime (il sito lo scrive sopra): vanno sostituite con le foto vere.
- La vetrina 3D della prima pagina si cambia in `js/hero.js` (elenco `SCENES`): è lavoro da programmatore.
- "Bimby" compare una volta sola, nella riga di compatibilità del coperchio (`nota` nel catalogo). Meglio non aggiungerlo altrove.
- I colori a schermo sono indicativi (valori scelti a occhio in `js/config.js`: si possono ritoccare, senza cambiare l'ordine).

## Le pagine (dal 12/11/2026)
Il sito ora è diviso in più pagine: index.html (home), collezione.html, crea.html (configuratore), colori.html, laboratorio.html, domande.html, più prodotto.html (una per ogni prodotto) e codice.html (area laboratorio). La vecchia versione a pagina unica è salvata in _riferimenti/index_unica_pagina.html.

## Pannello di gestione (dal 13/11/2026)
- I prodotti e le categorie stanno in `data/prodotti.json` (non più dentro js/prodotti.js; la vecchia versione è in _riferimenti/prodotti_vecchio.js).
- La pagina `/admin` è il pannello: si entra con l'account GitHub, si modificano prodotti, testi, stato (disponibile / in arrivo / nascosto), link Etsy e si caricano le foto (finiscono in assets/foto). Salvando, il sito si aggiorna da solo dopo circa un minuto.
- Il pannello funziona solo quando il sito è pubblicato da un deposito GitHub: il nome del deposito va scritto in `admin/config.yml` alla riga "repo".
