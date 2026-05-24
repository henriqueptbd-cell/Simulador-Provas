const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export const SUBJECT_LABELS = {
  portugues:        'Português',
  matematica:       'Matemática',
  raciocinio_logico:'Raciocínio Lógico',
  fisica:           'Física',
  biologia:         'Biologia',
  quimica:          'Química',
  historia:         'História',
  geografia:        'Geografia',
  ingles:           'Inglês'
};

export const SUBJECT_ICONS = {
  portugues:        '📝',
  matematica:       '🔢',
  raciocinio_logico:'🧩',
  fisica:           '⚛️',
  biologia:         '🧬',
  quimica:          '🧪',
  historia:         '📜',
  geografia:        '🌍',
  ingles:           '🌐'
};

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function prepareQuestion(question) {
  const indexed = question.options.map((text, i) => ({ text, isCorrect: i === question.correctIndex }));
  const shuffled = shuffle(indexed);
  return {
    ...question,
    displayOptions: shuffled.map(o => o.text),
    correctDisplayIndex: shuffled.findIndex(o => o.isCorrect)
  };
}

export function calculateResult(preparedQuestions, answers) {
  let correct = 0;
  const details = preparedQuestions.map((q, i) => {
    const isCorrect = answers[i] === q.correctDisplayIndex;
    if (isCorrect) correct++;
    return { question: q, userAnswer: answers[i] ?? -1, isCorrect };
  });

  return {
    correct,
    total: preparedQuestions.length,
    percentage: Math.round((correct / preparedQuestions.length) * 100),
    details
  };
}

export function groupBySubject(details) {
  const groups = {};
  for (const d of details) {
    const s = d.question.subject;
    if (!groups[s]) groups[s] = { correct: 0, total: 0, icon: SUBJECT_ICONS[s] || '📚', label: SUBJECT_LABELS[s] || s };
    groups[s].total++;
    if (d.isCorrect) groups[s].correct++;
  }
  return groups;
}

export function getPerformanceLabel(pct) {
  if (pct >= 90) return { label: 'Excelente!',        color: 'var(--green-700)' };
  if (pct >= 70) return { label: 'Muito Bom!',        color: 'var(--green-500)' };
  if (pct >= 50) return { label: 'Regular',           color: 'var(--gold-500)' };
  return              { label: 'Precisa Melhorar',  color: 'var(--red-600)' };
}

export function getLetter(i) { return LETTERS[i] || String(i + 1); }

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
