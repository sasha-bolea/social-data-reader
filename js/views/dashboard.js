import { renderProfile }     from './sections/profile.js';
import { renderFeed }        from './sections/feed.js';
import { renderStats }       from './sections/stats.js';
import { renderMessages }    from './sections/messages.js';
import { renderConnections } from './sections/connections.js';

// Tabs available for each social
const SOCIAL_TABS = {
  instagram: [
    { id: 'profile',     label: 'Profilo',      icon: '👤' },
    { id: 'feed',        label: 'Post',          icon: '📷' },
    { id: 'liked',       label: 'Mi piace',      icon: '❤️' },
    { id: 'connections', label: 'Follower',       icon: '👥' },
    { id: 'messages',    label: 'Messaggi',       icon: '💬' },
    { id: 'stats',       label: 'Statistiche',    icon: '📊' },
  ],
  facebook: [
    { id: 'profile',     label: 'Profilo',        icon: '👤' },
    { id: 'feed',        label: 'Post',            icon: '📝' },
    { id: 'connections', label: 'Amici',           icon: '👥' },
    { id: 'messages',    label: 'Messaggi',        icon: '💬' },
    { id: 'stats',       label: 'Statistiche',     icon: '📊' },
  ],
  twitter: [
    { id: 'profile',     label: 'Profilo',         icon: '👤' },
    { id: 'feed',        label: 'Tweet',            icon: '🐦' },
    { id: 'liked',       label: 'Mi piace',         icon: '❤️' },
    { id: 'connections', label: 'Connessioni',      icon: '👥' },
    { id: 'stats',       label: 'Statistiche',      icon: '📊' },
  ],
  tiktok: [
    { id: 'profile',     label: 'Profilo',          icon: '👤' },
    { id: 'feed',        label: 'Video',             icon: '🎵' },
    { id: 'liked',       label: 'Mi piace',          icon: '❤️' },
    { id: 'messages',    label: 'Messaggi',          icon: '💬' },
    { id: 'stats',       label: 'Statistiche',       icon: '📊' },
  ],
  tinder: [
    { id: 'profile',     label: 'Profilo',           icon: '👤' },
    { id: 'stats',       label: 'Statistiche',       icon: '📊' },
    { id: 'messages',    label: 'Messaggi',           icon: '💬' },
  ],
};

const SOCIAL_NAMES = {
  instagram: 'Instagram',
  facebook:  'Facebook',
  twitter:   'Twitter / X',
  tiktok:    'TikTok',
  tinder:    'Tinder',
};

export function renderDashboard(social, data) {
  // ── Dashboard header ─────────────────────────────────────
  const headerEl = document.getElementById('dashboard-header');
  const profile  = data.profile || {};
  const displayName = profile.name || profile.username || profile.nickname || profile.displayName || SOCIAL_NAMES[social];
  const sub         = profile.username ? `@${profile.username}` : (profile.email || '');

  // Stat badges in header
  const badges = buildHeaderBadges(social, data);
  headerEl.innerHTML = `
    <div class="dash-avatar">${displayName.charAt(0).toUpperCase()}</div>
    <div class="dash-info">
      <h2>${escHtml(displayName)}</h2>
      ${sub ? `<p>${escHtml(sub)}</p>` : ''}
      <div class="dash-badges">${badges}</div>
    </div>
  `;

  // ── Tab nav ───────────────────────────────────────────────
  const tabs    = SOCIAL_TABS[social] || [];
  const navEl   = document.getElementById('tab-nav');
  const contEl  = document.getElementById('tab-contents');
  navEl.innerHTML  = '';
  contEl.innerHTML = '';

  tabs.forEach((tab, idx) => {
    // Tab button
    const btn = document.createElement('button');
    btn.className  = `tab-btn${idx === 0 ? ' active' : ''}`;
    btn.dataset.tab = tab.id;
    btn.innerHTML   = `<span>${tab.icon}</span> ${tab.label}`;
    btn.addEventListener('click', () => activateTab(tab.id, tabs));
    navEl.appendChild(btn);

    // Tab pane
    const pane = document.createElement('div');
    pane.className    = `tab-pane${idx === 0 ? ' active' : ''}`;
    pane.id           = `tab-${tab.id}`;
    contEl.appendChild(pane);
  });

  // ── Render initial tab ────────────────────────────────────
  renderTabContent(tabs[0]?.id, social, data);
}

function activateTab(tabId, tabs) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tabId)
  );
  document.querySelectorAll('.tab-pane').forEach(p =>
    p.classList.toggle('active', p.id === `tab-${tabId}`)
  );

  const pane = document.getElementById(`tab-${tabId}`);
  // Lazy render: only render once
  if (pane && !pane.dataset.rendered) {
    const social = document.body.className.replace('social-', '');
    // We stored data on window temporarily for lazy renders
    renderTabContent(tabId, social, window.__dashData);
    pane.dataset.rendered = '1';
  }
}

function renderTabContent(tabId, social, data) {
  if (!tabId || !data) return;
  // Store for lazy renders
  window.__dashData = data;

  const pane = document.getElementById(`tab-${tabId}`);
  if (!pane || pane.dataset.rendered) return;
  pane.dataset.rendered = '1';

  switch (tabId) {
    case 'profile':     renderProfile(pane, social, data); break;
    case 'feed':        renderFeed(pane, social, data, 'main'); break;
    case 'liked':       renderFeed(pane, social, data, 'liked'); break;
    case 'connections': renderConnections(pane, social, data); break;
    case 'messages':    renderMessages(pane, social, data); break;
    case 'stats':       renderStats(pane, social, data); break;
  }
}

function buildHeaderBadges(social, data) {
  const badges = [];
  const b = (label, value) =>
    value != null && value !== '' && value !== 0
      ? `<span class="badge"><strong>${fmtNum(value)}</strong> ${label}</span>`
      : '';

  switch (social) {
    case 'instagram':
      badges.push(b('follower',  data.followers?.length));
      badges.push(b('following', data.following?.length));
      badges.push(b('post',      data.posts?.length));
      badges.push(b('messaggi',  data.messages?.length));
      break;
    case 'facebook':
      badges.push(b('post',      data.posts?.length));
      badges.push(b('amici',     data.friends?.length));
      badges.push(b('commenti',  data.comments?.length));
      break;
    case 'twitter':
      badges.push(b('tweet',     data.tweets?.length));
      badges.push(b('follower',  data.followers?.length));
      badges.push(b('following', data.following?.length));
      badges.push(b('like',      data.liked?.length));
      break;
    case 'tiktok':
      badges.push(b('video',     data.videos?.length));
      badges.push(b('mi piace',  data.liked?.length));
      badges.push(b('commenti',  data.comments?.length));
      break;
    case 'tinder':
      badges.push(b('match',     data.usage?.matches));
      badges.push(b('messaggi',  data.messages?.reduce((s,m)=>s+m.totalMessages,0)));
      badges.push(b('like dati', data.usage?.swipesLike));
      break;
  }
  return badges.join('');
}

function fmtNum(n) {
  if (n == null) return '';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
