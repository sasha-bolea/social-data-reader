import { renderHome }   from './views/home.js';
import { renderUpload } from './views/upload.js';

// ── Global State ──────────────────────────────────────────────
export const App = {
  social: null,   // 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'tinder'
  data:   null,   // parsed data object from the social's parser

  setSocial(social) {
    this.social = social;
    // Update body theme class
    document.body.className = social ? `social-${social}` : '';
    // Update header badge
    const el = document.getElementById('headerSocial');
    if (social) {
      el.innerHTML = `<span class="social-dot"></span> ${capitalize(social)}`;
    } else {
      el.innerHTML = '';
    }
  },

  setData(data) {
    this.data = data;
  },

  showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(`view-${name}`);
    if (el) el.classList.add('active');

    // Back button visibility
    const btnBack = document.getElementById('btnBack');
    btnBack.classList.toggle('visible', name !== 'home');

    window.scrollTo(0, 0);
  }
};

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Router ────────────────────────────────────────────────────
function initRouter() {
  // Back button
  document.getElementById('btnBack').addEventListener('click', () => {
    const dashActive = document.getElementById('view-dashboard').classList.contains('active');
    const uploadActive = document.getElementById('view-upload').classList.contains('active');
    if (dashActive) {
      App.showView('upload');
    } else if (uploadActive) {
      App.setSocial(null);
      App.setData(null);
      App.showView('home');
    }
  });

  // Title link → home
  document.getElementById('appTitleLink').addEventListener('click', (e) => {
    e.preventDefault();
    App.setSocial(null);
    App.setData(null);
    App.showView('home');
    renderHome();
  });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  renderHome();
  App.showView('home');
  renderUpload();     // pre-render upload (listens for file events)
});
