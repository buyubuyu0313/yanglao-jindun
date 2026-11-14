/* 管理工作台主控：演示角色（意定监护人 / 信托公司 / 监察人）、哈希路由、导航、动作与九步演示。
 * 纯静态：演示状态与审计保存在本机浏览器，不对接任何后端。 */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const icon = window.Icons.svg;
  const D = window.DemoData;
  if (!Array.isArray(D.requests)) D.requests = [];
  D.articles.forEach(article => { if (typeof article.published !== 'boolean') article.published = true; });

  /* ---------- 本机业务状态与不可变演示种子 ---------- */
  const STORE_DATA = 'ps-business-state-v1';
  const dataKeys = ['elders', 'accounts', 'transactions', 'todos', 'risks', 'family', 'requests', 'articles', 'objections'];
  dataKeys.forEach(key => { if (!Array.isArray(D[key])) D[key] = []; });
  const demoSeed = structuredClone(Object.fromEntries(dataKeys.map(key => [key, D[key]])));
  D.dataSession = 'seed';
  let lastSavedState = '';
  let storageFailed = false;
  function applySavedState(raw) {
    if (!raw) return false;
    try {
      const state = JSON.parse(raw);
      if (state.version !== 1 || !Array.isArray(state.audit) || !dataKeys.every(key => Array.isArray(state.data?.[key]))) return false;
      dataKeys.forEach(key => { D[key] = structuredClone(state.data[key]); });
      D.audit = structuredClone(state.audit);
      D.dataSession = typeof state.dataSession === 'string' ? state.dataSession : 'seed';
      lastSavedState = raw;
      return true;
    } catch { return false; }
  }
  try { applySavedState(localStorage.getItem(STORE_DATA)); } catch { /* 存储不可用时保留本次会话。 */ }
  function persistState() {
    const raw = JSON.stringify({ version: 1, data: Object.fromEntries(dataKeys.map(key => [key, D[key]])), audit: D.audit, dataSession: D.dataSession });
    if (raw === lastSavedState) return true;
    try { localStorage.setItem(STORE_DATA, raw); lastSavedState = raw; return true; }
    catch {
      if (!storageFailed) { storageFailed = true; toast('浏览器未能保存数据，本次操作刷新后可能丢失'); }
      return false;
    }
  }

  /* ---------- 角色会话 ---------- */
  const STORE_ROLE = 'ps-role-v2';
  let roleKey = 'guardian';
  try { const saved = localStorage.getItem(STORE_ROLE); if (D.roles.some(r => r.key === saved)) roleKey = saved; } catch { /* 默认监护人。 */ }
  const role = () => D.roles.find(r => r.key === roleKey) || D.roles[0];
  function setRole(key, silent = false) {
    if (!D.roles.some(r => r.key === key) || key === roleKey) return;
    roleKey = key;
    try { localStorage.setItem(STORE_ROLE, key); } catch { /* 本次会话可用。 */ }
    renderNav(); render();
    if (!silent) toast(`已切换为${role().label}`);
    window.dispatchEvent(new Event('role-changed'));
  }

  /* ---------- 小工具 ---------- */
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nowTime = () => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const today = () => { const d = new Date(); return `${d.getMonth() + 1 < 10 ? '0' : ''}${d.getMonth() + 1}-${d.getDate() < 10 ? '0' : ''}${d.getDate()}`; };
  const yuan = n => `¥${Number(n).toLocaleString('zh-CN')}`;
  const levelTag = (level, kind = '') => `<span class="lvl lvl-${String(level).toLowerCase()}">${esc(level)}${kind ? ` · ${esc(kind)}` : ''}</span>`;
  const levelName = { L0: '正常', L1: '关注', L2: '可疑', L3: '高危' };
  const statusName = { draft: '草稿', pending: '待确认', frozen: '已冻结', released: '已放行', executed: '已执行', rejected: '已驳回' };
  const txnById = id => D.transactions.find(t => t.id === id);
  function toast(message) { clearTimeout(toast.timer); $('#toast').textContent = message; $('#toast').hidden = false; toast.timer = setTimeout(() => { $('#toast').hidden = true; }, 3200); }

  /* ---------- 审计与操作 ---------- */
  function auditPush(actor, text, txn, level, tag, detail, elderId) {
    D.audit.unshift({ date: today(), time: nowTime(), timestamp: new Date().toISOString(), dataSession: D.dataSession, actor, text, level: level || '—', tag: tag || '', txn: txn || '', detail: detail || '', elderId: elderId || '' });
  }
  function trailPush(txn, actor, action, from, to) { txn.trail.push({ time: `${today()} ${nowTime()}`, actor, action, from, to }); }

  /* ---------- 业务动作（全部为本地模拟） ---------- */
  function submitPayment(fields) {
    const account = D.accounts.find(a => a.id === fields.accountId) || D.accounts[0];
    if (!account) { toast('暂无可用账户，无法发起支付申请'); return null; }
    const seq = String(D.transactions.length + 1).padStart(3, '0');
    const id = `P20261010-${seq}`;
    const isScam = fields.case === 'scam';
    const isBig = fields.case === 'big';
    const level = isScam ? 'L3' : isBig ? 'L2' : 'L0';
    const amount = Number(fields.amount) || 0;
    const hits = isScam
      ? [
          { code: 'R03', name: '大额转账', kind: '硬', note: `${yuan(amount)} ≥ 阈值 ¥50,000`, weight: 120 },
          { code: 'R05', name: '收款方新出现', kind: '硬', note: '收款方不在历史交易名单内', weight: 80 },
          { code: 'R06', name: '非正常时段', kind: '软', note: '演示时段外操作', weight: 15 },
          { code: 'R11', name: '疑似诈骗话术', kind: '软', note: '「加急代缴」话术特征 0.85', weight: 15 },
        ]
      : isBig
        ? [{ code: 'R01', name: '单笔超限', kind: '硬', note: `${yuan(amount)} ≥ 单笔阈值 ¥50,000`, weight: 30 }]
        : [];
    const txn = {
      id, accountId: account.id, elderId: account.elderId, elderName: account.elderName,
      payee: fields.payee || '未填写收款方', payeeAccount: fields.payeeAccount || 'MOCK-ACC-0000',
      amount, purpose: fields.purpose || '未填写用途', channel: fields.channel || '转账',
      source: `${role().label}提交`, applicant: `${role().person}`,
      createdAt: `${today().replace('-', '-')} ${nowTime()}`, status: isScam ? 'frozen' : isBig ? 'pending' : 'executed',
      level, score: isScam ? 230 : isBig ? 30 : 0, guardianConfirmed: false, trustReleased: false,
      hits, missNote: isScam ? '收款方为清单外机构，建议要求补充合同与服务清单后再放行。' : isBig ? '等待信托公司按职责复核确认。' : '未命中硬规则，按基线自动放行。',
      trail: [
        { time: `${today()} ${nowTime()}`, actor: `${role().person}`, action: '提交支付申请', from: '草稿', to: '已提交' },
        { time: `${today()} ${nowTime()}`, actor: '规则引擎', action: isScam ? '规则审核完成，命中 2 条硬规则' : isBig ? '规则审核完成，命中 1 条硬规则' : '未命中硬规则，L0 自动放行', from: '已提交', to: isScam ? '已冻结' : isBig ? '待确认' : '已执行' },
      ],
    };
    if (isScam || isBig) {
      txn.trail.push({ time: `${today()} ${nowTime()}`, actor: '编排器', action: isScam ? '按风险等级分派待办：意定监护人 1 人 + 信托公司 1 人' : '按风险等级分派待办：信托公司 1 人', from: '命中挂起', to: txn.status === 'frozen' ? '已冻结' : '待确认' });
    }
    D.transactions.unshift(txn);
    if (txn.status !== 'executed') {
      const targets = isScam
        ? [['guardian', 'G001', '支付确认'], ['trust', 'TRUST-01', '支付复核']]
        : [['trust', 'TRUST-01', '支付复核']];
      targets.forEach(([r, a, kind], i) => D.todos.unshift({ id: `TD-${Date.now()}-${i}`, kind, txnId: id, assigneeRole: r, assignee: a, createdAt: `${today()} ${nowTime()}`, status: 'pending', note: '' }));
    }
    if (isScam) {
      auditPush('规则引擎', '规则审核完成，命中 4 条规则（2 硬 + 2 软）', id, 'L3', '已冻结', `${account.elderName} · 收款方 ${txn.payee} · ${yuan(amount)}`, account.elderId);
      auditPush('家属', '提交支付申请', id, 'L3', '已冻结', `${account.elderName} · 收款方 ${txn.payee} · ${yuan(amount)}`, account.elderId);
    } else if (isBig) {
      auditPush('规则引擎', '规则审核完成，命中 1 条硬规则', id, 'L2', '待确认', `${account.elderName} · 收款方 ${txn.payee} · ${yuan(amount)}`, account.elderId);
    } else {
      auditPush('规则引擎', '未命中硬规则，L0 自动放行并出账', id, 'L0', '已执行', `${account.elderName} · 收款方 ${txn.payee} · ${yuan(amount)}`, account.elderId);
      account.balance -= amount;
    }
    persistState();
    return txn;
  }

  function closeTodosFor(txnId, ...kinds) {
    D.todos.forEach(t => { if (t.txnId === txnId && kinds.some(k => t.kind === k) && t.status === 'pending') { t.status = 'done'; t.note = t.note || '已同步处理'; } });
  }

  function decide(action, id) {
    const txn = txnById(id); if (!txn) return;
    const who = `${role().person}`;
    if (action === 'confirm') {
      if (txn.guardianConfirmed) return toast('该申请已完成确认');
      txn.guardianConfirmed = true;
      trailPush(txn, who, '确认（意定监护人）', statusName[txn.status], statusName[txn.status]);
      closeTodosFor(id, '支付确认');
      if (txn.level === 'L2' && txn.status === 'pending') executeTxn(txn, '意定监护人确认后放行');
      else toast('已确认，等待信托公司复核放行');
      auditPush(who, '确认支付（意定监护人）', id, txn.level, statusName[txn.status], `${txn.elderName} · 收款方 ${txn.payee} · ${yuan(txn.amount)}`, txn.elderId);
    } else if (action === 'release') {
      if (txn.level === 'L3' && !txn.guardianConfirmed) return toast('L3 需要意定监护人先确认，再由信托复核放行');
      executeTxn(txn, '信托公司复核放行');
    } else if (action === 'reject') {
      txn.status = 'rejected';
      trailPush(txn, who, '驳回申请', '待处理', '已驳回');
      closeTodosFor(id, '支付确认', '支付复核');
      auditPush(who, '驳回支付申请', id, txn.level, '已驳回', `${txn.elderName} · 收款方 ${txn.payee} · ${yuan(txn.amount)}`, txn.elderId);
      toast('支付申请已驳回');
    } else if (action === 'freeze') {
      txn.status = 'frozen';
      trailPush(txn, who, '冻结申请', '待确认', '已冻结');
      auditPush(who, '冻结支付申请', id, txn.level, '已冻结', `${txn.elderName} · 收款方 ${txn.payee} · ${yuan(txn.amount)}`, txn.elderId);
      toast('支付申请已冻结');
    } else if (action === 'object') {
      const obj = { id: `OBJ-${Date.now()}`, txnId: txn.id, by: `${role().person}`, createdAt: `${today()} ${nowTime()}`, reason: '收款方无历史交易记录，建议补充合同与服务清单后再放行。', status: 'open', dispatchedTo: '信托公司 TRUST-01（补充说明）', closedAt: '', closeNote: '' };
      D.objections.unshift(obj);
      D.todos.unshift({ id: `TD-${Date.now()}-obj`, kind: '补充说明', txnId: txn.id, assigneeRole: 'trust', assignee: 'TRUST-01', createdAt: `${today()} ${nowTime()}`, status: 'pending', note: '', objectionId: obj.id });
      trailPush(txn, `${role().person}`, '提出异议（只留痕，不改变支付状态）', statusName[txn.status], statusName[txn.status]);
      auditPush(who, '提出异议：收款方无历史交易记录', id, txn.level, '待跟进', `${txn.elderName} · 收款方 ${txn.payee} · ${yuan(txn.amount)}`, txn.elderId);
      toast('异议已提交（只留痕，不改变支付状态）');
    }
    render();
  }

  function executeTxn(txn, reason) {
    if (['executed', 'rejected'].includes(txn.status)) return toast('该支付申请已结束');
    const account = D.accounts.find(a => a.id === txn.accountId);
    if (!account) return toast('关联账户不存在，无法执行支付');
    txn.status = 'executed'; txn.executedAt = `${today()} ${nowTime()}`; txn.trustReleased = true;
    account.balance -= txn.amount;
    trailPush(txn, '信托公司 TRUST-01', `复核通过，执行出账（${reason}）`, '已放行', '已执行');
    closeTodosFor(txn.id, '支付确认', '支付复核');
    auditPush('信托公司 TRUST-01', '复核通过，执行出账', txn.id, txn.level, '已执行', `${txn.elderName} · 收款方 ${txn.payee} · ${yuan(txn.amount)}`, txn.elderId);
    toast('已执行出账，形成资金流水（演示）');
  }

  function todoDone(id, note) {
    const todo = D.todos.find(t => t.id === id); if (!todo || todo.status === 'done') return;
    todo.status = 'done'; todo.note = note || '已处理（演示）';
    if (todo.objectionId) {
      const obj = D.objections.find(o => o.id === todo.objectionId);
      if (obj) { obj.status = 'closed'; obj.closedAt = `${today()} ${nowTime()}`; obj.closeNote = todo.note; }
      auditPush('信托公司 TRUST-01', '提交补充说明，异议终结', todo.txnId, '—', '已终结', obj ? obj.reason : '', '');
    } else {
      auditPush(`${role().person}`, `完成待办：${todo.kind}`, todo.txnId, '—', '完成', '', '');
    }
    toast('待办已标记完成');
    render();
  }

  function markRisk(id) {
    const r = D.risks.find(item => item.id === id); if (!r || r.resolved) return;
    r.resolved = true;
    auditPush(`${role().person}`, `风险核实完成：${r.title}`, '', r.riskLevel || 'L2', '已核实', '', 'E001');
    toast('已标记核实完成（演示）');
    render();
  }

  function expireTodos() {
    let n = 0;
    D.transactions.forEach(t => { if (t.status === 'pending') { t.status = 'frozen'; n++; trailPush(t, 'system', '演示：待办超时回流，支付自动冻结', '待确认', '已冻结'); } });
    auditPush('system', `演示：待办超时回流${n ? `，${n} 笔支付自动冻结` : ''}`, '', '—', '演示', '', '');
    toast(n ? `已触发超时回流：${n} 笔支付自动冻结` : '已触发超时回流（当前无待处理支付）');
    render();
  }

  function resetMobileState() {
    Object.values(mobileRecords).forEach(records => { records.read.clear(); records.saved.clear(); });
    window.dispatchEvent(new Event('demo-data-reset'));
  }
  function restoreDemoSeed() {
    dataKeys.forEach(key => { D[key] = structuredClone(demoSeed[key]); });
    D.transactions.forEach(txn => { txn.trail = []; });
    D.dataSession = `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  function clearAll() {
    window.DemoTour?.exit();
    restoreDemoSeed();
    D.audit = [];
    const saved = persistState();
    resetMobileState();
    history.replaceState(null, '', '#/overview');
    render();
    toast(saved ? '演示操作与审计留痕已清除，展示案例已保留' : '演示已重置，但浏览器未能保存，刷新后可能恢复上次状态');
  }
  function loadDemo() {
    restoreDemoSeed();
    auditPush(`${role().person}`, '开始演示', '', '—', '演示', '载入最新演示初始状态，保留已有审计记录。', '');
    D.audit[0].global = true;
    persistState();
    resetMobileState();
    render();
  }

  /* ---------- 路由 ---------- */
  const TITLES = { '': '角色入口', overview: '', 'payment-new': '发起支付申请', payment: '支付申请详情', todos: '', risks: '', scam: '反诈风险检测', rules: '规则管理', audit: '审计报告', transactions: '交易记录', accounts: '账户管理', family: '家庭成员', content: '内容管理', settings: '界面设置', demo: '演示流程' };
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [pathPart] = raw.split('?');
    const [page = '', ...rest] = pathPart.split('/');
    return { page: page || '', param: rest.join('/') };
  }
  const pageTitle = () => {
    const { page } = parseHash();
    const def = TITLES[page];
    if (def) return def;
    const hit = role().nav.find(n => n.to === page);
    return hit ? hit.label : '角色入口';
  };

  /* ---------- 渲染 ---------- */
  const VIEWS = () => window.Views || {};
  function pageHTML() {
    const V = VIEWS();
    const { page, param } = parseHash();
    if (!page) return V.home ? V.home() : '';
    if (page === 'overview') return (V.workbench || (() => ''))();
    if (page === 'payment-new') return (V.paymentNew || (() => ''))();
    if (page === 'payment') return (V.paymentDetail || (() => ''))(param);
    if (page === 'todos') return (V.todos || (() => ''))();
    if (page === 'risks') return (V.risks || (() => ''))();
    if (page === 'scam') return (V.scam || (() => ''))();
    if (page === 'rules') return (V.rules || (() => ''))();
    if (page === 'audit') return (V.audit || (() => ''))();
    if (page === 'transactions') return (V.transactions || (() => ''))();
    if (page === 'accounts') return (V.accounts || (() => ''))();
    if (page === 'family') return (V.family || (() => ''))();
    if (page === 'content') return (V.content || (() => ''))();
    if (page === 'settings') return (V.settings || (() => ''))();
    if (page === 'demo') return (V.demoConsole || (() => ''))();
    return `<div class="page-pad"><div class="panel"><div class="admin-empty">${icon('grid')}<p>页面不存在，请从左侧导航进入。</p></div></div></div>`;
  }
  function render() {
    persistState();
    $('#main').innerHTML = `<div class="page-enter">${pageHTML()}</div>`;
    $('#breadcrumb-page').textContent = pageTitle();
    document.title = `${pageTitle()} · 养老金盾`;
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      const active = link.dataset.page === parseHash().page;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    const openRisks = D.risks.filter(r => !r.resolved).length;
    const pendingCount = D.todos.filter(t => t.status === 'pending' && t.assigneeRole === roleKey).length;
    const navCount = $('#nav-count-overview');
    if (navCount) { navCount.textContent = pendingCount; navCount.hidden = !pendingCount; }
    $('#notification-dot').hidden = !openRisks;
    $('#notifications').setAttribute('aria-label', `查看${openRisks}条待处置风险`);
    if (window.Sidebar && window.Sidebar.syncProfile) window.Sidebar.syncProfile();
    syncWho();
    window.dispatchEvent(new Event('demo-state-changed'));
  }

  function renderNav() {
    const nav = $('#sidebar-navigation');
    nav.innerHTML = role().nav.map((item, i) => `
      <a class="nav-link" href="#/${item.to}" data-page="${item.to}">
        <span data-icon="${navIcon(item.to)}"></span><span class="nav-text">${esc(item.label)}</span>
        ${i === 0 ? '<span class="nav-count" id="nav-count-overview" hidden></span>' : ''}
      </a>`).join('');
    window.Icons.hydrate(nav);
  }
  function navIcon(to) {
    return ({ overview: 'grid', accounts: 'bank', todos: 'clipboard', risks: 'bell-alert', scam: 'eye', rules: 'scale', audit: 'doc', 'payment-new': 'coin', transactions: 'list', family: 'users', content: 'book', settings: 'settings', demo: 'spark' })[to] || 'grid';
  }

  /* ---------- 身份徽标与角色切换 ---------- */
  function syncWho() {
    const r = role();
    $('#role-who-text').textContent = `${r.label} · ${r.actorId}`;
    $('#role-who').setAttribute('aria-label', `当前身份：${r.label} · ${r.personName}，点击切换`);
    const cards = $('#role-cards');
    if (cards) {
      cards.innerHTML = D.roles.map(item => `
        <button class="role-card ${item.key === roleKey ? 'active' : ''}" data-action="switch-role" data-value="${item.key}">
          <span class="role-card-head"><strong>${esc(item.label)}</strong>${item.tag ? `<span class="tag-gray">${esc(item.tag)}</span>` : ''}</span>
          <span class="role-card-person">${esc(item.person)}</span>
          <span class="role-card-desc">${esc(item.desc)}</span>
        </button>`).join('');
    }
  }
  function openRoleDialog() { syncWho(); const d = $('#role-dialog'); if (!d.open) d.showModal(); }
  function closeRoleDialog() { const d = $('#role-dialog'); if (d.open) d.close(); }

  /* ---------- 弹窗 ---------- */
  function openDialog(title, body) { $('#dialog-title').textContent = title; $('#dialog-body').innerHTML = body; $('#detail-dialog').showModal(); }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, id, value } = target.dataset;
    switch (action) {
      case 'switch-role': {
        setRole(value); closeRoleDialog();
        const current = parseHash().page;
        if (!current) location.hash = '#/overview'; else render();
        break;
      }
      case 'goto': event.preventDefault(); location.hash = `#/${value}`; break;
      case 'open-payment': location.hash = `#/payment/${id || value}`; break;
      case 'mark-risk': markRisk(id); break;
      case 'decide': decide(value, id); break;
      case 'todo-done': {
        const form = target.closest('form');
        const note = form ? (form.querySelector('[name="todoNote"]')?.value || '').trim() : '';
        todoDone(id, note); break;
      }
      case 'fill-case': {
        const form = $('#payment-form'); if (!form) return;
        const cases = {
          normal: { payee: '青秀区康乐养老服务中心', account: 'MOCK-ACC-3301', amount: '6800', purpose: '护理费月付', channel: '缴费', note: '预期 L0 自动放行' },
          big: { payee: '晚晴苑护理院', account: 'MOCK-ACC-2018', amount: '86000', purpose: '预付床位及护理费', channel: '缴费', note: '预期 L2 挂起待核' },
          scam: { payee: '恒信健康管理咨询部', account: 'MOCK-ACC-7721', amount: '150000', purpose: '预付半年护理服务费（加急代缴）', channel: '转账', note: '预期 L3 冻结' },
        };
        const c = cases[value]; if (!c) return;
        form.elements.payee.value = c.payee; form.elements.payeeAccount.value = c.account;
        form.elements.amount.value = c.amount; form.elements.purpose.value = c.purpose;
        if (form.elements.channel) form.elements.channel.value = c.channel;
        form.dataset.case = value;
        document.querySelectorAll('.case-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.value === value));
        const hint = $('#case-hint'); if (hint) hint.textContent = `已填入${value === 'scam' ? '疑似诈骗' : value === 'big' ? '异常大额' : '常规月费'}：${c.note}`;
        break;
      }
      case 'submit-payment': {
        event.preventDefault();
        const form = $('#payment-form'); if (!form) return;
        const fields = {
          accountId: form.elements.accountId.value, payee: form.elements.payee.value.trim(),
          payeeAccount: form.elements.payeeAccount.value.trim(), amount: form.elements.amount.value,
          purpose: form.elements.purpose.value.trim(), channel: form.elements.channel ? form.elements.channel.value : '转账',
          case: form.dataset.case || (Number(form.elements.amount.value) >= 50000 ? 'big' : 'normal'),
        };
        if (!fields.payee || !fields.amount) { toast('请填写收款方与金额，或选择上方案例'); return; }
        const txn = submitPayment(fields);
        if (!txn) return;
        toast(txn.status === 'executed' ? `L0 正常 · 已执行 ${yuan(txn.amount)}` : txn.status === 'frozen' ? 'L3 高危 · 已冻结，等待双方确认' : 'L2 可疑 · 等待信托复核');
        location.hash = `#/payment/${txn.id}`;
        break;
      }
      case 'risk-detail': {
        const r = D.risks.find(item => item.id === id); if (!r) return;
        openDialog('提醒详情', `
          <div class="detail-head">${levelTag(r.riskLevel || 'L2', levelName[r.riskLevel || 'L2'])}<h3>${esc(r.title)}</h3><p class="muted">${esc(r.channel)} · ${esc(r.time)}${r.rules ? ` · 命中 ${r.rules.join(' / ')}` : ''}</p></div>
          <div class="notice">${icon('warning')}<span>${r.level === 'high' ? '重点核实：先停止操作，再确认信息来源。' : '建议核实：留意陌生要求，先确认信息来源。'}</span></div>
          <p class="dialog-copy">${esc(r.detail)}</p>
          <strong>建议这样做</strong><ol class="dialog-steps">${r.advice.map(item => `<li>${esc(item)}</li>`).join('')}</ol>
          <div class="dialog-actions"><button class="button subtle" data-action="close">关闭</button>${r.resolved ? '<button class="button primary" disabled>已核实</button>' : `<button class="button primary" data-action="mark-risk" data-id="${r.id}">${icon('check')}标记核实完成</button>`}</div>`);
        break;
      }
      case 'close': $('#detail-dialog').close(); break;
      case 'clear-all':
        openDialog('清除演示操作', `<p class="dialog-copy">清除本次操作、审计动态与操作留痕，恢复最新演示初始状态。</p><p class="dialog-copy">家庭成员、演示脚本及展示案例保留，后续演示操作将重新记录。</p><div class="dialog-actions"><button class="button subtle" data-action="close">取消</button><button class="button primary" data-action="confirm-clear-all">确认清除</button></div>`);
        break;
      case 'confirm-clear-all': $('#detail-dialog').close(); clearAll(); break;
      case 'demo-console-action': {
        if (value === 'expire') expireTodos();
        if (value === 'start') window.DemoTour ? window.DemoTour.start() : toast('演示模块未就绪');
        break;
      }
      case 'demo-exit': if (window.DemoTour) window.DemoTour.exit(); break;
      case 'preference': {
        if (!Object.hasOwn(preferences, value)) return;
        preferences[value] = !preferences[value];
        target.setAttribute('aria-checked', String(preferences[value]));
        applyPreferences();
        try { localStorage.setItem(STORE_WEB_PREFERENCES, JSON.stringify(preferences)); } catch { toast('设置已在本次页面生效'); }
        break;
      }
      case 'toggle-article': {
        const a = D.articles.find(item => item.id === id); if (!a) return;
        a.published = !a.published;
        auditPush(`${role().person}`, `${a.published ? '恢复展示' : '隐藏内容'}：${a.title}`, '', '—', a.published ? '已恢复' : '已隐藏', '', 'E001');
        toast(a.published ? '内容已恢复展示' : '内容已隐藏');
        render();
        break;
      }
      case 'article-preview': {
        const a = D.articles.find(item => item.id === id); if (!a) return;
        openDialog(a.title, `<span class="badge">${esc(a.category)} · ${a.minutes} 分钟</span>${a.content.map(item => `<p class="dialog-copy">${esc(item)}</p>`).join('')}<div class="dialog-actions"><button class="button primary" data-action="close">关闭预览</button></div>`);
        break;
      }
    }
  });

  $('#demo-console').addEventListener('click', () => { location.hash = '#/demo'; });
  $('#role-who').addEventListener('click', openRoleDialog);
  $('#role-dialog-close').addEventListener('click', closeRoleDialog);
  $('#role-dialog-home').addEventListener('click', () => { closeRoleDialog(); location.hash = '#/'; });
  $('#menu-button').addEventListener('click', () => window.Sidebar.setExpanded(!window.Sidebar.isExpanded()));
  $('#sidebar-backdrop').addEventListener('click', () => { window.Sidebar.setExpanded(false, false); $('#sidebar-toggle').focus(); });
  $('#dialog-close').addEventListener('click', () => $('#detail-dialog').close());
  $('#notifications').addEventListener('click', () => { location.hash = '#/risks'; });
  window.addEventListener('hashchange', () => { render(); if (matchMedia('(max-width:760px)').matches) window.Sidebar.setExpanded(false, false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && window.Sidebar.isExpanded() && matchMedia('(max-width:760px)').matches && !$('#detail-dialog').open) { window.Sidebar.setExpanded(false, false); } });

  /* ---------- 手机小窗兼容接口 ---------- */
  const mobileRecords = { elder: { read: new Set(), saved: new Set() }, family: { read: new Set(), saved: new Set() } };
  const STORE_WEB_PREFERENCES = 'pension-shield-preferences';
  const STORE_MOBILE_PREFERENCES = 'pension-shield-mobile-preferences-v1';
  let preferences = { largeText: false, highContrast: false, reduceMotion: false };
  const mobilePreferences = { elder: { largeText: false, highContrast: false, reduceMotion: false }, family: { largeText: false, highContrast: false, reduceMotion: false } };
  function readWebPreferences(raw) {
    try { const saved = JSON.parse(raw || '{}'); Object.keys(preferences).forEach(key => { preferences[key] = saved[key] === true; }); } catch { /* 保留当前设置。 */ }
  }
  function readMobilePreferences(raw) {
    try {
      const saved = JSON.parse(raw || '{}');
      Object.entries(mobilePreferences).forEach(([role, settings]) => { Object.keys(settings).forEach(key => { settings[key] = saved[role]?.[key] === true; }); });
    } catch { /* 保留当前设置。 */ }
  }
  try { readWebPreferences(localStorage.getItem(STORE_WEB_PREFERENCES)); readMobilePreferences(localStorage.getItem(STORE_MOBILE_PREFERENCES)); } catch { /* 默认设置。 */ }
  function applyPreferences() { Object.entries({ 'large-text': preferences.largeText, 'high-contrast': preferences.highContrast, 'reduce-motion': preferences.reduceMotion }).forEach(([name, enabled]) => document.body.classList.toggle(name, enabled)); }
  function mobilePreference(snapshotRole, key, value) {
    const settings = mobilePreferences[snapshotRole];
    if (!settings || !Object.hasOwn(settings, key)) return;
    settings[key] = value === undefined ? !settings[key] : value === true;
    try { localStorage.setItem(STORE_MOBILE_PREFERENCES, JSON.stringify(mobilePreferences)); } catch { toast('手机设置已在本次页面生效'); }
    window.dispatchEvent(new Event('demo-state-changed'));
  }

  window.Workbench = {
    get webPreferences() { return preferences; },
    snapshot(snapshotRole) { return { data: D, role: snapshotRole, ...mobileRecords[snapshotRole], preferences: mobilePreferences[snapshotRole], profile: window.Sidebar.profile(snapshotRole), elderProfile: window.Sidebar.profile('elder'), activity: [] }; },
    refresh: render,
    navigate(page) { location.hash = `#/${page}`; },
    resolve(snapshotRole, id) { const r = D.risks.find(item => item.id === id); if (!r || r.resolved) return; r.resolved = true; auditPush(snapshotRole === 'family' ? '家属' : '长辈', `核实风险：${r.title}`, '', r.riskLevel || 'L2', '已核实', '', 'E001'); render(); },
    read(snapshotRole, id) { if (D.articles.some(a => a.id === id && a.published)) { mobileRecords[snapshotRole].read.add(id); render(); } },
    save(snapshotRole, id) { if (!D.articles.some(a => a.id === id && a.published)) return; const set = mobileRecords[snapshotRole].saved; set.has(id) ? set.delete(id) : set.add(id); render(); },
    help(personId, riskId, message) { const person = D.family.find(p => p.id === personId); if (!person) return null; const request = { id: `q${Date.now()}-${D.requests.length}`, personId, name: person.name, riskId, message, time: nowTime(), resolved: false }; D.requests.unshift(request); auditPush('长辈', `向${person.name}发起求助`, '', '—', '求助', message || '', 'E001'); render(); return request.id; },
    resolveHelp(requestId, note) { const q = D.requests.find(item => item.id === requestId); if (!q) return; q.resolved = true; q.note = note || ''; auditPush('家属', `求助已处理${note ? `：${note}` : ''}`, '', '—', '已处理', q.message || '', 'E001'); render(); },
    preference(key, value) { if (!Object.hasOwn(preferences, key)) return; preferences[key] = value === undefined ? !preferences[key] : value === true; applyPreferences(); try { localStorage.setItem(STORE_WEB_PREFERENCES, JSON.stringify(preferences)); } catch { toast('设置已在本次页面生效'); } render(); },
    mobilePreference,
    profile(snapshotRole, value) { return window.Sidebar.saveProfile(snapshotRole, value); },
    clearAll,
    loadDemo,
    setRole,
    expireTodos,
    submitPayment,
  };
  window.RoleSession = { get key() { return roleKey; }, get role() { return role(); }, setRole, openSwitcher: openRoleDialog };

  /* ---------- 启动 ---------- */
  function boot() {
    renderNav();
    window.Icons.hydrate(document.body);
    syncWho();
    applyPreferences();
    if (!location.hash || location.hash === '#') history.replaceState(null, '', '#/');
    render();
    if (window.Sidebar) window.Sidebar.initialize?.();
  }
  if (window.Sidebar && document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', () => { if (window.Sidebar) window.Sidebar.initialize?.(); boot(); });
  window.addEventListener('sidebar-profile-changed', render);
  window.addEventListener('storage', event => {
    if (event.key === STORE_WEB_PREFERENCES) { readWebPreferences(event.newValue); applyPreferences(); render(); return; }
    if (event.key === STORE_MOBILE_PREFERENCES) { readMobilePreferences(event.newValue); window.dispatchEvent(new Event('demo-state-changed')); return; }
    if (event.key !== STORE_DATA || !applySavedState(event.newValue)) return;
    window.DemoTour?.exit();
    resetMobileState();
    render();
  });
})();
