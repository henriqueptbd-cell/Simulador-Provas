const express = require('express');
const router = express.Router();
const { loadSubject, loadAll, getSubjectDirs, getStats, loadSubjectMeta, getCatalog, enrichQuestions } = require('../utils/loader');

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function applyFilters(questions, { difficulty, style, discipline, exam }) {
  let qs = questions;
  if (difficulty) qs = qs.filter(q => q.difficulty === difficulty);
  if (style)      qs = qs.filter(q => q.style === style);
  if (discipline) qs = qs.filter(q => q.discipline === discipline);
  if (exam)       qs = qs.filter(q => q.exam === exam);
  return qs;
}

// GET /api/questions/stats
router.get('/stats', (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/subjects?discipline=...&exam=...&difficulty=...&style=...
router.get('/subjects', (req, res) => {
  try {
    const { discipline, exam, difficulty, style } = req.query;
    const dirs = getSubjectDirs();
    const stats = getStats();
    const filters = { discipline, exam, difficulty, style };
    const hasFilter = Object.values(filters).some(Boolean);

    const subjects = dirs.map(id => {
      const meta = loadSubjectMeta(id);
      let count = stats.bySubject[id] || 0;

      if (hasFilter) {
        count = applyFilters(loadSubject(id), filters).length;
      }

      return { id, label: meta.label || id, icon: meta.icon || '📚', totalQuestions: count };
    });

    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/catalog
router.get('/catalog', (req, res) => {
  try {
    res.json(getCatalog());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/filters
router.get('/filters', (req, res) => {
  try {
    const all = loadAll();
    const allQs = Object.values(all).flat();

    const styles = [...new Set(allQs.map(q => q.style).filter(Boolean))].sort();

    const diffOrder = ['easy', 'medium', 'hard'];
    const difficulties = [...new Set(allQs.map(q => q.difficulty).filter(Boolean))];
    difficulties.sort((a, b) => {
      const ia = diffOrder.indexOf(a);
      const ib = diffOrder.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    res.json({ difficulties, styles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/random?subjects=...&perSubject=5&total=20&difficulty=easy&style=...&discipline=...&exam=...&exclude=id1,id2
router.get('/random', (req, res) => {
  try {
    const { subjects, perSubject, total, difficulty, style, discipline, exam, exclude } = req.query;
    const perSubjectCount = Math.min(parseInt(perSubject) || 5, 20);
    const filters = { difficulty, style, discipline, exam };
    const excludeSet = exclude ? new Set(exclude.split(',').filter(Boolean)) : null;

    let questions = [];

    if (subjects) {
      const list = subjects.split(',').map(s => s.trim()).filter(Boolean);
      for (const subject of list) {
        try {
          const qs = applyFilters(loadSubject(subject), filters);
          if (excludeSet && excludeSet.size > 0) {
            const unseen = qs.filter(q => !excludeSet.has(q.id));
            const seen   = qs.filter(q =>  excludeSet.has(q.id));
            questions.push(...[...shuffle(unseen), ...shuffle(seen)].slice(0, perSubjectCount));
          } else {
            questions.push(...shuffle(qs).slice(0, perSubjectCount));
          }
        } catch {
          // ignore unknown subjects
        }
      }
      questions = shuffle(questions);
    } else {
      const all = loadAll();
      questions = shuffle(applyFilters(Object.values(all).flat(), filters));
    }

    if (total) questions = questions.slice(0, parseInt(total));

    res.json({ count: questions.length, questions: enrichQuestions(questions) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions?subject=...&topic=...&difficulty=...&style=...&discipline=...&exam=...&limit=10
router.get('/', (req, res) => {
  try {
    const { subject, topic, difficulty, style, discipline, exam, limit } = req.query;
    const filters = { difficulty, style, discipline, exam };

    let questions;
    if (subject) {
      questions = loadSubject(subject);
    } else {
      const all = loadAll();
      questions = Object.values(all).flat();
    }

    if (topic) questions = questions.filter(q => q.topic === topic);
    questions = applyFilters(questions, filters);
    if (limit) questions = questions.slice(0, parseInt(limit));

    res.json({ count: questions.length, questions: enrichQuestions(questions) });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
