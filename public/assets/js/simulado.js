import { getQuestions, getRandomQuestions } from './api.js';
import { loadConfig, saveResult, addSeenQuestions } from './storage.js';
import { Timer } from './timer.js';
import {
  prepareQuestion, calculateResult,
  SUBJECT_LABELS, SUBJECT_ICONS, getLetter
} from './quiz.js';
import { initTheme } from './theme.js';

const DIFFICULTY_LABELS = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
const DIFFICULTY_CLASS  = { easy: 'badge-difficulty-easy', medium: 'badge-difficulty-medium', hard: 'badge-difficulty-hard' };

const state = {
  questions:    [],
  answers:      {},
  currentIndex: 0,
  timer:        null,
  config:       null,
  startTime:    null
};

// DOM refs
const $ = id => document.getElementById(id);

async function init() {
  initTheme();
  const config = loadConfig();
  if (!config) { window.location.href = '/'; return; }
  state.config = config;

  try {
    const questions = await fetchQuestions(config);
    if (!questions.length) throw new Error('Nenhuma questão encontrada.');

    state.questions = questions.map(prepareQuestion);
    state.startTime = Date.now();

    showExam();
    renderQuestion(0);

    if (config.timed && config.duration) {
      setupTimer(config.duration);
    }
  } catch (err) {
    console.error(err);
    showError();
  }
}

async function fetchQuestions(config) {
  if (config.mode === 'full') {
    const params = { subjects: config.subjects.join(','), perSubject: config.perSubject };
    if (config.discipline) params.discipline = config.discipline;
    if (config.exam)       params.exam       = config.exam;
    const data = await getRandomQuestions(params);
    return data.questions;
  }

  // Modo prática: prioriza questões não vistas via exclude, máx. 20
  const seen = config.seenQuestions || [];
  const params = { subjects: config.subjects[0], perSubject: 20 };
  if (seen.length)        params.exclude     = seen.join(',');
  if (config.difficulty)  params.difficulty  = config.difficulty;
  if (config.style)       params.style       = config.style;
  if (config.discipline)  params.discipline  = config.discipline;
  if (config.exam)        params.exam        = config.exam;

  const data = await getRandomQuestions(params);

  const subject = config.subjects[0];
  const ids = data.questions.map(q => q.id).filter(Boolean);
  if (ids.length) addSeenQuestions(subject, ids);

  return data.questions;
}

function setupTimer(seconds) {
  $('timer-wrap').classList.remove('hidden');
  $('btn-pause').classList.remove('hidden');

  state.timer = new Timer({
    seconds,
    onTick: (rem) => {
      const display = $('timer-display');
      display.textContent = state.timer.format(rem);
      display.className = 'timer-display' +
        (rem <= 60 ? ' danger' : rem <= 300 ? ' warning' : '');
    },
    onEnd: () => submitExam(true)
  });

  state.timer.start();

  $('btn-pause').addEventListener('click', openPause);
  $('btn-resume').addEventListener('click', closePause);
}

function openPause() {
  state.timer?.pause();
  $('pause-overlay').classList.remove('hidden');
}

function closePause() {
  $('pause-overlay').classList.add('hidden');
  state.timer?.resume();
}

function showExam() {
  $('loading').classList.add('hidden');
  $('question-area').classList.remove('hidden');
  buildDots();
  bindNavigation();
  bindReportForm();
}

function showError() {
  $('loading').classList.add('hidden');
  $('error-state').classList.remove('hidden');
}

function renderQuestion(index) {
  state.currentIndex = index;
  const q = state.questions[index];
  const total = state.questions.length;

  // Header
  $('progress-text').textContent = `Questão ${index + 1} de ${total}`;
  $('progress-bar').style.width = `${((index + 1) / total) * 100}%`;

  $('question-number').textContent = `Questão ${index + 1}`;
  $('question-subject').textContent = `${q.subjectIcon || SUBJECT_ICONS[q.subject] || ''} ${q.subjectLabel || SUBJECT_LABELS[q.subject] || q.subject}`;

  const diffBadge = $('question-difficulty');
  diffBadge.textContent = DIFFICULTY_LABELS[q.difficulty] || q.difficulty;
  diffBadge.className = `badge ${DIFFICULTY_CLASS[q.difficulty] || ''}`;

  $('question-statement').textContent = q.statement;

  // Options
  const list = $('options-list');
  list.innerHTML = '';
  q.displayOptions.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (state.answers[index] === i ? ' selected' : '');
    btn.innerHTML = `
      <span class="option-letter">${getLetter(i)}</span>
      <span class="option-text">${text}</span>
    `;
    btn.addEventListener('click', () => selectOption(index, i));
    list.appendChild(btn);
  });

  // Help button vinculado à questão atual
  $('btn-help').onclick = () => openReportModal(q.id);

  // Navigation buttons
  $('btn-prev').disabled = index === 0;
  $('btn-next').disabled = index === total - 1;

  // Update dots
  updateDots(index);
}

function selectOption(questionIndex, optionIndex) {
  state.answers[questionIndex] = optionIndex;
  renderQuestion(questionIndex);
  updateDots(questionIndex);
}

function buildDots() {
  const container = $('question-dots');
  container.innerHTML = '';
  state.questions.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'q-dot';
    dot.textContent = i + 1;
    dot.addEventListener('click', () => renderQuestion(i));
    container.appendChild(dot);
  });
}

function updateDots(currentIndex) {
  const dots = document.querySelectorAll('.q-dot');
  dots.forEach((dot, i) => {
    dot.className = 'q-dot' +
      (i === currentIndex          ? ' active'   : '') +
      (state.answers[i] !== undefined ? ' answered' : '');
  });
}

function bindNavigation() {
  $('btn-prev').addEventListener('click', () => {
    if (state.currentIndex > 0) renderQuestion(state.currentIndex - 1);
  });

  $('btn-next').addEventListener('click', () => {
    if (state.currentIndex < state.questions.length - 1) renderQuestion(state.currentIndex + 1);
  });

  $('btn-submit').addEventListener('click', () => openSubmitModal());
  $('btn-confirm-submit').addEventListener('click', () => submitExam(false));
  $('btn-cancel-submit').addEventListener('click', () => $('submit-modal').classList.add('hidden'));
}

function openSubmitModal() {
  const total = state.questions.length;
  const answered = Object.keys(state.answers).length;
  const unanswered = total - answered;

  const msg = unanswered > 0
    ? `Você ainda tem ${unanswered} questão(ões) sem resposta. Deseja finalizar mesmo assim?`
    : `Todas as ${total} questões foram respondidas. Confirma o envio?`;

  $('modal-unanswered').textContent = msg;
  $('submit-modal').classList.remove('hidden');
}

function submitExam(byTimer) {
  state.timer?.stop();
  $('submit-modal').classList.add('hidden');
  $('pause-overlay').classList.add('hidden');

  const score = calculateResult(state.questions, state.answers);
  const timeUsed = Math.round((Date.now() - state.startTime) / 1000);

  const result = {
    date:     new Date().toISOString(),
    mode:     state.config.mode,
    byTimer,
    timeUsed,
    score,
    config:   state.config
  };

  saveResult(result);
  window.location.href = '/resultado';
}

// ---- RELATO DE PROBLEMA ----

let _reportQuestionId = null;

function openReportModal(questionId) {
  _reportQuestionId = questionId;
  $('report-name').value    = '';
  $('report-email').value   = '';
  $('report-message').value = '';
  $('report-send').disabled = false;
  $('report-send').textContent = 'Enviar';
  $('report-modal').classList.remove('hidden');
  state.timer?.pause();
}

function bindReportForm() {
  $('btn-close-report').addEventListener('click', () => {
    $('report-modal').classList.add('hidden');
    state.timer?.resume();
  });

  $('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('report-send');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const res = await fetch('/api/report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       $('report-name').value.trim(),
          email:      $('report-email').value.trim(),
          message:    $('report-message').value.trim(),
          questionId: _reportQuestionId
        })
      });

      if (!res.ok) throw new Error('Falha no envio');

      $('report-modal').classList.add('hidden');
      state.timer?.resume();
      showToast('Relato enviado! Obrigado pelo feedback.');
    } catch {
      btn.disabled = false;
      btn.textContent = 'Erro — tente novamente';
    }
  });
}

function showToast(msg, type = '') {
  const toast = document.createElement('div');
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

init();
