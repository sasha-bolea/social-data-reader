# Social Data Reader — Wiki di progetto

Web app 100% client-side per analizzare gli export dati dei social (ZIP/JSON). Nessun backend: la privacy è il vincolo di design centrale, tutta l'elaborazione avviene nel browser.

## Architettura

Flusso: **home** (scelta social) → **upload** (drag&drop ZIP/JSON) → **parser** → **dashboard** (tab per sezione).

- [`js/app.js`](../js/app.js) — stato globale `App` (social attivo, dati parsati) + router a viste. Le viste sono `div.view` in [`index.html`](../index.html), attivate via classe `active`.
- [`js/views/upload.js`](../js/views/upload.js) — gestione file (drop + file picker), istruzioni per richiedere l'export da ogni piattaforma, dispatch al parser giusto via mappa `PARSERS`.
- [`js/parsers/*.js`](../js/parsers/) — un modulo per social. Contratto comune: `parse<Social>(zip, files)` dove `zip` è un'istanza JSZip oppure `files` è un array `{name, content}`. Restituiscono un oggetto normalizzato `{social, profile, ...}`; lanciano `Error` con messaggio user-friendly se il file non è riconosciuto.
- [`js/views/dashboard.js`](../js/views/dashboard.js) — header con badge riassuntivi + tab nav. Le tab disponibili variano per social (mappa `SOCIAL_TABS`). Render lazy: ogni pane è renderizzato solo alla prima attivazione.
- [`js/views/sections/`](../js/views/sections/) — render delle singole tab (profile, feed, stats con Chart.js, messages, connections). Ricevono `(pane, social, data)` e si adattano al social.

## Perché queste scelte

- **Vanilla JS + ES modules, no build**: deploy statico ovunque, zero dipendenze da mantenere. JSZip e Chart.js via CDN.
- **Parser separati per social**: i formati export sono molto diversi (Meta JSON annidati, Twitter file `.js` con prefisso, Tinder singolo `data.json`). Normalizzare in un formato comune tiene le sezioni UI agnostiche.
- **Fix encoding in tinder.js**: l'export reale Tinder ha mojibake (UTF-8 letto come latin1) e HTML entities nel testo — `cleanText()` li corregge.

## Test

`node test/test-parsers.mjs` — smoke test dei parser eseguiti in Node (percorso `files`, senza DOM): fixture realistica Tinder end-to-end + verifica errore pulito su input sconosciuto.

## Note operative

- Export reali verificati: Tinder (`data.json`). Gli altri parser sono basati sui formati documentati degli export — da validare con archivi reali.
- Instagram/Facebook/Twitter con input non riconosciuto restituiscono dashboard vuota invece di errore (miglioria possibile: validare e mostrare messaggio).
