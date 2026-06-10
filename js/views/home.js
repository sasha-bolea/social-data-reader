import { App }          from '../app.js';
import { renderUpload } from './upload.js';

const SOCIALS = [
  {
    id:   'instagram',
    name: 'Instagram',
    desc: 'Post, storie, messaggi e follower',
    icon: `<svg viewBox="0 0 24 24" width="34" height="34" fill="white">
             <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="white" stroke-width="2"/>
             <circle cx="12" cy="12" r="4" fill="none" stroke="white" stroke-width="2"/>
             <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
           </svg>`,
  },
  {
    id:   'facebook',
    name: 'Facebook',
    desc: 'Post, amici, messaggi e reazioni',
    icon: `<svg viewBox="0 0 24 24" width="34" height="34" fill="white">
             <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
           </svg>`,
  },
  {
    id:   'twitter',
    name: 'Twitter / X',
    desc: 'Tweet, like e connessioni',
    icon: `<svg viewBox="0 0 24 24" width="34" height="34" fill="white">
             <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
           </svg>`,
  },
  {
    id:   'tiktok',
    name: 'TikTok',
    desc: 'Video, like e commenti',
    icon: `<svg viewBox="0 0 24 24" width="34" height="34" fill="white">
             <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.88a8.26 8.26 0 0 0 4.83 1.56V7a4.85 4.85 0 0 1-1.06-.31z"/>
           </svg>`,
  },
  {
    id:   'tinder',
    name: 'Tinder',
    desc: 'Match, statistiche e messaggi',
    icon: `<svg viewBox="0 0 24 24" width="34" height="34" fill="white">
             <path d="M12 23C6.477 23 2 18.523 2 13c0-4.4 2.7-8.2 6.7-9.8-.4 1.1-.5 2.3-.2 3.5.7 3 3.1 5.2 6.1 5.8-.2-.8-.2-1.6 0-2.4.5-1.9 2-3.3 3.8-3.7C19.9 8.4 21 11.1 21 14c0 5-3.9 9-9 9z"/>
           </svg>`,
  },
];

export function renderHome() {
  const grid = document.getElementById('social-cards');
  grid.innerHTML = '';

  SOCIALS.forEach(social => {
    const card = document.createElement('div');
    card.className = `social-card card-${social.id}`;
    card.innerHTML = `
      <div class="card-icon">${social.icon}</div>
      <div class="card-name">${social.name}</div>
      <div class="card-desc">${social.desc}</div>
    `;
    card.addEventListener('click', () => {
      App.setSocial(social.id);
      renderUpload(social.id);
      App.showView('upload');
    });
    grid.appendChild(card);
  });
}
