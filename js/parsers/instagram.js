/**
 * Instagram parser
 * Supports: Meta ZIP export or individual JSON files
 *
 * Meta encodes non-ASCII chars as latin1 bytes in UTF-8 JSON.
 * fixEncoding() corrects this using the standard mojibake reversal.
 */

function fixEncoding(str) {
  if (typeof str !== 'string') return str;
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
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

async function readZipJson(zip, pathFragment) {
  const entry = Object.values(zip.files).find(f =>
    !f.dir && f.name.includes(pathFragment)
  );
  if (!entry) return null;
  try {
    const text = await entry.async('string');
    return fixObj(JSON.parse(text));
  } catch { return null; }
}

async function readAllZipJson(zip, pathFragment) {
  const entries = Object.values(zip.files).filter(f =>
    !f.dir && f.name.includes(pathFragment)
  );
  const results = await Promise.all(entries.map(async e => {
    try {
      const text = await e.async('string');
      return fixObj(JSON.parse(text));
    } catch { return null; }
  }));
  return results.filter(Boolean);
}

// ── Normalise helpers ─────────────────────────────────────────

function parseProfile(raw) {
  if (!raw) return {};
  const user = raw.profile_user?.[0]?.string_map_data || {};
  const getVal = key => {
    const entry = Object.entries(user).find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
    return entry ? entry[1]?.value || '' : '';
  };
  return {
    username:   getVal('username'),
    name:       getVal('name'),
    bio:        getVal('bio'),
    email:      getVal('email'),
    phone:      getVal('phone'),
    dateJoined: getVal('date joined'),
    private:    getVal('private') === 'True',
  };
}

function parseFollowers(rawArr) {
  if (!rawArr) return [];
  const flat = Array.isArray(rawArr) ? rawArr : [rawArr];
  return flat.flatMap(raw => {
    const list = raw?.relationships_followers || raw;
    if (!Array.isArray(list)) return [];
    return list.map(item => {
      const data = item?.string_list_data?.[0] || {};
      return { username: data.value || '', timestamp: data.timestamp };
    });
  });
}

function parseFollowing(raw) {
  if (!raw) return [];
  const list = raw?.relationships_following || [];
  return list.map(item => {
    const data = item?.string_list_data?.[0] || {};
    return { username: data.value || '', timestamp: data.timestamp };
  });
}

function parsePosts(rawArr) {
  return rawArr.flatMap(raw => {
    if (!raw) return [];
    const items = Array.isArray(raw) ? raw : [raw];
    return items.map(item => {
      const media = item?.media?.[0] || {};
      return {
        date:    media.creation_timestamp ? new Date(media.creation_timestamp * 1000) : null,
        caption: media.title || '',
        uri:     media.uri || '',
        type:    'post',
      };
    });
  });
}

function parseLikedPosts(raw) {
  if (!raw) return [];
  const list = raw?.likes_media_likes || [];
  return list.map(item => {
    const data = item?.string_list_data?.[0] || {};
    return { username: item?.title || '', href: data.href || '', timestamp: data.timestamp };
  });
}

function parseComments(rawArr) {
  return rawArr.flatMap(raw => {
    if (!raw) return [];
    const list = raw?.comments_media_comments || raw;
    if (!Array.isArray(list)) return [];
    return list.map(c => {
      const data = c?.string_map_data || {};
      return {
        text:   data['Comment']?.value || data['Commento']?.value || '',
        media:  data['Media Owner']?.value || '',
        date:   data['Time']?.timestamp ? new Date(data['Time'].timestamp * 1000) : null,
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
        sender:  m.sender_name || '',
        text:    m.content || m.share?.link || '',
        date:    m.timestamp_ms ? new Date(m.timestamp_ms) : null,
        type:    m.type || 'Generic',
      }));
    return {
      title:        raw.title || participants.filter(Boolean).join(', '),
      participants,
      messages,
      totalMessages: messages.length,
    };
  }).filter(Boolean);
}

// ── Main parser ───────────────────────────────────────────────
export async function parseInstagram(zip, files) {

  if (zip) {
    // ── ZIP mode ─────────────────────────────────────────────
    const [
      profileRaw,
      followersRaw,
      followingRaw,
      likedRaw,
    ] = await Promise.all([
      readZipJson(zip, 'personal_information.json'),
      readAllZipJson(zip, 'followers_1'),
      readZipJson(zip, 'following.json'),
      readZipJson(zip, 'liked_posts.json'),
    ]);

    const [postRaws, commentRaws, messageRaws] = await Promise.all([
      readAllZipJson(zip, '/posts/post_'),
      readAllZipJson(zip, 'post_comments'),
      readAllZipJson(zip, 'message_1.json'),
    ]);

    return {
      social:    'instagram',
      profile:   parseProfile(profileRaw),
      followers: parseFollowers(followersRaw),
      following: parseFollowing(followingRaw),
      posts:     parsePosts(postRaws),
      liked:     parseLikedPosts(likedRaw),
      comments:  parseComments(commentRaws),
      messages:  parseMessages(messageRaws),
    };
  }

  // ── Single file mode ──────────────────────────────────────
  const data = {
    social: 'instagram',
    profile: {}, followers: [], following: [],
    posts: [], liked: [], comments: [], messages: [],
  };

  for (const { name, content } of (files || [])) {
    try {
      const json = fixObj(JSON.parse(content));
      const low  = name.toLowerCase();
      if (low.includes('personal_information')) data.profile   = parseProfile(json);
      if (low.includes('followers'))            data.followers = parseFollowers([json]);
      if (low.includes('following'))            data.following = parseFollowing(json);
      if (low.includes('liked_posts'))          data.liked     = parseLikedPosts(json);
      if (low.includes('post_comments'))        data.comments  = parseComments([json]);
      if (low.includes('message_1'))            data.messages.push(...parseMessages([json]));
      if (low.includes('post_'))               data.posts.push(...parsePosts([json]));
    } catch { /* skip unreadable files */ }
  }

  return data;
}
