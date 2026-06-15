const fs = require('fs');
const path = require('path');

const BD_DIR = path.join(__dirname, '../bd');
const cache = {};

function getSubjectDirs() {
  if (!fs.existsSync(BD_DIR)) return [];
  return fs.readdirSync(BD_DIR).filter(name =>
    fs.statSync(path.join(BD_DIR, name)).isDirectory()
  );
}

function loadSubjectMeta(subject) {
  const cacheKey = `_meta_${subject}`;
  if (cache[cacheKey] !== undefined) return cache[cacheKey];

  const metaPath = path.join(BD_DIR, subject, '_meta.json');
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    : {};

  cache[cacheKey] = meta;
  return meta;
}

function loadSubject(subject) {
  if (cache[subject]) return cache[subject];

  const subjectDir = path.join(BD_DIR, subject);
  if (!fs.existsSync(subjectDir)) {
    throw new Error(`Matéria não encontrada: ${subject}`);
  }

  const questions = [];
  const files = fs.readdirSync(subjectDir)
    .filter(f => f.endsWith('.json') && f !== '_meta.json');

  for (const file of files) {
    const raw = fs.readFileSync(path.join(subjectDir, file), 'utf8');
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      questions.push(...data);
    } else {
      // Novo formato: { _meta, questions }
      const fileMeta = data._meta || {};
      const qs = (data.questions || []).map(q => ({
        discipline:       fileMeta.discipline       || undefined,
        discipline_label: fileMeta.discipline_label || undefined,
        exam:             fileMeta.exam             || undefined,
        exam_label:       fileMeta.exam_label       || undefined,
        semester:         fileMeta.semester         || undefined,
        courses:          fileMeta.courses          || undefined,
        ...q
      }));
      questions.push(...qs);
    }
  }

  cache[subject] = questions;
  return questions;
}

function loadAll() {
  const subjects = getSubjectDirs();
  const all = {};
  for (const subject of subjects) {
    all[subject] = loadSubject(subject);
  }
  return all;
}

function getCatalog() {
  const subjects = getSubjectDirs();
  const disciplines = new Map();
  const exams = new Map();
  const courses = new Set();

  for (const subject of subjects) {
    // Lê disciplina do _meta.json da pasta (funciona para formatos antigos e novos)
    const subjectMeta = loadSubjectMeta(subject);
    if (subjectMeta.discipline) {
      disciplines.set(subjectMeta.discipline, subjectMeta.discipline_label || subjectMeta.discipline);
    }

    const subjectDir = path.join(BD_DIR, subject);
    const files = fs.readdirSync(subjectDir)
      .filter(f => f.endsWith('.json') && f !== '_meta.json');

    for (const file of files) {
      const raw = fs.readFileSync(path.join(subjectDir, file), 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) || !data._meta) continue;

      const m = data._meta;
      if (m.discipline) disciplines.set(m.discipline, m.discipline_label || m.discipline);
      if (m.exam)       exams.set(m.exam, m.exam_label || m.exam);
      if (Array.isArray(m.courses)) m.courses.forEach(c => courses.add(c));
    }
  }

  return {
    disciplines: [...disciplines.entries()].map(([id, label]) => ({ id, label })),
    exams:       [...exams.entries()].map(([id, label]) => ({ id, label })),
    courses:     [...courses].sort()
  };
}

function enrichQuestions(questions) {
  return questions.map(q => {
    const meta = loadSubjectMeta(q.subject);
    return {
      ...q,
      subjectLabel: meta.label || q.subject,
      subjectIcon:  meta.icon  || '📚'
    };
  });
}

function getStats() {
  const all = loadAll();
  const bySubject = {};
  let total = 0;

  for (const [subject, questions] of Object.entries(all)) {
    bySubject[subject] = questions.length;
    total += questions.length;
  }

  return { totalQuestions: total, bySubject };
}

module.exports = { loadSubject, loadAll, getSubjectDirs, getStats, loadSubjectMeta, getCatalog, enrichQuestions };
