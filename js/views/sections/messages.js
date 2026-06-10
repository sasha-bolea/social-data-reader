export function renderMessages(pane, social, data) {
  const conversations = getConversations(social, data);

  if (!conversations.length) {
    pane.innerHTML = noDataHtml('Nessun messaggio trovato nei dati caricati.');
    return;
  }

  pane.innerHTML = `
    <div class="messages-layout" id="msg-layout">
      <div class="convo-list" id="convo-list">
        <div class="convo-list-header">
          <h4>Conversazioni <span class="count-pill">${conversations.length}</span></h4>
          <input class="convo-search" id="convo-search" type="search" placeholder="Cerca conversazione...">
        </div>
        <div id="convo-items"></div>
      </div>
      <div class="chat-area" id="chat-area">
        <div class="chat-area-empty">Seleziona una conversazione</div>
      </div>
    </div>
  `;

  const myName = getMyName(social, data);
  let filteredConvos = conversations;

  renderConvoList(filteredConvos, myName, 0);

  document.getElementById('convo-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    filteredConvos = q
      ? conversations.filter(c => c.title.toLowerCase().includes(q))
      : conversations;
    renderConvoList(filteredConvos, myName, -1);
  });
}

function renderConvoList(convos, myName, selectedIdx) {
  const container = document.getElementById('convo-items');
  container.innerHTML = '';

  if (!convos.length) {
    container.innerHTML = '<p style="padding:1rem;color:var(--text-muted);font-size:0.85rem;">Nessuna conversazione.</p>';
    return;
  }

  convos.forEach((convo, idx) => {
    const lastMsg = convo.messages[convo.messages.length - 1];
    const preview = lastMsg ? truncate(lastMsg.text || '(media)', 50) : '—';
    const item = document.createElement('div');
    item.className = `convo-item${idx === selectedIdx ? ' active' : ''}`;
    item.innerHTML = `
      <div class="convo-item-name">${esc(convo.title)}</div>
      <div class="convo-item-preview">${esc(preview)}</div>
      <div class="convo-item-count">${convo.messages.length} messaggi</div>
    `;
    item.addEventListener('click', () => {
      document.querySelectorAll('.convo-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      renderChat(convo, myName);
    });
    container.appendChild(item);
  });

  // Auto-select first
  if (selectedIdx === 0 && convos.length > 0) {
    renderChat(convos[0], myName);
  }
}

function renderChat(convo, myName) {
  const chatArea = document.getElementById('chat-area');
  if (!chatArea) return;

  const msgs = convo.messages;
  chatArea.innerHTML = `
    <div class="chat-header">${esc(convo.title)} <span class="count-pill">${msgs.length} messaggi</span></div>
    <div class="chat-messages" id="chat-msgs">
      ${msgs.map(m => buildBubble(m, myName)).join('')}
    </div>
  `;

  // Scroll to bottom
  const msgContainer = document.getElementById('chat-msgs');
  if (msgContainer) {
    requestAnimationFrame(() => {
      msgContainer.scrollTop = msgContainer.scrollHeight;
    });
  }
}

function buildBubble(msg, myName) {
  const isSent = myName && msg.sender
    ? msg.sender.toLowerCase().includes(myName.toLowerCase())
    : false;

  const time = msg.date ? formatTime(msg.date) : '';
  const text = msg.text || '(media)';

  return `
    <div class="msg-bubble ${isSent ? 'sent' : 'received'}">
      ${!isSent && msg.sender ? `<div style="font-size:0.7rem;opacity:0.7;margin-bottom:0.2rem">${esc(msg.sender)}</div>` : ''}
      ${esc(truncate(text, 500))}
      ${time ? `<div class="msg-time">${time}</div>` : ''}
    </div>
  `;
}

// ── Helpers ───────────────────────────────────────────────────

function getConversations(social, data) {
  const convos = data.messages || [];
  return convos.sort((a, b) => b.totalMessages - a.totalMessages);
}

function getMyName(social, data) {
  // Tinder usa letteralmente "You" come valore del campo 'from'
  if (social === 'tinder') return 'You';
  const p = data.profile || {};
  return p.name || p.username || p.displayName || p.nickname || '';
}

function formatTime(d) {
  try {
    return new Date(d).toLocaleString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

function truncate(str, max) {
  return str && str.length > max ? str.slice(0, max) + '…' : (str || '');
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function noDataHtml(msg) {
  return `<div class="no-data">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    <p>${msg}</p>
  </div>`;
}
