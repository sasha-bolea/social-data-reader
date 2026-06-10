export function renderProfile(pane, social, data) {
  const p = data.profile || {};

  const fields = buildFields(social, p, data);

  pane.innerHTML = `
    <div class="profile-grid">
      ${fields.map(f => f.value ? `
        <div class="info-card">
          <div class="label">${esc(f.label)}</div>
          <div class="value">${esc(String(f.value))}</div>
        </div>
      ` : '').join('')}
    </div>
    ${buildExtraSection(social, data)}
  `;
}

function buildFields(social, p, data) {
  const base = [
    { label: 'Nome',       value: p.name || p.displayName || p.nickname },
    { label: 'Username',   value: p.username ? `@${p.username}` : '' },
    { label: 'Email',      value: p.email },
    { label: 'Bio',        value: p.bio },
    { label: 'Sito web',   value: p.website },
    { label: 'Posizione',  value: p.location || p.city },
    { label: 'Telefono',   value: p.phone },
    { label: 'Genere',     value: p.gender },
    { label: 'Data nascita', value: p.birthdate || p.birthday },
    { label: 'Membro dal', value: formatDate(p.dateJoined || p.created) },
    { label: 'Scuola',     value: p.school },
    { label: 'Lavoro',     value: p.job },
    { label: 'Privato',    value: p.private === true ? 'Sì' : (p.private === false ? 'No' : undefined) },
  ];

  const extras = {
    instagram: [
      { label: 'Post',         value: data.posts?.length },
      { label: 'Follower',     value: data.followers?.length },
      { label: 'Following',    value: data.following?.length },
      { label: 'Conversazioni',value: data.messages?.length },
    ],
    facebook: [
      { label: 'Post pubblicati', value: data.posts?.length },
      { label: 'Amici',           value: data.friends?.length },
      { label: 'Commenti',        value: data.comments?.length },
    ],
    twitter: [
      { label: 'Tweet',     value: data.tweets?.length },
      { label: 'Follower',  value: data.followers?.length },
      { label: 'Following', value: data.following?.length },
      { label: 'Mi piace',  value: data.liked?.length },
    ],
    tiktok: [
      { label: 'Video pubblicati', value: data.videos?.length },
      { label: 'Mi piace dati',    value: data.liked?.length },
      { label: 'Commenti',         value: data.comments?.length },
      { label: 'Regione',          value: data.profile?.region },
    ],
    tinder: [
      { label: 'Altezza',          value: p.height },
      { label: 'Fuma',             value: p.smoking },
      { label: 'Alcool',           value: p.drinking },
      { label: 'Cerca',            value: p.lookingFor },
      { label: 'Interessi',        value: p.interests },
      { label: 'Prompt',           value: p.prompt },
      { label: 'Regione',          value: p.region },
      { label: 'Match totali',     value: data.usage?.matches },
      { label: 'Swipe Like',       value: data.usage?.swipesLike },
      { label: 'Swipe Pass',       value: data.usage?.swipesPasses },
      { label: 'Messaggi inviati', value: data.usage?.messagesSent },
    ],
  };

  return [...base, ...(extras[social] || [])].filter(f =>
    f.value !== undefined && f.value !== null && f.value !== '' && f.value !== 0
  );
}

function buildExtraSection(social, data) {
  if (social === 'instagram' && data.profile?.bio) return '';
  return '';
}

function formatDate(val) {
  if (!val) return undefined;
  if (val instanceof Date) return val.toLocaleDateString('it-IT');
  if (typeof val === 'string' && val.length > 0) return val;
  return undefined;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
