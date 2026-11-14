/* 放在 head 中立即执行：先恢复主题，避免深色页面加载时闪出浅色背景。 */
(() => {
  const storageKey = 'pension-shield-theme';
  let theme = 'light';
  try { if (localStorage.getItem(storageKey) === 'dark') theme = 'dark'; } catch { /* 默认浅色。 */ }
  document.documentElement.dataset.theme = theme;
  function sync() {
    const dark = theme === 'dark';
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', `当前${dark ? '深' : '浅'}色，切换${dark ? '浅' : '深'}色主题`);
    button.title = `切换${dark ? '浅' : '深'}色主题`;
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0b1424' : '#2563eb';
  }
  document.addEventListener('DOMContentLoaded', () => {
    sync();
    document.getElementById('theme-toggle').addEventListener('click', () => {
      theme = theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      sync();
      try { localStorage.setItem(storageKey, theme); }
      catch {
        const status = document.getElementById('toast');
        status.textContent = '主题已切换；浏览器未允许保存，刷新后恢复默认。';
        status.hidden = false;
        setTimeout(() => { status.hidden = true; }, 4200);
      }
    });
  });
})();
