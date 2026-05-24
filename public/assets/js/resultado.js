import { loadResult, saveConfig, saveToHistory } from './storage.js';
import {
  groupBySubject, getPerformanceLabel,
  SUBJECT_ICONS, SUBJECT_LABELS, getLetter, formatDate
} from './quiz.js';
import { initTheme } from './theme.js';

const $ = id => document.getElementById(id);

function init() {
  initTheme();
  const result = loadResult();
  if (!result) { window.location.href = '/'; return; }

  saveToHistory(result);
  render(result);
  bindRetry(result.config);
}

function render(result) {
  const { score } = result;
  const perf = getPerformanceLabel(score.percentage);

  // Score circle animado
  animateScore(score.percentage, perf.color);

  $('result-label').textContent  = perf.label;
  $('score-detail').textContent  = `${score.correct} de ${score.total} questões corretas`;
  $('result-date').textContent   = formatDate(result.date);

  renderBreakdown(score.details);
  renderReview(score.details);
}

function animateScore(targetPct, color) {
  const circle = $('score-circle');
  const display = $('score-percent');
  let current = 0;

  circle.style.setProperty('--pct', '0%');
  display.textContent = '0%';

  const step = () => {
    current = Math.min(current + 2, targetPct);
    display.textContent = `${current}%`;
    circle.style.setProperty('--pct', `${current}%`);

    if (current < targetPct) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  // Cor do círculo baseada na performance
  circle.style.background = `conic-gradient(${color} var(--pct, 0%), var(--border) 0%)`;
}

function renderBreakdown(details) {
  const groups = groupBySubject(details);
  const grid = $('breakdown-grid');
  grid.innerHTML = '';

  for (const [, data] of Object.entries(groups)) {
    const pct = Math.round((data.correct / data.total) * 100);
    const barClass = pct >= 70 ? 'high' : pct >= 50 ? 'mid' : 'low';

    const card = document.createElement('div');
    card.className = 'breakdown-card fade-in';
    card.innerHTML = `
      <div class="breakdown-subject">${data.icon} ${data.label}</div>
      <div class="breakdown-bar-wrap">
        <div class="breakdown-bar ${barClass}" style="width:0%" data-pct="${pct}"></div>
      </div>
      <div class="breakdown-score">${data.correct}/${data.total} corretas (${pct}%)</div>
    `;
    grid.appendChild(card);
  }

  // Animar barras
  requestAnimationFrame(() => {
    document.querySelectorAll('.breakdown-bar').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  });
}

function renderReview(details) {
  const list = $('review-list');
  list.innerHTML = '';

  details.forEach((d, i) => {
    const { question: q, userAnswer, isCorrect } = d;
    const item = document.createElement('div');
    item.className = `review-item ${isCorrect ? 'correct-item' : 'wrong-item'}`;

    const preview = q.statement.length > 80 ? q.statement.slice(0, 80) + '…' : q.statement;
    const statusIcon = isCorrect ? '✓' : '✗';

    const optionsHtml = q.displayOptions.map((text, j) => {
      let cls = '';
      if (j === q.correctDisplayIndex) cls = 'correct-opt';
      else if (j === userAnswer && !isCorrect) cls = 'wrong-opt';
      return `
        <div class="review-option ${cls}">
          <strong>${getLetter(j)})</strong> ${text}
          ${j === q.correctDisplayIndex ? ' ✓' : ''}
          ${j === userAnswer && !isCorrect ? ' ✗' : ''}
        </div>
      `;
    }).join('');

    item.innerHTML = `
      <div class="review-header">
        <div class="review-status">${statusIcon}</div>
        <div class="review-question-preview">${i + 1}. ${preview}</div>
        <div class="review-toggle">▼</div>
      </div>
      <div class="review-body">
        <p class="review-statement">${q.statement}</p>
        <div class="review-options">${optionsHtml}</div>
        <div class="review-explanation">
          <strong>Comentário:</strong> ${q.explanation}
        </div>
      </div>
    `;

    item.querySelector('.review-header').addEventListener('click', () => {
      item.classList.toggle('open');
    });

    list.appendChild(item);
  });
}

function bindRetry(config) {
  $('btn-retry').addEventListener('click', () => {
    saveConfig(config);
    window.location.href = '/simulado';
  });
}

init();
