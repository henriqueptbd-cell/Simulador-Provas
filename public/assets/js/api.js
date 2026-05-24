const BASE = '/api/questions';

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function getSubjects() {
  return get(`${BASE}/subjects`);
}

export function getStats() {
  return get(`${BASE}/stats`);
}

export function getQuestions(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return get(`${BASE}${qs ? '?' + qs : ''}`);
}

export function getRandomQuestions(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return get(`${BASE}/random${qs ? '?' + qs : ''}`);
}

export function getFilters() {
  return get(`${BASE}/filters`);
}
