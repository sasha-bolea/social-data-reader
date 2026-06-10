// Smoke test dei parser: eseguiti in Node con il percorso "files" (senza ZIP, senza DOM).
// Uso: node test/test-parsers.mjs
import { parseTinder }    from '../js/parsers/tinder.js';
import { parseInstagram } from '../js/parsers/instagram.js';
import { parseFacebook }  from '../js/parsers/facebook.js';
import { parseTwitter }   from '../js/parsers/twitter.js';
import { parseTikTok }    from '../js/parsers/tiktok.js';

let failures = 0;
const ok   = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => { failures++; console.log(`FAIL  ${msg}`); };

// ── Tinder: fixture realistica end-to-end (formato reale di data.json) ──
const tinderFixture = JSON.stringify({
  User: {
    name: 'Mario', email: 'mario@test.it', bio: 'Ciao &amp; benvenuto',
    birth_date: '2000-05-01', create_date: '2024-01-15',
    city: { name: 'Torino', region: 'Piemonte' },
    schools: [{ name: ' ITS ' }],
    descriptors: [{ name: 'Height', choices: ['180 cm'] }],
    user_interests: ['musica', 'codice'],
  },
  Usage: {
    app_opens:    { '2026-02-20': 19, '2026-02-21': 65 },
    swipes_likes: { '2026-02-20': 10 },
    swipes_passes:{ '2026-02-20': 5 },
    matches:      { '2026-02-20': 2 },
    messages_sent:{ '2026-02-20': 7 },
    messages_received: { '2026-02-20': 3 },
  },
  Messages: [{
    match_id: 'Match 1',
    messages: [
      { from: 'You', message: 'Ciao! &rsquo;sera', sent_date: '2026-02-20T10:00:00Z' },
      { from: 'Match 1', message: 'Ehi', sent_date: '2026-02-20T10:05:00Z' },
    ],
  }],
});

try {
  const d = await parseTinder(null, [{ name: 'data.json', content: tinderFixture }]);
  d.profile.name === 'Mario'            ? ok('tinder: profile.name') : fail(`tinder: profile.name = ${d.profile.name}`);
  d.profile.city === 'Torino'           ? ok('tinder: profile.city') : fail(`tinder: city = ${d.profile.city}`);
  d.profile.school === 'ITS'            ? ok('tinder: school trim') : fail(`tinder: school = '${d.profile.school}'`);
  d.usage.appOpens === 84               ? ok('tinder: usage.appOpens sum') : fail(`tinder: appOpens = ${d.usage.appOpens}`);
  d.usage.matches === 2                 ? ok('tinder: usage.matches') : fail(`tinder: matches = ${d.usage.matches}`);
  d.usage.seriesAppOpens.length === 2   ? ok('tinder: series') : fail('tinder: series len');
  d.messages.length === 1               ? ok('tinder: messages parsed') : fail('tinder: messages');
  d.messages[0].messages[0].text.includes('’') ? ok('tinder: html entities decoded') : fail(`tinder: text = ${d.messages[0].messages[0].text}`);
  d.profile.bio === 'Ciao & benvenuto'  ? ok('tinder: bio entities') : fail(`tinder: bio = ${d.profile.bio}`);
} catch (e) { fail(`tinder: throw inatteso — ${e.message}`); }

// ── Tutti i parser: input non riconosciuto → errore pulito o risultato vuoto ben formato ──
const garbage = [{ name: 'wrong.json', content: '{"foo": 1}' }];
for (const [name, fn] of [['instagram', parseInstagram], ['facebook', parseFacebook], ['twitter', parseTwitter], ['tiktok', parseTikTok], ['tinder', parseTinder]]) {
  try {
    const res = await fn(null, garbage);
    res && res.social === name ? ok(`${name}: input sconosciuto gestito (risultato vuoto)`) : fail(`${name}: risultato anomalo`);
  } catch (e) {
    e instanceof Error && e.message ? ok(`${name}: errore pulito — "${e.message.slice(0, 60)}"`) : fail(`${name}: throw non-Error`);
  }
}

console.log(failures === 0 ? '\nTUTTI I TEST PASSANO' : `\n${failures} FALLIMENTI`);
process.exit(failures === 0 ? 0 : 1);
