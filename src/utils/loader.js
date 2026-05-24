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

function loadSubject(subject) {
  if (cache[subject]) return cache[subject];

  const subjectDir = path.join(BD_DIR, subject);
  if (!fs.existsSync(subjectDir)) {
    throw new Error(`Matéria não encontrada: ${subject}`);
  }

  const questions = [];
  const files = fs.readdirSync(subjectDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(subjectDir, file), 'utf8');
    const data = JSON.parse(raw);
    questions.push(...data);
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

module.exports = { loadSubject, loadAll, getSubjectDirs, getStats };
