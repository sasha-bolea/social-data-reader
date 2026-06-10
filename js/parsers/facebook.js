/**
 * Facebook parser
 * Supports: Meta ZIP export or individual JSON files
 * Same encoding quirk as Instagram — fixEncoding applied.
 */

function fixEncoding(str) {
  if (typeof str !== 'string') return str;
  try { return decodeURIComponent(escape(str)); }
  catch { return str; }
}

function fixObj(obj) {
  if (typeof obj === 'string') return fixEncoding(obj);
  if (Array.isArray(obj))     return obj.map(fixObj);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = fixObj(obj[k]);
    return out;
  }
  return obj;
}

async function readZipJson(zip, fragment) {
  const entry = Object.values(zip.files).find(f =>
    !f.dir && f.name.includes(fragment)
  );
  if (!entry) return null;
  try { return fixObj(JSON.parse(await entry.async('string'))); }
  catch { return null; }
}

async function readAllZipJson(zip, fragment) {
  const entries = Object.values(zip.files).filter(f =>
    !f.dir && f.name.includes(fragment)
  );
  const results = await Promise.all(entries.map(async e => {
    try { return fixObj(JSON.parse(await e.async('string'))); }
    catch { return null; }
  }));
  return results.filter(Boolean);
}

// ── Normalise helpers ─────────────────────────────────────────

function parseProfile(raw) {
  if (!raw) return {};
  const info = raw.profile_v2?.[0] || {};
  const nameData = info.name || {};
  const addrs    = info.emails?.emails || [];
  return {
    name:       [nameData.first_name, nameData.middle_name, nameData.last_name].filter(Boolean).join(' '),
    username:   info.username || '',
    email:      addrs[0] || '',
    gender:     info.gender?.pronoun || '',
    birthday:   info.birthday ? `${info.birthday.year}-${String(info.birthday.month).padStart(2,'0')}-${String(info.birthday.day).padStart(2,'0')}` : '',
    dateJoined: info.registration_timestamp ? new Date(info.registration_timestamp * 1000).toLocaleDateString('it-IT') : '',
  };
}

function parsePosts(rawArr) {
  return rawArr.flatMap(raw => {
    if (!raw) return [];
    const items = Array.isArray(raw) ? raw : [raw];
    return items.map(item => {
      const textData = item?.data?.find(d => d.post) || {};
      const attach   = (item?.attachments || []).flatMap(a => a.data || []);
      const media    = attach.find(a => a.media);
      return {
        date:    item.timestamp ? new Date(item.timestamp * 1000) : null,
        caption: textData.post || item.title || '',
        uri:     media?.media?.uri || '',
        type:    media?.media?.media_metadata?.photo_metadata ? 'photo' : 'post',
      };
    });
  });
}

function parseFriends(raw) {
  if (!raw) return [];
  const list = raw.friends_v2 || raw.friends || [];
  return list.map(item => {
    const data = item?.string_list_data?.[0] || {};
    return { name: item.name || data.value || '', timestamp: data.timestamp };
  });
}

function parseComments(rawArr) {
  return rawArr.flatMap(raw => {
    if (!raw) return [];
    const list = raw.comments_v2 || raw.comments || [];
    return list.map(c => {
      const data = (c.data || []).find(d => d.comment) || {};
      return {
        text:   data.comment?.comment || '',
        author: data.comment?.author  || '',
        date:   c.timestamp ? new Date(c.timestamp * 1000) : null,
      };
    });
  });
}

function parseReactions(rawArr) {
  return rawArr.flatMap(raw => {
    if (!raw) return [];
    const list = raw.reactions_v2 || raw.reactions || [];
    return list.map(r => {
      const data = (r.data || []).find(d => d.reaction) || {};
      return {
        reaction: data.reaction?.reaction || '',
        actor:    data.reaction?.actor    || '',
        title:    r.title || '',
        date:     r.timestamp ? new Date(r.timestamp * 1000) : null,
      };
    });
  });
}

function parseMessages(rawArr) {
  return rawArr.map(raw => {
    if (!raw) return null;
    const participants = (raw.participants || []).map(p => p.name || '');
    const messages = (raw.messages || [])
      .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
      .map(m => ({
        sender: m.sender_name || '',
        text:   m.content || '',
        date:   m.timestamp_ms ? new Date(m.timestamp_ms) : null,
      }));
    return {
      title:        raw.title || participants.join(', '),
      participants,
      messages,
      totalMessages: messages.length,
    };
  }).filter(Boolean);
}

// ── Main parser ───────────────────────────────────────────────
export async function parseFacebook(zip, files) {

  if (zip) {
    const [profileRaw, friendsRaw] = await Promise.all([
      readZipJson(zip, 'profile_information.json'),
      readZipJson(zip, 'friends.json'),
    ]);
    const [postRaws, commentRaws, reactionRaws, messageRaws] = await Promise.all([
      readAllZipJson(zip, 'your_posts'),
      readAllZipJson(zip, 'comments.json'),
      readAllZipJson(zip, 'post_reactions.json'),
      readAllZipJson(zip, 'message_1.json'),
    ]);

    return {
      social:    'facebook',
      profile:   parseProfile(profileRaw),
      friends:   parseFriends(friendsRaw),
      posts:     parsePosts(postRaws),
      comments:  parseComments(commentRaws),
      reactions: parseReactions(reactionRaws),
      messages:  parseMessages(messageRaws),
    };
  }

  // ── Single file mode ──────────────────────────────────────
  const data = {
    social: 'facebook',
    profile: {}, friends: [], posts: [],
    comments: [], reactions: [], messages: [],
  };

  for (const { name, content } of (files || [])) {
    try {
      const json = fixObj(JSON.parse(content));
      const low  = name.toLowerCase();
      if (low.includes('profile_information')) data.profile   = parseProfile(json);
      if (low.includes('friends'))             data.friends   = parseFriends(json);
      if (low.includes('your_posts'))          data.posts.push(...parsePosts([json]));
      if (low.includes('comments'))            data.comments.push(...parseComments([json]));
      if (low.includes('post_reactions'))      data.reactions.push(...parseReactions([json]));
      if (low.includes('message_1'))           data.messages.push(...parseMessages([json]));
    } catch { /* skip */ }
  }

  return data;
}
