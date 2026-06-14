import { getSubjects, getStats, getFilters, getCatalog } from './api.js';
import { saveConfig, loadHistory } from './storage.js';
import { initTheme } from './theme.js';

const PER_SUBJECT   = 5;
const FULL_DURATION = 60 * 60; // 60 minutos
const MAX_PRACTICE  = 20;

let availableSubjects = [];
let catalog = { disciplines: [], exams: [], courses: [] };
let activeFilters = { difficulty: '', style: '', discipline: '', exam: '' };

async function init() {
  initTheme();
  renderHistory();
  await loadData();
  bindActions();
}

async function loadData() {
  try {
    const [statsData, subjectsData, filtersData, catalogData] = await Promise.all([
      getStats(), getSubjects(), getFilters(), getCatalog()
    ]);
    document.getElementById('stat-questions').textContent = statsData.totalQuestions;
    document.getElementById('stat-subjects').textContent  = subjectsData.subjects.length;
    availableSubjects = subjectsData.subjects;
    catalog = catalogData;
    renderFilters({ ...filtersData, ...catalogData });
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
  }
}

function bindActions() {
  document.getElementById('btn-simulado-completo').addEventListener('click', startFullSimulado);
  document.getElementById('btn-praticar').addEventListener('click', toggleSubjectSection);
}

const DIFF_LABELS  = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
const STYLE_LABELS = {
  municipal_igecs:    'IGECS',
  municipal_vunesp:   'VUNESP',
  municipal_generico: 'Genérica',
};

function styleLabel(s) {
  if (STYLE_LABELS[s]) return STYLE_LABELS[s];
  // fallback: "federal_cespe" → "CESPE", "estadual_fcc" → "FCC"
  const parts = s.split('_');
  return parts[parts.length - 1].toUpperCase();
}

function renderFilters({ difficulties, styles, disciplines, exams }) {
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = '';

  const groups = [
    {
      filter: 'discipline',
      label:  'Disciplina:',
      items:  (disciplines || []).map(d => ({ value: d.id, label: d.label }))
    },
    {
      filter: 'exam',
      label:  'Prova:',
      items:  (exams || []).map(e => ({ value: e.id, label: e.label }))
    },
    {
      filter: 'difficulty',
      label:  'Dificuldade:',
      items:  difficulties.map(v => ({ value: v, label: DIFF_LABELS[v] || v }))
    },
    {
      filter: 'style',
      label:  'Banca:',
      items:  styles.map(v => ({ value: v, label: styleLabel(v) }))
    }
  ];

  for (const group of groups) {
    if (!group.items.length) continue;

    const div = document.createElement('div');
    div.className = 'filter-group';
    div.innerHTML = `<span class="filter-label">${group.label}</span>`;

    // Pill "Todas" sempre primeiro
    const allPill = document.createElement('button');
    allPill.className = 'filter-pill active';
    allPill.dataset.filter = group.filter;
    allPill.dataset.value  = '';
    allPill.textContent    = 'Todas';
    div.appendChild(allPill);

    for (const item of group.items) {
      const pill = document.createElement('button');
      pill.className      = 'filter-pill';
      pill.dataset.filter = group.filter;
      pill.dataset.value  = item.value;
      pill.textContent    = item.label;
      div.appendChild(pill);
    }

    bar.appendChild(div);
  }

  // Bind de clique unificado
  bar.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.dataset.filter;
      bar.querySelectorAll(`.filter-pill[data-filter="${filter}"]`).forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilters[filter] = pill.dataset.value;
      renderSubjectGrid();
    });
  });
}

function startFullSimulado() {
  saveConfig({
    mode:       'full',
    subjects:   availableSubjects.map(s => s.id),
    perSubject: PER_SUBJECT,
    timed:      true,
    duration:   FULL_DURATION
  });
  window.location.href = '/simulado';
}

function toggleSubjectSection() {
  const section  = document.getElementById('subject-section');
  const isHidden = section.classList.contains('hidden');

  if (isHidden) {
    section.classList.remove('hidden');
    renderSubjectGrid();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    section.classList.add('hidden');
  }
}

function renderSubjectGrid() {
  const grid = document.getElementById('subject-grid');
  grid.innerHTML = '';

  const discLabel = catalog.disciplines.find(d => d.id === activeFilters.discipline)?.label || '';
  const examLabel = catalog.exams.find(e => e.id === activeFilters.exam)?.label || '';
  const filterNote = (discLabel                ? ' · ' + discLabel : '')
                   + (examLabel                ? ' · ' + examLabel : '')
                   + (activeFilters.difficulty ? ' · ' + (DIFF_LABELS[activeFilters.difficulty] || activeFilters.difficulty) : '')
                   + (activeFilters.style      ? ' · ' + styleLabel(activeFilters.style) : '');

  for (const subject of availableSubjects) {
    const card = document.createElement('div');
    card.className = 'subject-card fade-in';
    card.innerHTML = `
      <div class="subject-icon">${subject.icon}</div>
      <div class="subject-name">${subject.label}</div>
      <div class="subject-count">até ${MAX_PRACTICE} questões${filterNote}</div>
    `;
    card.addEventListener('click', () => startPractice(subject));
    grid.appendChild(card);
  }
}

function startPractice(subject) {
  const config = {
    mode:       'practice',
    subjects:   [subject.id],
    perSubject: MAX_PRACTICE,
    timed:      false,
    duration:   0
  };
  if (activeFilters.difficulty)  config.difficulty  = activeFilters.difficulty;
  if (activeFilters.style)       config.style       = activeFilters.style;
  if (activeFilters.discipline)  config.discipline  = activeFilters.discipline;
  if (activeFilters.exam)        config.exam        = activeFilters.exam;

  saveConfig(config);
  window.location.href = '/simulado';
}

function renderHistory() {
  const history = loadHistory();
  const doneStat = document.getElementById('stat-done');
  doneStat.textContent = history.length;

  if (history.length === 0) return;

  const list = document.getElementById('history-list');
  list.innerHTML = history.map(item => {
    const pct  = item.score.percentage;
    const mode = item.config.mode === 'full' ? 'Descubra Seu Nível' : 'Prática';
    const date = new Date(item.date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    return `
      <div class="history-card fade-in">
        <div class="history-card-header">
          <span class="history-mode">${mode}</span>
          <span class="history-date">${date}</span>
        </div>
        <div class="history-score">${pct}%</div>
        <div class="history-detail">${item.score.correct} de ${item.score.total} questões corretas</div>
      </div>
    `;
  }).join('');
}

init();
