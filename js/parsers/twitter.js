/**
 * Twitter / X parser
 *
 * Twitter exports .js files (not .json) with a prefix like:
 *   window.YTD.tweet.part0 = [...]
 * We strip that prefix before JSON.parse.
 */

function stripYTDPrefix(content) {
  // Remove: window.YTD.something.part0 =
  return content.replace(/^\s*window\.YTD\.\w+\.\w+\s*=\s*/, '').trimEnd();
}

function parseYTD(content) {
  try {
    return JSON.parse(stripYTDPrefix(content));
  } catch {
    return null;
  }
}

async function readZipFile(zip, fragment) {
  const entry = Object.values(zip.files).find(f =>
    !f.dir && f.name.includes(fragment)
  );
  if (!entry) return null;
  return entry.async('string');
}

async function readAllZipFiles(zip, fragment) {
  const entries = Object.values(zip.files).filter(f =>
    !f.dir && f.name.includes(fragment)
  );
  return Promise.all(entries.map(e => e.async('string')));
}

// ── Normalise helpers ─────────────────────────────────────────

function parseAccount(raw) {
  if (!raw) return {};
  const acc = (Array.isArray(raw) ? raw[0] : raw)?.account || {};
  return {
    username:    acc.username || '',
    displayName: acc.accountDisplayName || '',
    email:       acc.email || '',
    createdAt:   acc.createdAt ? new Date(acc.createdAt) : null,
  };
}

function parseProfile(rawProfile, rawAccount) {
  const acc     = parseAccount(rawAccount);
  const profArr = Array.isArray(rawProfile) ? rawProfile : [];
  const prof    = profArr[0]?.profile || {};
  return {
    ...acc,
    bio:       prof.description?.bio || '',
    website:   prof.description?.website || '',
    location:  prof.description?.location || '',
  };
}

function parseTweets(rawArr) {
  return rawArr.flatMap(raw => {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      const t = item.tweet || item;
      return {
        id:        t.id_str || t.id || '',
        text:      t.full_text || t.text || '',
        date:      t.created_at ? new Date(t.created_at) : null,
        likes:     parseInt(t.favorite_count || 0, 10),
        retweets:  parseInt(t.retweet_count  || 0, 10),
        isRetweet: (t.full_text || '').startsWith('RT @'),
        isReply:   !!t.in_reply_to_user_id_str,
        lang:      t.lang || '',
      };
    });
  });
}

function parseLikes(rawArr) {
  return rawArr.flatMap(raw => {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      const l = item.like || item;
      return { tweetId: l.tweetId || '', text: l.fullText || l.expandedUrl || '' };
    });
  });
}

function parseConnections(rawArr) {
  return rawArr.flatMap(raw => {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      const f = item.follower || item.following || item;
      return { accountId: f.accountId || '', userLink: f.userLink || '' };
    });
  });
}

// ── Main parser ───────────────────────────────────────────────
export async function parseTwitter(zip, files) {

  if (zip) {
    const [accountRaw, profileRaw] = await Promise.all([
      readZipFile(zip, 'account.js'),
      readZipFile(zip, 'profile.js'),
    ]);
    const [tweetRaws, likeRaws, followerRaws, followingRaws] = await Promise.all([
      readAllZipFiles(zip, 'tweet'),
      readAllZipFiles(zip, 'like'),
      readAllZipFiles(zip, 'follower'),
      readAllZipFiles(zip, 'following'),
    ]);

    const accountParsed  = parseYTD(accountRaw  || '[]');
    const profileParsed  = parseYTD(profileRaw  || '[]');
    const tweetsParsed   = tweetRaws.map(parseYTD).filter(Boolean);
    const likesParsed    = likeRaws.map(parseYTD).filter(Boolean);
    const followersParsed = followerRaws.map(parseYTD).filter(Boolean);
    const followingParsed = followingRaws.map(parseYTD).filter(Boolean);

    return {
      social:    'twitter',
      profile:   parseProfile(profileParsed, accountParsed),
      tweets:    parseTweets(tweetsParsed),
      liked:     parseLikes(likesParsed),
      followers: parseConnections(followersParsed),
      following: parseConnections(followingParsed),
    };
  }

  // ── Single file mode ──────────────────────────────────────
  const data = {
    social: 'twitter',
    profile: {}, tweets: [], liked: [], followers: [], following: [],
  };

  let accountRaw, profileRaw;

  for (const { name, content } of (files || [])) {
    const parsed = parseYTD(content);
    if (!parsed) continue;
    const low = name.toLowerCase();
    if (low.includes('account'))  { accountRaw = parsed; }
    if (low.includes('profile'))  { profileRaw = parsed; }
    if (low.includes('tweet'))    { data.tweets.push(...parseTweets([parsed])); }
    if (low.includes('like'))     { data.liked.push(...parseLikes([parsed])); }
    if (low.includes('follower')) { data.followers.push(...parseConnections([parsed])); }
    if (low.includes('following')){ data.following.push(...parseConnections([parsed])); }
  }
  data.profile = parseProfile(profileRaw || [], accountRaw || []);

  return data;
}
