const PAGE_SIZE = 30;

export function renderFeed(pane, social, data, mode) {
  // mode: 'main' (posts/tweets/videos) | 'liked'
  const items = getItems(social, data, mode);
  const title = getFeedTitle(social, mode, items.length);

  pane.innerHTML = `
    <div class="section-toolbar">
      <h3>${title}</h3>
      <input class="search-input" id="feed-search" type="search" placeholder="Cerca...">
    </div>
    <div id="feed-list" class="feed-list"></div>
    <div class="load-more-wrap">
      <button class="btn btn-ghost" id="load-more-btn" style="display:none">
        Carica altri
      </button>
    </div>
  `;

  let filtered = items;
  let page = 0;

  function render() {
    const list = document.getElementById('feed-list');
    list.innerHTML = '';
    if (!filtered.length) {
      list.innerHTML = noDataHtml('Nessun risultato trovato.');
      document.getElementById('load-more-btn').style.display = 'none';
      return;
    }
    const slice = filtered.slice(0, (page + 1) * PAGE_SIZE);
    slice.forEach(item => {
      const el = document.createElement('div');
      el.className = 'feed-item';
      el.innerHTML = buildItemHtml(social, item, mode);
      list.appendChild(el);
    });
    const btn = document.getElementById('load-more-btn');
    btn.style.display = slice.length < filtered.length ? 'inline-flex' : 'none';
  }

  render();

  document.getElementById('load-more-btn').addEventListener('click', () => {
    page++;
    render();
  });

  document.getElementById('feed-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    filtered = q ? items.filter(it => itemMatchesSearch(social, it, q)) : items;
    page = 0;
    render();
  });
}

// ── Data selection ────────────────────────────────────────────
function getItems(social, data, mode) {
  if (mode === 'liked') {
    return (data.liked || []).slice().reverse();
  }
  switch (social) {
    case 'instagram': return (data.posts     || []).slice().sort(byDateDesc);
    case 'facebook':  return (data.posts     || []).slice().sort(byDateDesc);
    case 'twitter':   return (data.tweets    || []).slice().sort(byDateDesc);
    case 'tiktok':    return (data.videos    || []).slice().sort(byDateDesc);
    default: return [];
  }
}

function byDateDesc(a, b) {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return b.date - a.date;
}

function getFeedTitle(social, mode, count) {
  const label = {
    instagram: mode === 'liked' ? 'Post piaciuti'  : 'Post',
    facebook:  mode === 'liked' ? 'Post piaciuti'  : 'Post',
    twitter:   mode === 'liked' ? 'Tweet piaciuti' : 'Tweet',
    tiktok:    mode === 'liked' ? 'Video piaciuti' : 'Video',
  }[social] || 'Contenuti';
  return `${label} <span class="count-pill">${count}</span>`;
}

// ── Item renderers ────────────────────────────────────────────
function buildItemHtml(social, item, mode) {
  if (mode === 'liked') return buildLikedHtml(social, item);
  switch (social) {
    case 'instagram': return buildPostHtml(item);
    case 'facebook':  return buildPostHtml(item);
    case 'twitter':   return buildTweetHtml(item);
    case 'tiktok':    return buildVideoHtml(item);
    default: return '';
  }
}

function buildPostHtml(item) {
  const date    = item.date ? formatDate(item.date) : '—';
  const caption = item.caption || '(nessuna didascalia)';
  const type    = item.type || 'post';
  return `
    <div class="feed-item-header">
      <span class="feed-item-date">${date}</span>
      <span class="meta-tag">${type === 'photo' ? '📷' : '📝'}</span>
    </div>
    <div class="feed-item-text">${esc(truncate(caption, 400))}</div>
  `;
}

function buildTweetHtml(item) {
  const date  = item.date ? formatDate(item.date) : '—';
  const flags = [];
  if (item.isRetweet) flags.push('🔁 Retweet');
  if (item.isReply)   flags.push('↩️ Risposta');
  return `
    <div class="feed-item-header">
      <span class="feed-item-date">${date}</span>
      ${flags.length ? `<span class="meta-tag">${flags.join(' · ')}</span>` : ''}
    </div>
    <div class="feed-item-text">${esc(item.text || '')}</div>
    <div class="feed-item-meta">
      <span class="meta-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        ${item.likes}
      </span>
      <span class="meta-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        ${item.retweets}
      </span>
      ${item.lang ? `<span class="meta-tag">🌐 ${item.lang}</span>` : ''}
    </div>
  `;
}

function buildVideoHtml(item) {
  const date = item.date ? formatDate(item.date) : '—';
  return `
    <div class="feed-item-header">
      <span class="feed-item-date">${date}</span>
      <span class="meta-tag">🎵</span>
    </div>
    ${item.caption ? `<div class="feed-item-text">${esc(truncate(item.caption, 300))}</div>` : ''}
    <div class="feed-item-meta">
      <span class="meta-tag">❤️ ${item.likes || 0}</span>
      <span class="meta-tag">👁️ ${item.views || 0}</span>
      <span class="meta-tag">↗️ ${item.shares || 0}</span>
    </div>
  `;
}

function buildLikedHtml(social, item) {
  if (social === 'twitter') {
    return `<div class="feed-item-text">${esc(truncate(item.text || item.tweetId || '', 300))}</div>`;
  }
  if (social === 'tiktok') {
    const date = item.date ? formatDate(item.date) : '—';
    return `
      <div class="feed-item-header">
        <span class="feed-item-date">${date}</span>
        <span class="meta-tag">🎵</span>
      </div>
      <div class="feed-item-text"><a href="${esc(item.link)}" target="_blank" rel="noopener">${esc(item.link || '—')}</a></div>
    `;
  }
  // instagram / facebook
  const date = item.timestamp ? formatDate(new Date(item.timestamp * 1000)) : '—';
  return `
    <div class="feed-item-header">
      <span class="feed-item-date">${date}</span>
    </div>
    <div class="feed-item-text">
      ${item.username ? `<strong>@${esc(item.username)}</strong>` : ''}
      ${item.href ? `<br><a href="${esc(item.href)}" target="_blank" rel="noopener" style="font-size:0.8rem;color:var(--accent)">Vedi post</a>` : ''}
    </div>
  `;
}

// ── Search matching ───────────────────────────────────────────
function itemMatchesSearch(social, item, q) {
  const text = [
    item.caption, item.text, item.username,
    item.tweetId, item.link, item.comment,
  ].filter(Boolean).join(' ').toLowerCase();
  return text.includes(q);
}

// ── Utils ─────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' }); }
  catch { return String(d); }
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function noDataHtml(msg) {
  return `<div class="no-data">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <p>${msg}</p>
  </div>`;
}
