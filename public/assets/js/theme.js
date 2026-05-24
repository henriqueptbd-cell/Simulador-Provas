const STORAGE_KEY = 'sp_theme';
const ICONS = { light: '🌙', dark: '☀️' };
const TITLES = { light: 'Modo escuro', dark: 'Modo claro' };

function current() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = ICONS[theme];
    btn.title = TITLES[theme];
    btn.setAttribute('aria-label', TITLES[theme]);
  });
}

export function initTheme() {
  // Sincroniza o ícone com o tema que já foi aplicado pelo script inline no <head>
  apply(current());

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => apply(current() === 'dark' ? 'light' : 'dark'));
  });
}
