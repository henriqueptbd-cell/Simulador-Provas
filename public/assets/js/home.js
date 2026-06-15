import { getSubjects, getStats, getFilters, getCatalog } from './api.js';
import { saveConfig, loadHistory, getSeenQuestions, resetSeenQuestions } from './storage.js';
import { initTheme } from './theme.js';

const PER_SUBJECT   = 5;
const FULL_DURATION = 60 * 60; // 60 minutos
const MAX_PRACTICE  = 20;

let revealObserver;

function countUp(el, target, duration = 900) {
  if (!el) return;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
    el.textContent = Math.round(ease * target);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initReveal() {
  revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function observeReveal(el) {
  if (revealObserver) revealObserver.observe(el);
}

let availableSubjects = [];
let catalog = { disciplines: [], exams: [], courses: [] };
let activeFilters = { difficulty: '', style: '', discipline: '', exam: '' };

async function init() {
  initTheme();
  initReveal();
  renderHistory();
  await loadData();
  bindActions();
}

async function loadData() {
  try {
    const [statsData, subjectsData, filtersData, catalogData] = await Promise.all([
      getStats(), getSubjects(), getFilters(), getCatalog()
    ]);
    countUp(document.getElementById('stat-questions'), statsData.totalQuestions);
    countUp(document.getElementById('stat-subjects'),  subjectsData.subjects.length);
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
  tecnico_adm:        'Técnico em Adm.',
  fatec_dsm:          'FATEC DSM',
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
    pill.addEventListener('click', async () => {
      const filter = pill.dataset.filter;
      bar.querySelectorAll(`.filter-pill[data-filter="${filter}"]`).forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilters[filter] = pill.dataset.value;

      // Qualquer filtro muda quais matérias têm questões — sempre re-busca
      await refreshSubjects();
      renderSubjectGrid();
    });
  });
}

async function refreshSubjects() {
  try {
    const params = {};
    if (activeFilters.discipline) params.discipline = activeFilters.discipline;
    if (activeFilters.exam)       params.exam       = activeFilters.exam;
    if (activeFilters.difficulty) params.difficulty = activeFilters.difficulty;
    if (activeFilters.style)      params.style      = activeFilters.style;
    const data = await getSubjects(params);
    availableSubjects = data.subjects.filter(s => s.totalQuestions > 0);
  } catch (err) {
    console.error('Erro ao atualizar matérias:', err);
  }
}

function startFullSimulado() {
  const config = {
    mode:       'full',
    subjects:   availableSubjects.map(s => s.id),
    perSubject: PER_SUBJECT,
    timed:      true,
    duration:   FULL_DURATION
  };
  if (activeFilters.discipline) config.discipline = activeFilters.discipline;
  if (activeFilters.exam)       config.exam       = activeFilters.exam;
  saveConfig(config);
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
  const hasContextFilter = activeFilters.discipline || activeFilters.exam;

  const filterNote = (activeFilters.difficulty ? ' · ' + (DIFF_LABELS[activeFilters.difficulty] || activeFilters.difficulty) : '')
                   + (activeFilters.style      ? ' · ' + styleLabel(activeFilters.style) : '');

  if (!availableSubjects.length) {
    grid.innerHTML = '<p class="empty-state">Nenhuma matéria encontrada para os filtros selecionados.</p>';
    return;
  }

  availableSubjects.forEach((subject, i) => {
    const countText = hasContextFilter
      ? `${subject.totalQuestions} questão(ões)${filterNote}`
      : `até ${MAX_PRACTICE} questões${filterNote}`;

    const seen  = getSeenQuestions(subject.id);
    const total = subject.totalQuestions;
    const showProgress = seen.length > 0 && total > MAX_PRACTICE;
    const seenCapped   = Math.min(seen.length, total);
    const pct          = Math.round((seenCapped / total) * 100);
    const progressHtml = showProgress
      ? `<div class="subject-progress">
           <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
           <span class="progress-label">${seenCapped}/${total} vistas</span>
         </div>`
      : '';

    const card = document.createElement('div');
    card.className = 'subject-card reveal';
    card.style.setProperty('--reveal-delay', `${i * 60}ms`);
    card.innerHTML = `
      <div class="subject-icon">${subject.icon}</div>
      <div class="subject-name">${subject.label}</div>
      <div class="subject-count">${countText}</div>
      ${progressHtml}
    `;
    card.addEventListener('click', () => startPractice(subject));
    grid.appendChild(card);
    observeReveal(card);
  });
}

function startPractice(subject) {
  let seen = getSeenQuestions(subject.id);
  if (seen.length >= subject.totalQuestions) {
    resetSeenQuestions(subject.id);
    seen = [];
  }

  const config = {
    mode:           'practice',
    subjects:       [subject.id],
    perSubject:     MAX_PRACTICE,
    timed:          false,
    duration:       0,
    seenQuestions:  seen,
    totalQuestions: subject.totalQuestions
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
