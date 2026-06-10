/**
 * TikTok parser
 * Supports: user_data.json (primary file) or ZIP containing it.
 */

async function readZipJson(zip, fragment) {
  const entry = Object.values(zip.files).find(f =>
    !f.dir && f.name.toLowerCase().includes(fragment)
  );
  if (!entry) return null;
  try { return JSON.parse(await entry.async('string')); }
  catch { return null; }
}

// ── Normalise helpers ─────────────────────────────────────────

function parseProfile(raw) {
  if (!raw) return {};
  const profile = raw.Profile || {};
  const info    = profile['Profile Information']?.ProfileMap || {};
  return {
    username:  info.userName      || '',
    nickname:  info.nickName      || '',
    bio:       info.bioDescription || '',
    email:     info.email          || '',
    birthdate: info.birthDate      || '',
    region:    info.region         || '',
  };
}

function parseVideoList(raw) {
  if (!raw) return [];
  const videos = raw.Video?.Videos?.VideoList || [];
  return videos.map(v => ({
    date:   v.Date ? new Date(v.Date) : null,
    link:   v.Link   || '',
    likes:  v.Likes  || '0',
    shares: v.Shares || '0',
    views:  v.Views  || '0',
    caption: v.Caption || '',
  }));
}

function parseLikedVideos(raw) {
  if (!raw) return [];
  const list = raw.Activity?.['Like List']?.ItemFavoriteList || [];
  return list.map(v => ({
    date: v.Date ? new Date(v.Date) : null,
    link: v.Link || '',
  }));
}

function parseComments(raw) {
  if (!raw) return [];
  const list = raw.Comment?.['Comments']?.CommentsList ||
               raw.Activity?.['Comment List']?.CommentsList || [];
  return list.map(c => ({
    date:    c.Date ? new Date(c.Date) : null,
    comment: c.Comment || '',
  }));
}

function parseShareHistory(raw) {
  if (!raw) return [];
  const list = raw.Activity?.['Share History']?.ShareHistoryList || [];
  return list.map(s => ({
    date:  s.Date ? new Date(s.Date) : null,
    link:  s.Link || '',
    method: s.Method || '',
  }));
}

function parseMessages(raw) {
  if (!raw) return [];
  const chatHistory = raw.DirectMessages?.['Chat History']?.ChatHistory ||
                      raw.Inbox?.['Chat History']?.ChatHistory || {};
  return Object.entries(chatHistory).map(([key, msgs]) => {
    const name = key.replace(/^ChatRoom:/, '');
    const messages = (Array.isArray(msgs) ? msgs : []).map(m => ({
      sender: m.From || '',
      text:   m.Content || '',
      date:   m.Date ? new Date(m.Date) : null,
    }));
    return {
      title:        name,
      participants: [name],
      messages,
      totalMessages: messages.length,
    };
  });
}

function parseSearchHistory(raw) {
  if (!raw) return [];
  const list = raw.Activity?.['Search History']?.SearchList || [];
  return list.map(s => ({
    date:        s.Date ? new Date(s.Date) : null,
    searchTerm:  s.SearchTerm || '',
  }));
}

// ── Main parser ───────────────────────────────────────────────
export async function parseTikTok(zip, files) {
  let raw = null;

  if (zip) {
    raw = await readZipJson(zip, 'user_data.json');
    if (!raw) {
      // Try top-level JSON files as fallback
      const entries = Object.values(zip.files).filter(f => !f.dir && f.name.endsWith('.json'));
      for (const e of entries) {
        try {
          const parsed = JSON.parse(await e.async('string'));
          if (parsed.Profile || parsed.Activity) { raw = parsed; break; }
        } catch { /* skip */ }
      }
    }
  } else if (files?.length) {
    for (const { content } of files) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.Profile || parsed.Activity) { raw = parsed; break; }
      } catch { /* skip */ }
    }
  }

  if (!raw) throw new Error('File TikTok non trovato. Assicurati di caricare user_data.json.');

  return {
    social:       'tiktok',
    profile:      parseProfile(raw),
    videos:       parseVideoList(raw),
    liked:        parseLikedVideos(raw),
    comments:     parseComments(raw),
    shareHistory: parseShareHistory(raw),
    messages:     parseMessages(raw),
  };
}
