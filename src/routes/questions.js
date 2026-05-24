const express = require('express');
const router = express.Router();
const { loadSubject, loadAll, getSubjectDirs, getStats } = require('../utils/loader');

const SUBJECT_LABELS = {
  portugues: 'Português',
  matematica: 'Matemática',
  raciocinio_logico: 'Raciocínio Lógico',
  fisica: 'Física',
  biologia: 'Biologia',
  quimica: 'Química',
  historia: 'História',
  geografia: 'Geografia',
  ingles: 'Inglês'
};

const SUBJECT_ICONS = {
  portugues: '📝',
  matematica: '🔢',
  raciocinio_logico: '🧩',
  fisica: '⚛️',
  biologia: '🧬',
  quimica: '🧪',
  historia: '📜',
  geografia: '🌍',
  ingles: '🌐'
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// GET /api/questions/stats
router.get('/stats', (req, res) => {
  try {
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/subjects
router.get('/subjects', (req, res) => {
  try {
    const dirs = getSubjectDirs();
    const stats = getStats();

    const subjects = dirs.map(id => ({
      id,
      label: SUBJECT_LABELS[id] || id,
      icon: SUBJECT_ICONS[id] || '📚',
      totalQuestions: stats.bySubject[id] || 0
    }));

    res.json({ subjects });
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

// GET /api/questions/random?subjects=portugues,matematica&perSubject=5&total=20&difficulty=easy&style=municipal_igecs
router.get('/random', (req, res) => {
  try {
    const { subjects, perSubject, total, difficulty, style } = req.query;
    const perSubjectCount = Math.min(parseInt(perSubject) || 5, 20);

    let questions = [];

    if (subjects) {
      const list = subjects.split(',').map(s => s.trim()).filter(Boolean);
      for (const subject of list) {
        try {
          let qs = loadSubject(subject);
          if (difficulty) qs = qs.filter(q => q.difficulty === difficulty);
          if (style)      qs = qs.filter(q => q.style === style);
          questions.push(...shuffle(qs).slice(0, perSubjectCount));
        } catch {
          // ignore unknown subjects
        }
      }
      questions = shuffle(questions);
    } else {
      const all = loadAll();
      let allQs = Object.values(all).flat();
      if (difficulty) allQs = allQs.filter(q => q.difficulty === difficulty);
      if (style)      allQs = allQs.filter(q => q.style === style);
      questions = shuffle(allQs);
    }

    if (total) questions = questions.slice(0, parseInt(total));

    res.json({ count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions?subject=portugues&topic=crase&difficulty=easy&limit=10
router.get('/', (req, res) => {
  try {
    const { subject, topic, difficulty, style, limit } = req.query;

    let questions;
    if (subject) {
      questions = loadSubject(subject);
    } else {
      const all = loadAll();
      questions = Object.values(all).flat();
    }

    if (topic) questions = questions.filter(q => q.topic === topic);
    if (difficulty) questions = questions.filter(q => q.difficulty === difficulty);
    if (style) questions = questions.filter(q => q.style === style);
    if (limit) questions = questions.slice(0, parseInt(limit));

    res.json({ count: questions.length, questions });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
