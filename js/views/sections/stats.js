export function renderStats(pane, social, data) {
  const config = buildStatsConfig(social, data);
  pane.innerHTML = `
    <div class="stats-grid">
      ${config.numbers.map(n => `
        <div class="stat-card">
          <div class="stat-value">${fmtNum(n.value)}</div>
          <div class="stat-label">${esc(n.label)}</div>
        </div>
      `).join('')}
    </div>
    ${config.charts.map((c, i) => `
      <div class="chart-card">
        <h4>${esc(c.title)}</h4>
        <div class="chart-wrap"><canvas id="chart-${i}"></canvas></div>
      </div>
    `).join('')}
  `;

  // Render charts after DOM insertion
  requestAnimationFrame(() => {
    config.charts.forEach((c, i) => {
      const canvas = document.getElementById(`chart-${i}`);
      if (!canvas || !c.data.labels.length) return;
      renderChart(canvas, c);
    });
  });
}

// ── Per-social stats builders ─────────────────────────────────

function buildStatsConfig(social, data) {
  switch (social) {
    case 'instagram': return buildInstagramStats(data);
    case 'facebook':  return buildFacebookStats(data);
    case 'twitter':   return buildTwitterStats(data);
    case 'tiktok':    return buildTikTokStats(data);
    case 'tinder':    return buildTinderStats(data);
    default: return { numbers: [], charts: [] };
  }
}

function buildInstagramStats(data) {
  const posts     = data.posts     || [];
  const followers = data.followers || [];
  const following = data.following || [];
  const messages  = data.messages  || [];
  const liked     = data.liked     || [];
  const comments  = data.comments  || [];

  const totalMsgs = messages.reduce((s, m) => s + m.totalMessages, 0);

  return {
    numbers: [
      { label: 'Post',             value: posts.length },
      { label: 'Follower',         value: followers.length },
      { label: 'Following',        value: following.length },
      { label: 'Post piaciuti',    value: liked.length },
      { label: 'Commenti dati',    value: comments.length },
      { label: 'Conversazioni',    value: messages.length },
      { label: 'Messaggi totali',  value: totalMsgs },
      { label: 'Rapporto F/F',     value: followers.length && following.length ? (followers.length / following.length).toFixed(2) : 'N/A' },
    ],
    charts: [
      buildMonthlyChart('Post per mese', posts),
      buildMonthlyChart('Follower acquisiti per mese', followers.map(f => ({ date: f.timestamp ? new Date(f.timestamp * 1000) : null }))),
    ],
  };
}

function buildFacebookStats(data) {
  const posts     = data.posts     || [];
  const friends   = data.friends   || [];
  const comments  = data.comments  || [];
  const reactions = data.reactions || [];
  const messages  = data.messages  || [];

  return {
    numbers: [
      { label: 'Post',            value: posts.length },
      { label: 'Amici',           value: friends.length },
      { label: 'Commenti dati',   value: comments.length },
      { label: 'Reazioni date',   value: reactions.length },
      { label: 'Conversazioni',   value: messages.length },
      { label: 'Messaggi totali', value: messages.reduce((s, m) => s + m.totalMessages, 0) },
    ],
    charts: [
      buildMonthlyChart('Post per mese', posts),
      buildMonthlyChart('Amici aggiunti per mese', friends.map(f => ({ date: f.timestamp ? new Date(f.timestamp * 1000) : null }))),
    ],
  };
}

function buildTwitterStats(data) {
  const tweets    = data.tweets    || [];
  const liked     = data.liked     || [];
  const followers = data.followers || [];
  const following = data.following || [];

  const origTweets  = tweets.filter(t => !t.isRetweet && !t.isReply);
  const retweets    = tweets.filter(t => t.isRetweet);
  const replies     = tweets.filter(t => t.isReply);
  const totalLikes  = tweets.reduce((s, t) => s + (t.likes || 0), 0);
  const totalRTs    = tweets.reduce((s, t) => s + (t.retweets || 0), 0);
  const avgLikes    = tweets.length ? (totalLikes / tweets.length).toFixed(1) : 0;

  return {
    numbers: [
      { label: 'Tweet totali',    value: tweets.length },
      { label: 'Tweet originali', value: origTweets.length },
      { label: 'Retweet',         value: retweets.length },
      { label: 'Risposte',        value: replies.length },
      { label: 'Like totali ricevuti', value: totalLikes },
      { label: 'RT totali ricevuti',   value: totalRTs },
      { label: 'Like medi/tweet',      value: avgLikes },
      { label: 'Tweet piaciuti',       value: liked.length },
      { label: 'Follower',             value: followers.length },
      { label: 'Following',            value: following.length },
    ],
    charts: [
      buildMonthlyChart('Tweet per mese', tweets),
    ],
  };
}

function buildTikTokStats(data) {
  const videos   = data.videos   || [];
  const liked    = data.liked    || [];
  const comments = data.comments || [];
  const shares   = data.shareHistory || [];

  const totalLikes  = videos.reduce((s, v) => s + parseInt(v.likes  || 0, 10), 0);
  const totalViews  = videos.reduce((s, v) => s + parseInt(v.views  || 0, 10), 0);
  const totalShares = videos.reduce((s, v) => s + parseInt(v.shares || 0, 10), 0);

  return {
    numbers: [
      { label: 'Video pubblicati',   value: videos.length },
      { label: 'Like totali ricevuti', value: totalLikes },
      { label: 'Visualizzazioni tot.', value: totalViews },
      { label: 'Condivisioni tot.',    value: totalShares },
      { label: 'Video piaciuti',       value: liked.length },
      { label: 'Commenti pubblicati',  value: comments.length },
      { label: 'Condivisioni fatte',   value: shares.length },
    ],
    charts: [
      buildMonthlyChart('Video per mese', videos),
      buildMonthlyChart('Mi piace dati per mese', liked),
    ],
  };
}

function buildTinderStats(data) {
  const u = data.usage || {};
  const messages = data.messages || [];

  const charts = [];

  if (u.seriesLikes?.length) {
    charts.push(buildSeriesChart('Swipe Like nel tempo', u.seriesLikes.slice(-60)));
  }
  if (u.seriesMatches?.length) {
    charts.push(buildSeriesChart('Match nel tempo', u.seriesMatches.slice(-60)));
  }
  if (u.seriesAppOpens?.length) {
    charts.push(buildSeriesChart('App aperta nel tempo', u.seriesAppOpens.slice(-60)));
  }

  return {
    numbers: [
      { label: 'Match totali',       value: u.matches },
      { label: 'Swipe Like',         value: u.swipesLike },
      { label: 'Swipe Pass',         value: u.swipesPasses },
      { label: 'Super Like',         value: u.superlikes },
      { label: 'App aperture',       value: u.appOpens },
      { label: 'Messaggi inviati',   value: u.messagesSent },
      { label: 'Messaggi ricevuti',  value: u.messagesReceived },
      { label: 'Conversazioni',      value: messages.length },
      { label: 'Tasso match',        value: u.swipesLike && u.matches
          ? `${((u.matches / u.swipesLike) * 100).toFixed(1)}%` : 'N/A' },
    ],
    charts,
  };
}

// ── Chart builders ────────────────────────────────────────────

function buildMonthlyChart(title, items) {
  const counts = {};
  items.forEach(item => {
    if (!item?.date) return;
    const d = item.date instanceof Date ? item.date : new Date(item.date);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const keys = Object.keys(counts).sort();
  return {
    title,
    type: 'bar',
    data: {
      labels:   keys.map(k => {
        const [y, m] = k.split('-');
        return new Date(+y, +m - 1, 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      }),
      datasets: [{ data: keys.map(k => counts[k]) }],
    },
  };
}

function buildSeriesChart(title, series) {
  const labels  = series.map(p => p.date || '');
  const values  = series.map(p => p.value ?? 0);
  return {
    title,
    type: 'line',
    data: { labels, datasets: [{ data: values }] },
  };
}

function renderChart(canvas, config) {
  const primary = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#7c6ff7';
  const isBar   = config.type === 'bar';

  new Chart(canvas, {
    type: config.type,
    data: {
      labels: config.data.labels,
      datasets: config.data.datasets.map(ds => ({
        ...ds,
        backgroundColor: isBar
          ? `${primary}99`
          : `${primary}33`,
        borderColor:     primary,
        borderWidth:     2,
        fill:            !isBar,
        tension:         0.35,
        pointRadius:     config.data.labels.length > 40 ? 0 : 3,
      })),
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: '#888', maxTicksLimit: 12, maxRotation: 45 },
          grid:  { color: 'rgba(255,255,255,0.05)' },
        },
        y: {
          ticks:    { color: '#888' },
          grid:     { color: 'rgba(255,255,255,0.05)' },
          beginAtZero: true,
        },
      },
    },
  });
}

// ── Utils ─────────────────────────────────────────────────────
function fmtNum(n) {
  if (n == null || n === 'N/A' || typeof n === 'string') return String(n ?? '—');
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
