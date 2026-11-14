/* 两个可拖拽、缩放的独立手机小窗（保留 iPhone 拟真边框），以及九步演示（三端联动 + 支付风控）。 */
window.FloatingPhones = (() => {
  const windows = new Map();
  const labels = { elder: '长辈端', family: '家属端' };
  let top = 40, gesture = null;
  const clamp = (n, min, max) => Math.max(min, Math.min(n, Math.max(min, max)));
  const icon = window.Icons.svg;
  function fit(item) {
    const { el } = item;
    const width = clamp(el.offsetWidth || 320, Math.min(270, innerWidth - 16), innerWidth - 16);
    const height = clamp(el.offsetHeight || 700, Math.min(450, innerHeight - 16), innerHeight - 16);
    el.style.width = `${width}px`; el.style.height = `${height}px`;
    el.style.left = `${clamp(parseFloat(el.style.left) || 0, 8, innerWidth - width - 8)}px`;
    el.style.top = `${clamp(parseFloat(el.style.top) || 0, 8, innerHeight - height - 8)}px`;
  }
  function front(item) { item.el.style.zIndex = ++top; }
  function syncButton(role, visible) { document.querySelector(`[data-phone-open="${role}"]`)?.setAttribute('aria-expanded', String(visible)); }
  function open(role, route) {
    if (!labels[role]) return;
    let item = windows.get(role);
    if (!item) {
      const el = document.createElement('section');
      el.id = `phone-window-${role}`;
      el.className = 'phone-window';
      el.setAttribute('aria-label', `${labels[role]}手机小窗`);
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'false');
      el.innerHTML = `<header class="phone-window-bar"><span class="phone-window-grip" tabindex="0" aria-label="拖动${labels[role]}小窗，方向键移动">${icon(role === 'elder' ? 'shield' : 'users')}<strong>${labels[role]}</strong><span class="window-grip-dots" aria-hidden="true">⠿</span></span><button class="window-button" data-window-action="arrange" title="恢复位置" aria-label="恢复${labels[role]}小窗位置">${icon('grid')}</button><button class="window-button" data-window-action="close" title="关闭小窗" aria-label="关闭${labels[role]}小窗">${icon('close')}</button></header><iframe class="phone-frame" title="${labels[role]}手机页面" src="mobile.html?v=20261011-present-5&role=${role}#overview"></iframe><span class="phone-resize" tabindex="0" role="button" aria-label="调整${labels[role]}小窗大小，方向键缩放">${icon('panel')}</span>`;
      document.getElementById('phone-windows').append(el);
      item = { el, role, ready: false, pending: null };
      windows.set(role, item);
      arrangeOne(item);
      el.addEventListener('pointerdown', () => front(item));
      el.querySelector('.phone-window-bar').addEventListener('pointerdown', e => begin(e, item, 'move'));
      el.querySelector('.phone-resize').addEventListener('pointerdown', e => begin(e, item, 'resize'));
      el.addEventListener('click', e => {
        const action = e.target.closest('[data-window-action]')?.dataset.windowAction;
        if (action === 'close') close(role);
        if (action === 'arrange') arrangeOne(item);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Escape') { close(role); return; }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || !e.target.matches('.phone-window-grip,.phone-resize')) return;
        e.preventDefault();
        const amount = e.shiftKey ? 30 : 10;
        const horizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
        const delta = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -amount : amount;
        const prop = e.target.matches('.phone-resize') ? (horizontal ? 'width' : 'height') : (horizontal ? 'left' : 'top');
        el.style[prop] = `${parseFloat(el.style[prop]) + delta}px`;
        fit(item);
      });
    }
    if (innerWidth <= 900) windows.forEach(other => {
      if (other.role !== role) { other.el.hidden = true; syncButton(other.role, false); }
    });
    item.el.hidden = false; front(item); fit(item); syncButton(role, true);
    if (route) navigate(role, route.page, route.path || '');
    return item;
  }
  function arrangeOne(item) {
    const width = Math.min(innerWidth < 700 ? 300 : 320, innerWidth - 24);
    const height = Math.min(720, innerHeight - 118);
    item.el.style.width = `${width}px`; item.el.style.height = `${height}px`;
    const left = innerWidth <= 900 ? Math.round((innerWidth - width) / 2) : item.role === 'elder' ? 116 : innerWidth - width - 22;
    item.el.style.left = `${left}px`;
    item.el.style.top = `${innerWidth < 700 ? 110 : 96}px`;
    fit(item);
  }
  function arrangeAll() {
    if (innerWidth <= 900) {
      const active = [...windows.values()].find(item => !item.el.hidden) || windows.get('elder');
      if (active) { open(active.role); arrangeOne(active); }
      return;
    }
    windows.forEach(item => { item.el.hidden = false; syncButton(item.role, true); arrangeOne(item); });
  }
  function close(role) {
    const item = windows.get(role); if (!item) return;
    item.el.hidden = true; syncButton(role, false);
    document.querySelector(`[data-phone-open="${role}"]`)?.focus({ preventScroll: true });
  }
  function navigate(role, page, path = '') {
    const item = windows.get(role) || open(role);
    item.el.hidden = false; syncButton(role, true);
    if (item.ready) item.el.querySelector('iframe').contentWindow.MobileWindow.navigate(page, path);
    else item.pending = { page, path };
  }
  function ready(role) {
    const item = windows.get(role); if (!item) return;
    item.ready = true;
    if (item.pending) { const route = item.pending; item.pending = null; navigate(role, route.page, route.path); }
  }
  function begin(e, item, type) {
    if (e.button !== 0 || e.target.closest('button')) return;
    e.preventDefault();
    gesture = { item, type, x: e.clientX, y: e.clientY, left: parseFloat(item.el.style.left), top: parseFloat(item.el.style.top), width: item.el.offsetWidth, height: item.el.offsetHeight };
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.classList.add('phone-window-dragging');
  }
  document.addEventListener('pointermove', e => {
    if (!gesture) return;
    const g = gesture, dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (g.type === 'move') { g.item.el.style.left = `${g.left + dx}px`; g.item.el.style.top = `${g.top + dy}px`; }
    else { g.item.el.style.width = `${g.width + dx}px`; g.item.el.style.height = `${g.height + dy}px`; }
    fit(g.item);
  });
  function end() { gesture = null; document.body.classList.remove('phone-window-dragging'); }
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end); window.addEventListener('blur', end);
  window.addEventListener('resize', () => windows.forEach(item => { if (!item.el.hidden) fit(item); }));
  /* 主题变化只同步视觉，不重建手机表单。 */
  new MutationObserver(() => windows.forEach(item => {
    if (item.ready) item.el.querySelector('iframe').contentWindow.MobileWindow.sync();
  })).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('click', e => {
    const role = e.target.closest('[data-phone-open]')?.dataset.phoneOpen;
    if (role) { open(role); }
  });
  return { open, close, navigate, ready, arrangeAll, activate(role) { const item = windows.get(role); if (item) front(item); }, changed() { window.DemoTour?.render(); } };
})();

/* 九步演示：三端联动（长辈 → 家属 → 管理端）+ 支付风控（L3 发起 → 冻结 → 双确认 → 审计回放）。 */
window.DemoTour = (() => {
  const D = () => window.DemoData;
  const W = () => window.Workbench;
  const F = () => window.FloatingPhones;
  const icon = window.Icons.svg;
  let demo = null;
  let opener = null;
  const demoL3 = () => demo ? D().transactions.find(t => t.level === 'L3' && !demo.baseTxnIds.includes(t.id)) : null;
  const STEPS = [
    { ready: () => true, locate: () => { F().open('elder'); F().navigate('elder', 'risks', 'r2'); } },
    { ready: () => D().requests.length > 0, locate: () => { F().open('elder'); F().navigate('elder', 'family', 'help/f1/r2'); } },
    { ready: () => true, locate: () => { F().open('family'); F().navigate('family', 'family', 'requests'); } },
    { ready: () => D().requests.some(q => q.resolved), locate: () => { const q = D().requests.find(x => !x.resolved) || D().requests[0]; F().open('family'); F().navigate('family', 'family', q ? `request/${q.id}` : 'requests'); } },
    { ready: () => true, locate: () => { F().close('elder'); F().close('family'); W().navigate('overview'); } },
    { ready: () => Boolean(demoL3()), locate: () => { W().setRole('guardian', true); W().navigate('payment-new'); } },
    { ready: () => { const t = demoL3(); return Boolean(t) && t.status === 'frozen'; }, locate: () => { const t = demoL3(); if (t) location.hash = `#/payment/${t.id}`; else W().navigate('payment-new'); } },
    { ready: () => { const t = demoL3(); return Boolean(t) && t.status === 'executed'; }, locate: () => { const t = demoL3(); W().setRole('guardian', true); if (t) location.hash = `#/payment/${t.id}`; } },
    { ready: () => true, locate: () => { W().navigate('audit'); } },
  ];
  function render() {
    const dock = document.getElementById('demo-dock');
    dock.hidden = !demo;
    document.body.classList.toggle('demo-active', Boolean(demo));
    dock.dataset.stage = demo && demo.index < 4 ? 'family' : 'admin';
    document.getElementById('demo-launch')?.setAttribute('aria-expanded', String(Boolean(demo)));
    if (!demo) return;
    const meta = D().demoSteps;
    if (demo.complete) {
      dock.innerHTML = `<div class="demo-top"><strong>${icon('check')}展示完成</strong><button class="window-button" data-demo="exit" aria-label="关闭导览">${icon('close')}</button></div><div class="demo-result-list"><span class="demo-result">${icon('check')}家庭协同</span><span class="demo-result">${icon('check')}双确认放行</span><span class="demo-result">${icon('check')}全程审计</span></div><div class="demo-actions"><button data-demo="restart">重新演示</button><button class="primary" data-demo="exit">自由体验</button></div>`;
      return;
    }
    const step = STEPS[demo.index];
    const ok = step.ready();
    const current = meta[demo.index];
    dock.innerHTML = `
      <div class="demo-phase"><span>${current.phase}</span><span class="demo-phase-time">${current.duration}</span></div>
      <div class="demo-progress" role="progressbar" aria-label="当前展示步骤" aria-valuemin="1" aria-valuemax="${meta.length}" aria-valuenow="${demo.index + 1}"><span style="width:${(demo.index + 1) / meta.length * 100}%"></span></div>
      <div class="demo-top"><strong><span>${demo.index + 1} / ${meta.length}</span>${current.title}</strong><button class="window-button" data-demo="exit" aria-label="退出导览">${icon('close')}</button></div>
      <p>${current.text}</p>
      <div class="demo-actions"><button data-demo="arrange">排列小窗</button><button data-demo="locate">定位操作</button><button class="primary" data-demo="next" ${ok ? '' : 'disabled'}>${demo.index === meta.length - 1 ? '完成展示' : '下一步'} ${icon('arrow')}</button></div>`;
  }
  function start() {
    if (demo && !demo.complete) { render(); return; }
    W().loadDemo();
    W().setRole('guardian', true);
    W().navigate('overview');
    demo = { index: 0, complete: false, baseTxnIds: D().transactions.map(t => t.id) };
    opener = document.activeElement;
    F().open('elder');
    if (innerWidth > 900) F().open('family');
    F().arrangeAll();
    STEPS[0].locate();
    render();
  }
  function exit() {
    demo = null; render();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#demo-launch')) { demo ? exit() : start(); return; }
    const action = e.target.closest('[data-demo]')?.dataset.demo;
    if (!action || !demo) return;
    if (action === 'exit') exit();
    if (action === 'restart') { demo = null; start(); }
    if (action === 'arrange') F().arrangeAll();
    if (action === 'locate') STEPS[demo.index].locate();
    if (action === 'next') {
      if (!demo.complete && !STEPS[demo.index].ready()) return;
      if (demo.index === STEPS.length - 1) demo.complete = true;
      else { demo.index++; STEPS[demo.index].locate(); }
      render();
    }
  });
  window.addEventListener('demo-state-changed', render);
  return { start, exit, render, get active() { return Boolean(demo) && !demo.complete; } };
})();
