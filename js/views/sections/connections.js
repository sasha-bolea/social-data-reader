const PAGE_SIZE = 100;

export function renderConnections(pane, social, data) {
  const tabs  = buildTabs(social, data);

  if (!tabs.length) {
    pane.innerHTML = noDataHtml('Nessun dato di connessioni trovato.');
    return;
  }

  // Initial render with first tab
  let activeTab = 0;

  pane.innerHTML = `
    <div class="section-toolbar">
      <div class="connections-tabs" id="conn-tabs">
        ${tabs.map((t, i) => `
          <button class="mini-tab${i === 0 ? ' active' : ''}" data-tab="${i}">
            ${t.label} <span class="count-pill">${t.items.length}</span>
          </button>
        `).join('')}
      </div>
      <input class="search-input" id="conn-search" type="search" placeholder="Cerca...">
    </div>
    <div id="conn-list" class="connections-list"></div>
    <div class="load-more-wrap">
      <button class="btn btn-ghost" id="conn-load-more" style="display:none">Carica altri</button>
    </div>
  `;

  let page = 0;
  let filtered = tabs[activeTab].items;

  function render() {
    const list  = document.getElementById('conn-list');
    const slice = filtered.slice(0, (page + 1) * PAGE_SIZE);
    list.innerHTML = slice.map(item => buildItemHtml(social, item, tabs[activeTab].type)).join('');

    const btn = document.getElementById('conn-load-more');
    btn.style.display = slice.length < filtered.length ? 'inline-flex' : 'none';
  }

  render();

  // Tab switching
  document.getElementById('conn-tabs').addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    activeTab = +btn.dataset.tab;
    document.querySelectorAll('.mini-tab').forEach((b, i) =>
      b.classList.toggle('active', i === activeTab)
    );
    document.getElementById('conn-search').value = '';
    filtered = tabs[activeTab].items;
    page = 0;
    render();
  });

  // Search
  document.getElementById('conn-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    filtered = q
      ? tabs[activeTab].items.filter(it => matchesSearch(it, q))
      : tabs[activeTab].items;
    page = 0;
    render();
  });

  // Load more
  document.getElementById('conn-load-more').addEventListener('click', () => {
    page++;
    render();
  });
}

// ── Tab builders ──────────────────────────────────────────────

function buildTabs(social, data) {
  switch (social) {
    case 'instagram':
      return [
        { label: 'Follower', type: 'user', items: data.followers || [] },
        { label: 'Following', type: 'user', items: data.following || [] },
      ].filter(t => t.items.length);

    case 'facebook':
      return [
        { label: 'Amici', type: 'friend', items: data.friends || [] },
      ].filter(t => t.items.length);

    case 'twitter':
      return [
        { label: 'Follower', type: 'twitter-user', items: data.followers || [] },
        { label: 'Following', type: 'twitter-user', items: data.following || [] },
      ].filter(t => t.items.length);

    case 'tinder':
      return [
        { label: 'Match', type: 'match', items: buildMatchList(data) },
      ].filter(t => t.items.length);

    default:
      return [];
  }
}

function buildMatchList(data) {
  return (data.messages || []).map((m, i) => ({
    matchId: m.matchId || `match-${i}`,
    name:    m.title,
    count:   m.totalMessages,
  }));
}

// ── Item renderers ────────────────────────────────────────────

function buildItemHtml(social, item, type) {
  switch (type) {
    case 'user': {
      const username = item.username || '';
      const date     = item.timestamp
        ? new Date(item.timestamp * 1000).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })
        : '';
      return `
        <div class="connection-item">
          <div class="connection-avatar">${username.charAt(0).toUpperCase() || '?'}</div>
          <div>
            <div class="connection-name">@${esc(username)}</div>
            ${date ? `<div class="connection-date">${date}</div>` : ''}
          </div>
        </div>
      `;
    }
    case 'friend': {
      const name = item.name || '';
      const date = item.timestamp
        ? new Date(item.timestamp * 1000).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })
        : '';
      return `
        <div class="connection-item">
          <div class="connection-avatar">${name.charAt(0).toUpperCase() || '?'}</div>
          <div>
            <div class="connection-name">${esc(name)}</div>
            ${date ? `<div class="connection-date">Dal ${date}</div>` : ''}
          </div>
        </div>
      `;
    }
    case 'twitter-user': {
      const link = item.userLink || '';
      const id   = item.accountId || '';
      return `
        <div class="connection-item">
          <div class="connection-avatar">X</div>
          <div>
            <div class="connection-name" style="font-size:0.8rem">${esc(id || link)}</div>
          </div>
        </div>
      `;
    }
    case 'match': {
      const name  = item.name || item.matchId || '';
      const count = item.count || 0;
      return `
        <div class="connection-item">
          <div class="connection-avatar">💕</div>
          <div>
            <div class="connection-name">${esc(name)}</div>
            <div class="connection-date">${count} messaggi</div>
          </div>
        </div>
      `;
    }
    default: return '';
  }
}

// ── Utils ─────────────────────────────────────────────────────

function matchesSearch(item, q) {
  return [item.username, item.name, item.accountId, item.userLink, item.matchId]
    .filter(Boolean)
    .some(v => v.toLowerCase().includes(q));
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function noDataHtml(msg) {
  return `<div class="no-data">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    <p>${msg}</p>
  </div>`;
}
