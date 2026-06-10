# Social Data Reader

Web app **100% client-side** per leggere e analizzare gli export dei propri dati social (i file ZIP/JSON che le piattaforme forniscono con il "download dei tuoi dati").

> 🔒 **Privacy-first**: i file non lasciano mai il dispositivo — tutta l'elaborazione avviene nel browser, nessun dato viene inviato a server.

## Come funziona

1. Scegli il social di cui vuoi analizzare i dati
2. Trascina il file ZIP (o JSON) esportato dalla piattaforma
3. Esplora statistiche e grafici generati localmente

## Stack

- **Vanilla HTML/CSS/JS** — nessun framework
- [JSZip](https://stuk.github.io/jszip/) per leggere gli archivi ZIP direttamente nel browser
- [Chart.js](https://www.chartjs.org/) per i grafici

## Social supportati

| Social | Formato export | Sezioni dashboard |
|--------|----------------|-------------------|
| Instagram | ZIP Meta o JSON singoli | Profilo, Post, Mi piace, Follower, Messaggi, Statistiche |
| Facebook | ZIP Meta o JSON singoli | Profilo, Post, Amici, Messaggi, Statistiche |
| Twitter / X | ZIP (legge i file `.js` interni) | Profilo, Tweet, Mi piace, Connessioni, Statistiche |
| TikTok | `user_data.json` o ZIP | Profilo, Video, Mi piace, Messaggi, Statistiche |
| Tinder | `data.json` | Profilo, Statistiche, Messaggi |

## Struttura

```
index.html           → shell con le 3 viste (home, upload, dashboard)
js/app.js            → stato globale + router
js/views/            → home, upload (drag&drop + dispatch parser), dashboard (tab)
js/views/sections/   → profile, feed, stats, messages, connections
js/parsers/          → un parser per social: normalizza l'export in un formato comune
css/styles.css       → stili + temi per-social
docs/                → wiki di progetto
test/                → smoke test parser (Node)
```

## Avvio locale

Sito statico, nessuna build:

```bash
npx serve .
```

## Test

```bash
node test/test-parsers.mjs
```
