/* 只管理侧栏宽度、账户菜单和本机演示资料，不改变业务页面。
 * 管理端：显示当前演示身份（来自 RoleSession），点击可切换角色；
 * 手机端：编辑长辈 / 家属的本机演示资料。 */
window.Sidebar = (() => {
  const root = document.documentElement;
  const mobile = matchMedia('(max-width: 760px)');
  const profilesKey = 'pension-shield-sidebar-profiles';
  const widthKey = 'pension-shield-sidebar-expanded';
  const defaults = {
    elder: { displayName: '陈桂芳', bio: '和家人一起安心生活', color: 'ink' },
    family: { displayName: '陈曦', bio: '陪伴，是一份日常的关心', color: 'blue' },
    admin: { displayName: '管理员', bio: '管理工作台', color: 'sage' },
  };
  const roleLabels = { elder: '长辈端', family: '家属端', admin: '管理端' };
  const profiles = structuredClone(defaults);
  let desktopExpanded = false;
  let editingRole = 'elder';
  let initialized = false;
  try {
    desktopExpanded = localStorage.getItem(widthKey) === 'true';
    const saved = JSON.parse(localStorage.getItem(profilesKey) || '{}');
    Object.keys(defaults).forEach(role => {
      const item = saved?.[role];
      if (!item || typeof item.displayName !== 'string' || !item.displayName.trim()) return;
      profiles[role] = { displayName: item.displayName.trim().slice(0, 16), bio: typeof item.bio === 'string' ? item.bio.slice(0, 40) : '', color: ['ink', 'blue', 'sage'].includes(item.color) ? item.color : 'ink' };
    });
  } catch { /* 存储不可用时使用虚构默认资料。 */ }
  const $ = selector => document.querySelector(selector);
  const mode = () => root.dataset.appMode === 'admin' ? 'admin' : ($('.role-tab.active')?.dataset.value || 'elder');
  function isExpanded() { return root.dataset.sidebar === 'expanded'; }
  function closeAccount(focus = false) {
    $('#account-popover').hidden = true;
    $('#account-button').setAttribute('aria-expanded', 'false');
    if (focus) $('#account-button').focus({ preventScroll: true });
  }
  function positionAccount() {
    const sidebar = $('#sidebar').getBoundingClientRect();
    const panel = $('#account-popover');
    const width = Math.min(292, innerWidth - 32);
    panel.style.width = `${width}px`;
    panel.style.left = `${Math.min(sidebar.right + 12, innerWidth - width - 16)}px`;
  }
  function setExpanded(open, persist = true) {
    root.dataset.sidebar = open ? 'expanded' : 'collapsed';
    $('#sidebar').classList.toggle('open', open);
    $('#sidebar').inert = false;
    $('#sidebar-toggle').setAttribute('aria-expanded', String(open));
    $('#sidebar-toggle').setAttribute('aria-label', open ? '收起侧栏' : '展开侧栏');
    $('#sidebar-toggle').title = open ? '收起侧栏' : '展开侧栏';
    $('#menu-button').setAttribute('aria-expanded', String(open));
    $('#sidebar-backdrop').hidden = !mobile.matches || !open;
    closeAccount();
    if (persist && !mobile.matches) {
      desktopExpanded = open;
      try { localStorage.setItem(widthKey, String(open)); } catch { /* 当前页面仍可使用。 */ }
    }
  }
  function syncProfile() {
    const current = mode();
    if (current === 'admin' && window.RoleSession) {
      const r = window.RoleSession.role;
      const person = r.personName || '演示身份';
      const subtitle = `${r.label} · ${r.actorId || ''}`;
      $('.profile strong').textContent = person;
      $('.profile small').textContent = subtitle;
      $('#account-menu-name').textContent = person;
      $('#account-menu-role').textContent = subtitle;
      $('#account-button').setAttribute('aria-label', `${person}，打开账户选项`);
      document.querySelectorAll('.account-avatar').forEach(avatar => {
        avatar.textContent = [...person][0];
        avatar.dataset.color = r.tone || 'sage';
      });
      return;
    }
    const profile = profiles[current];
    $('.profile strong').textContent = profile.displayName;
    $('.profile small').textContent = profile.bio || `${roleLabels[current]} · 演示账户`;
    $('#account-menu-name').textContent = profile.displayName;
    $('#account-menu-role').textContent = `${roleLabels[current]} · 演示账户`;
    $('#account-button').setAttribute('aria-label', `${profile.displayName}，打开账户选项`);
    document.querySelectorAll('.account-avatar').forEach(avatar => {
      avatar.textContent = [...profile.displayName][0];
      avatar.dataset.color = profile.color;
    });
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
      const text = link.querySelector('.nav-text');
      if (!text) return;
      link.setAttribute('aria-label', text.textContent);
      link.title = text.textContent;
    });
  }
  function initialize() {
    if (initialized) return;
    initialized = true;
    window.Icons.hydrate($('#account-popover'));
    window.Icons.hydrate($('#account-dialog'));
    setExpanded(mobile.matches ? false : desktopExpanded, false);
    syncProfile();
    $('#sidebar-toggle').addEventListener('click', () => setExpanded(!isExpanded()));
    $('#account-button').addEventListener('click', () => {
      const open = $('#account-popover').hidden;
      $('#account-popover').hidden = !open;
      $('#account-button').setAttribute('aria-expanded', String(open));
      if (open) { syncProfile(); positionAccount(); $('#switch-role').focus({ preventScroll: true }); }
    });
    $('#switch-role').addEventListener('click', () => {
      closeAccount();
      if (window.RoleSession) window.RoleSession.openSwitcher();
    });
    $('#edit-profile')?.addEventListener('click', () => {
      editingRole = mode();
      if (editingRole === 'admin') { closeAccount(); if (window.RoleSession) window.RoleSession.openSwitcher(); return; }
      const profile = profiles[editingRole];
      const form = $('#account-form');
      form.elements.displayName.value = profile.displayName;
      form.elements.displayName.setCustomValidity('');
      form.elements.bio.value = profile.bio;
      form.elements.color.value = profile.color;
      $('#account-save-status').textContent = '';
      closeAccount();
      $('#account-dialog').showModal();
    });
    $('#account-settings').addEventListener('click', () => { closeAccount(); if (mobile.matches) setExpanded(false, false); });
    ['#account-dialog-close', '#account-cancel'].forEach(selector => $(selector)?.addEventListener('click', () => $('#account-dialog').close()));
    $('#account-dialog').addEventListener('close', () => $('#account-button').focus({ preventScroll: true }));
    $('#account-form').addEventListener('input', () => $('#account-form').elements.displayName.setCustomValidity(''));
    $('#account-form').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.target;
      const name = form.elements.displayName.value.trim();
      if (!name) { form.elements.displayName.setCustomValidity('请输入称呼，不能只填空格。'); form.elements.displayName.reportValidity(); return; }
      profiles[editingRole] = { displayName: name, bio: form.elements.bio.value.trim(), color: form.elements.color.value };
      syncProfile();
      window.dispatchEvent(new Event('sidebar-profile-changed'));
      try { localStorage.setItem(profilesKey, JSON.stringify(profiles)); $('#account-dialog').close(); }
      catch { $('#account-save-status').textContent = '已在本次页面中保存；浏览器未允许本机存储，刷新后恢复默认。'; }
    });
    document.addEventListener('click', event => { if (!event.target.closest('#account-popover, #account-button')) closeAccount(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#account-popover').hidden) { event.stopPropagation(); closeAccount(true); } });
    window.addEventListener('resize', () => { if (!$('#account-popover').hidden) positionAccount(); });
    mobile.addEventListener('change', () => setExpanded(mobile.matches ? false : desktopExpanded, false));
    window.addEventListener('hashchange', () => closeAccount());
  }
  window.addEventListener('demo-state-changed', () => { if (initialized) syncProfile(); });
  window.addEventListener('role-changed', () => { if (initialized) syncProfile(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
  return { setExpanded, isExpanded, initialize, syncProfile, profile(currentRole = mode()) { return { ...profiles[currentRole] }; }, saveProfile(currentRole, value) {
    if (!Object.hasOwn(profiles, currentRole) || !value.displayName.trim()) return false;
    profiles[currentRole] = { displayName: value.displayName.trim().slice(0, 16), bio: value.bio.trim().slice(0, 40), color: ['ink', 'blue', 'sage'].includes(value.color) ? value.color : 'ink' };
    syncProfile(); let persisted = true;
    try { localStorage.setItem(profilesKey, JSON.stringify(profiles)); } catch { persisted = false; }
    window.dispatchEvent(new Event('sidebar-profile-changed')); return persisted;
  } };
})();
