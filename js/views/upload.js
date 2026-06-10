import { App }             from '../app.js';
import { parseInstagram }  from '../parsers/instagram.js';
import { parseFacebook }   from '../parsers/facebook.js';
import { parseTwitter }    from '../parsers/twitter.js';
import { parseTikTok }     from '../parsers/tiktok.js';
import { parseTinder }     from '../parsers/tinder.js';
import { renderDashboard } from './dashboard.js';

const PARSERS = {
  instagram: parseInstagram,
  facebook:  parseFacebook,
  twitter:   parseTwitter,
  tiktok:    parseTikTok,
  tinder:    parseTinder,
};

const SOCIAL_INFO = {
  instagram: {
    name: 'Instagram',
    desc: 'Carica il file ZIP dell\'export Meta o singoli file JSON dalla cartella decompressa.',
    steps: [
      'Vai su Instagram → Impostazioni → Il tuo account → Scarica i dati',
      'Seleziona formato JSON e richiedi l\'archivio',
      'Riceverai una email con il link per scaricare lo ZIP',
      'Carica lo ZIP qui oppure estrai i file JSON singolarmente',
    ],
  },
  facebook: {
    name: 'Facebook',
    desc: 'Carica il file ZIP dell\'export Meta o singoli file JSON dalla cartella decompressa.',
    steps: [
      'Vai su Facebook → Impostazioni → La tua attività su Facebook',
      'Clicca "Scarica le informazioni" → Seleziona formato JSON',
      'Richiedi il download e attendi la email di conferma',
      'Carica lo ZIP qui oppure i file JSON estratti',
    ],
  },
  twitter: {
    name: 'Twitter / X',
    desc: 'Carica il file ZIP dell\'export Twitter. I file .js al suo interno verranno letti automaticamente.',
    steps: [
      'Vai su X → Impostazioni → Il tuo account → Scarica un archivio dei tuoi dati',
      'Verifica la tua identità e richiedi l\'archivio',
      'Attendi la email (può richiedere 24h) e scarica lo ZIP',
      'Carica lo ZIP completo qui',
    ],
  },
  tiktok: {
    name: 'TikTok',
    desc: 'Carica il file user_data.json dall\'export TikTok, oppure lo ZIP completo.',
    steps: [
      'Vai su TikTok → Profilo → Menu → Impostazioni → Privacy',
      'Scorri fino a "Scarica i tuoi dati" e richiedi il file JSON',
      'Attendi la notifica TikTok (1-4 giorni) e scarica il file',
      'Carica user_data.json o lo ZIP qui',
    ],
  },
  tinder: {
    name: 'Tinder',
    desc: 'Carica il file data.json dall\'export Tinder.',
    steps: [
      'Vai su account.gotinder.com e accedi al tuo account',
      'Clicca "Download My Data" e inserisci la tua email',
      'Riceverai data.json via email entro 30 giorni',
      'Carica il file data.json qui',
    ],
  },
};

export function renderUpload(socialId) {
  const id = socialId || App.social;
  if (!id) return;

  const info = SOCIAL_INFO[id];

  // Social badge
  document.getElementById('upload-social-badge').innerHTML =
    `<span>${info.name}</span>`;

  // Description
  document.getElementById('upload-description').textContent = info.desc;

  // Instructions
  const stepsHtml = info.steps
    .map((s, i) => `<li><span class="step-num">${i + 1}</span><span>${s}</span></li>`)
    .join('');
  document.getElementById('upload-instructions').innerHTML =
    `<ul class="instruction-steps">${stepsHtml}</ul>`;

  // Reset UI
  hideProgress();
  hideError();
}

// ── File handling ─────────────────────────────────────────────
export function initUploadListeners() {
  const dropZone  = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  // Drag events
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(Array.from(e.dataTransfer.files));
  });

  // Click to open
  dropZone.addEventListener('click', e => {
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    handleFiles(Array.from(fileInput.files));
    fileInput.value = '';
  });
}

async function handleFiles(files) {
  if (!files.length) return;
  const social = App.social;
  if (!social) return;

  hideError();
  showProgress('Lettura file in corso...', 10);

  try {
    const parser = PARSERS[social];
    let data;

    const zipFile = files.find(f => f.name.toLowerCase().endsWith('.zip'));
    const jsonFiles = files.filter(f => f.name.toLowerCase().endsWith('.json') || f.name.toLowerCase().endsWith('.js'));

    if (zipFile) {
      showProgress('Estrazione archivio ZIP...', 30);
      const zip = await JSZip.loadAsync(zipFile);
      showProgress('Analisi dati...', 60);
      data = await parser(zip, null);
    } else if (jsonFiles.length > 0) {
      showProgress('Lettura file JSON...', 40);
      const fileContents = await Promise.all(jsonFiles.map(readFileAsText));
      showProgress('Analisi dati...', 70);
      // Pass both: zip=null, files=array of {name, content}
      const fileObjects = jsonFiles.map((f, i) => ({ name: f.name, content: fileContents[i] }));
      data = await parser(null, fileObjects);
    } else {
      throw new Error('Nessun file ZIP o JSON trovato. Controlla il formato del file.');
    }

    showProgress('Preparazione dashboard...', 90);
    App.setData(data);

    setTimeout(() => {
      hideProgress();
      renderDashboard(social, data);
      App.showView('dashboard');
    }, 300);

  } catch (err) {
    hideProgress();
    showError(err.message || 'Errore durante la lettura dei file. Verifica di aver selezionato i file corretti.');
    console.error(err);
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Errore lettura file: ${file.name}`));
    reader.readAsText(file, 'utf-8');
  });
}

function showProgress(text, pct) {
  document.getElementById('upload-progress').style.display = 'block';
  document.getElementById('progress-text').textContent    = text;
  document.getElementById('progress-fill').style.width   = `${pct}%`;
}
function hideProgress() {
  document.getElementById('upload-progress').style.display = 'none';
  document.getElementById('progress-fill').style.width = '0%';
}
function showError(msg) {
  const el = document.getElementById('upload-error');
  document.getElementById('upload-error-text').textContent = msg;
  el.style.display = 'flex';
}
function hideError() {
  document.getElementById('upload-error').style.display = 'none';
}

// Initialise listeners once on module load
document.addEventListener('DOMContentLoaded', initUploadListeners);
