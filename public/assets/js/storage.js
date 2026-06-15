const KEYS = {
  config:  'sp_config',
  result:  'sp_result',
  history: 'sp_history'
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently fail
  }
}

export function saveConfig(config) { write(KEYS.config, config); }
export function loadConfig()       { return read(KEYS.config); }
export function clearConfig()      { localStorage.removeItem(KEYS.config); }

export function saveResult(result) { write(KEYS.result, result); }
export function loadResult()       { return read(KEYS.result); }

export function saveToHistory(result) {
  const history = loadHistory();
  history.unshift(result);
  write(KEYS.history, history.slice(0, 5));
}

export function loadHistory() { return read(KEYS.history) || []; }

const SEEN_PREFIX = 'sp_seen_';

export function getSeenQuestions(subject) {
  return read(SEEN_PREFIX + subject) || [];
}

export function addSeenQuestions(subject, ids) {
  const seen = new Set(getSeenQuestions(subject));
  ids.forEach(id => seen.add(id));
  write(SEEN_PREFIX + subject, [...seen]);
}

export function resetSeenQuestions(subject) {
  try { localStorage.removeItem(SEEN_PREFIX + subject); } catch {}
}
