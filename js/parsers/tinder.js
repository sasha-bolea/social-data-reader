/**
 * Tinder parser — basato sul formato reale di data.json
 *
 * Formato reale verificato:
 * - Usage: { app_opens: {"2026-02-20": 19, ...}, swipes_likes: {...}, ... }
 * - User: contiene tutto il profilo (no Account separato)
 * - Messages[].from = "You" per messaggi inviati
 * - Testo messaggi ha mojibake (Ã© = é) e HTML entities (&rsquo; = ')
 */

async function readZipJson(zip, fragment) {
  const entry = Object.values(zip.files).find(f =>
    !f.dir && f.name.toLowerCase().includes(fragment)
  );
  if (!entry) return null;
  try { return JSON.parse(await entry.async('string')); }
  catch { return null; }
}

// Fix mojibake (UTF-8 bytes stored as latin1)
function fixEncoding(str) {
  if (typeof str !== 'string') return str;
  try { return decodeURIComponent(escape(str)); }
  catch { return str; }
}

// Decode HTML entities nel testo (es. &rsquo; → ', &amp; → &)
function decodeHtmlEntities(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&amp;/g,    '&')
    .replace(/&lt;/g,     '<')
    .replace(/&gt;/g,     '>')
    .replace(/&quot;/g,   '"')
    .replace(/&#39;/g,    "'")
    .replace(/&rsquo;/g,  '\u2019')
    .replace(/&lsquo;/g,  '\u2018')
    .replace(/&mdash;/g,  '\u2014')
    .replace(/&ndash;/g,  '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&#(\d+);/g,       (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function cleanText(str) {
  return decodeHtmlEntities(fixEncoding(str || ''));
}

// ── Normalise helpers ─────────────────────────────────────────

function parseProfile(raw) {
  if (!raw) return {};
  const user = raw.User || {};

  // Estrae valore dai descriptors (es. Height, Drinking, Smoking…)
  const descriptor = name =>
    user.descriptors?.find(d => d.name === name)?.choices?.[0] || '';

  return {
    name:        user.name        || '',
    email:       user.email       || '',
    bio:         cleanText(user.bio || ''),
    gender:      user.sexual_orientations || user.gender || '',
    birthdate:   user.birth_date
                   ? new Date(user.birth_date).toLocaleDateString('it-IT')
                   : '',
    city:        user.city?.name    || '',
    region:      user.city?.region  || '',
    school:      user.schools?.[0]?.name?.trim() || '',
    created:     user.create_date ? new Date(user.create_date) : null,
    height:      descriptor('Height'),
    smoking:     descriptor('Smoking'),
    drinking:    descriptor('Drinking'),
    lookingFor:  descriptor('Looking for'),
    interests:   (user.user_interests || []).join(', '),
    prompt:      user.prompts?.[0]
                   ? `${user.prompts[0].questionText}: ${cleanText(user.prompts[0].answerText)}`
                   : '',
  };
}

function parseUsage(raw) {
  if (!raw?.Usage) return {};
  const u = raw.Usage;

  // Il formato reale è { "2026-02-20": 19, "2026-02-21": 65, ... }
  const sumObj = obj =>
    Object.values(obj || {}).reduce((s, v) => s + (Number(v) || 0), 0);

  const toSeries = obj =>
    Object.entries(obj || {})
      .filter(([k]) => !['advertising_id', 'idfa'].includes(k))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value: Number(value) || 0 }));

  return {
    appOpens:         sumObj(u.app_opens),
    swipesLike:       sumObj(u.swipes_likes),
    swipesPasses:     sumObj(u.swipes_passes),
    superlikes:       sumObj(u.superlikes),
    matches:          sumObj(u.matches),
    messagesSent:     sumObj(u.messages_sent),
    messagesReceived: sumObj(u.messages_received),
    // Serie temporali per i grafici
    seriesAppOpens:   toSeries(u.app_opens),
    seriesLikes:      toSeries(u.swipes_likes),
    seriesPasses:     toSeries(u.swipes_passes),
    seriesMatches:    toSeries(u.matches),
  };
}

function parseMessages(raw) {
  if (!raw?.Messages) return [];
  return raw.Messages.map(match => {
    const messages = (match.messages || [])
      .sort((a, b) => new Date(a.sent_date) - new Date(b.sent_date))
      .map(m => ({
        sender: m.from || '',                     // "You" oppure nome del match
        text:   cleanText(m.message || ''),       // fix mojibake + HTML entities
        date:   m.sent_date ? new Date(m.sent_date) : null,
      }));
    return {
      matchId:       match.match_id || '',
      title:         match.match_id || 'Match',   // già "Match 1", "Match 2"…
      participants:  [],
      messages,
      totalMessages: messages.length,
    };
  }).filter(m => m.messages.length > 0);
}

// ── Main parser ───────────────────────────────────────────────
export async function parseTinder(zip, files) {
  let raw = null;

  if (zip) {
    raw = await readZipJson(zip, 'data.json');
  } else if (files?.length) {
    for (const { content } of files) {
      try {
        const parsed = JSON.parse(content);
        // Il file reale ha User e/o Usage
        if (parsed.User || parsed.Usage || parsed.Messages) { raw = parsed; break; }
      } catch { /* skip */ }
    }
  }

  if (!raw) throw new Error('File Tinder non trovato. Assicurati di caricare data.json ricevuto via email.');

  return {
    social:    'tinder',
    profile:   parseProfile(raw),
    usage:     parseUsage(raw),
    messages:  parseMessages(raw),
  };
}
