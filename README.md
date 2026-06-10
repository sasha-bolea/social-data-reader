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

## Avvio locale

Sito statico, nessuna build:

```bash
npx serve .
```

> ⚠️ Il codice dell'app è in sviluppo locale e non è ancora stato pushato in questa repo.
