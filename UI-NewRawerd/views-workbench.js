/* 工作台视图：角色入口首页、三个工作台（照护 / 受托 / 监督）、审计动态组件、
 * 权限矩阵、异议管理、重点监督、演示控制台。全部为纯静态渲染。 */
window.Views = window.Views || {};
(() => {
  'use strict';
  const icon = window.Icons.svg;
  const D = window.DemoData;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const yuan = n => `¥${Number(n).toLocaleString('zh-CN')}`;
  const role = () => window.RoleSession.role;
  const parse = () => { const raw = location.hash.replace(/^#\/?/, ''); const [p] = raw.split('?'); const [page = '', ...rest] = p.split('/'); return { page: page || '', param: rest.join('/') }; };
  const datePill = () => {
    const text = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
    return `<span class="date-pill">${icon('sun')}${text}</span>`;
  };
  const levelTag = (level, label) => `<span class="lvl lvl-${String(level).toLowerCase()}">${esc(level)}${label ? ` · ${esc(label)}` : ''}</span>`;
  const levelName = { L0: '正常', L1: '关注', L2: '可疑', L3: '高危' };
  const statusName = { draft: '草稿', pending: '待确认', frozen: '已冻结', released: '已放行', executed: '已执行', rejected: '已驳回' };
  const statusTag = status => `<span class="tag status-${status}">${statusName[status] || status}</span>`;
  const pageHead = (title, sub, right = '') => `<div class="page-head"><div><h1>${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div><div class="page-head-right">${right}</div></div>`;
  const kpi = (label, value, unit, sub, iconName = '') => `
    <div class="kpi">
      <div class="kpi-top"><span>${esc(label)}</span>${iconName ? `<span class="kpi-icon">${icon(iconName)}</span>` : ''}</div>
      <div class="kpi-value"><strong>${esc(value)}</strong>${unit ? `<span>${esc(unit)}</span>` : ''}</div>
      ${sub ? `<div class="kpi-sub">${esc(sub)}</div>` : ''}
    </div>`;
  /* 时间戳月份判断：兼容 '2026-10-10 19:46' 与 '10-10 19:46' 两种格式 */
  const inMonth = (value, mm = '10') => {
    const d = String(value || '').split(' ')[0].split('-');
    return d.length >= 2 && d[d.length - 2] === mm;
  };

  /* ---------- 审计动态组件（全局唯一一套，按角色裁剪） ---------- */
  function auditEntries(scope, mineOnly = false) {
    let rows = D.audit;
    if (scope === 'care') rows = rows.filter(r => r.elderId === 'E001' || r.global === true);
    if (mineOnly) rows = rows.filter(r => r.actor.includes(role().personName) || r.actor.includes(role().label));
    return rows;
  }
  function auditFeed(rows, { compact = false } = {}) {
    if (!rows.length) return `<div class="empty-box">暂无审计动态</div>`;
    return `<ul class="audit-feed">${rows.map(r => `
      <li class="audit-row">
        <div class="audit-when"><strong>${esc(r.date)}</strong><span>${esc(r.time)}</span></div>
        <div class="audit-body">
          <div class="audit-line"><span class="audit-actor">${esc(r.actor)}</span><span class="audit-text">${esc(r.text)}</span>${r.level && r.level !== '—' ? levelTag(r.level, levelName[r.level]) : ''}</div>
          ${r.detail && !compact ? `<div class="audit-detail">${esc(r.detail)}</div>` : ''}
        </div>
        <div class="audit-tail">
          ${r.txn ? (r.dataSession || 'seed') === D.dataSession && D.transactions.some(t => t.id === r.txn) ? `<button class="audit-txn" data-action="open-payment" data-id="${esc(r.txn)}">${esc(r.txn)}</button>` : `<span class="muted" title="历史演示审计记录">${esc(r.txn)}</span>` : ''}
          ${r.tag ? `<span class="tag status-${tagStatus(r.tag)}">${esc(r.tag)}</span>` : ''}
        </div>
      </li>`).join('')}</ul>`;
  }
  function tagStatus(tag) {
    return ({ '已冻结': 'frozen', '待确认': 'pending', '已执行': 'executed', '已驳回': 'rejected', '待跟进': 'open', '已终结': 'executed' })[tag] || 'pending';
  }
  function auditSummary(scope, elderId) {
    const recent = auditEntries(scope).slice(0, 5);
    const mine = auditEntries(scope, true);
    return `
      <section class="panel">
        <div class="panel-heading">
          <div class="panel-title"><h2>审计留痕</h2></div>
          <button class="text-link" data-action="goto" data-value="audit">审计报告 ${icon('chevron')}</button>
        </div>
        <div class="audit-dual">
          <div>
            <div class="sub-head"><strong>最近审计动态</strong><button class="text-link" data-action="goto" data-value="audit">查看全部 ${icon('chevron')}</button></div>
            ${auditFeed(recent, { compact: true })}
          </div>
          <div>
            <div class="sub-head"><strong>我的操作留痕</strong><button class="text-link" data-action="goto" data-value="audit">查看全部 ${icon('chevron')}</button></div>
            ${mine.length ? auditFeed(mine.slice(0, 5), { compact: true }) : '<div class="empty-box">暂无你的操作留痕</div>'}
          </div>
        </div>
      </section>`;
  }

  /* ---------- 首页：角色入口 ---------- */
  window.Views.home = () => {
    const cards = D.roles.map(item => `
      <button class="home-role-card role-${item.key}" data-action="switch-role" data-value="${item.key}">
        <span class="home-role-icon">${icon(item.key === 'trust' ? 'bank' : item.key === 'supervisor' ? 'scale' : 'user-round')}</span>
        <span class="role-card-head"><strong>${esc(item.label)}</strong>${item.tag ? `<span class="tag-gray">${esc(item.tag)}</span>` : ''}</span>
        <span class="role-card-desc">${esc(item.desc)}</span>
        <span class="role-card-entry">${esc(item.duty)}<span>进入工作台 ${icon('arrow')}</span></span>
      </button>`).join('');
    return `
      <div class="home-page">
        <div class="home-hero">
          <div class="home-intro">
            <span class="home-eyebrow">${icon('brand')}养老服务信托 · 家庭守护</span>
            <h1>养老金盾</h1>
            <p class="home-sub">守护养老资金，让每一笔支付有据可查。</p>
          </div>
          <div class="home-start">
            <button class="button primary" data-action="demo-console-action" data-value="start">${icon('play')}开始演示 ${icon('arrow')}</button>
            <span>3～5 分钟 · 三端联动</span>
          </div>
        </div>
        <div class="home-journey" aria-label="展示主线">
          <div class="journey-card"><span class="journey-number">01</span><div><h2>家庭守护</h2><p>长辈求助 → 家属核实</p></div>${icon('users')}</div>
          <div class="journey-card"><span class="journey-number">02</span><div><h2>资金风控</h2><p>风险冻结 → 双方确认</p></div>${icon('shield')}</div>
          <div class="journey-card"><span class="journey-number">03</span><div><h2>全程审计</h2><p>操作留痕 → 过程可查</p></div>${icon('doc')}</div>
        </div>
        <div class="home-section-head"><span class="home-section-title">三方协同，各司其职</span><span class="home-section-hint">选择身份进入工作台</span></div>
        <div class="home-role-grid">${cards}</div>
        <div class="home-more">
          <button class="text-link" data-action="goto" data-value="demo">演示流程与说明 ${icon('chevron')}</button>
          <button class="text-link" data-action="goto" data-value="settings">界面设置</button>
        </div>
      </div>`;
  };

  /* ---------- 工作台总入口 ---------- */
  window.Views.workbench = () => {
    if (role().key === 'trust') return trustWorkbench();
    if (role().key === 'supervisor') return supervisorWorkbench();
    return guardianWorkbench();
  };

  /* ---------- 照护工作台（意定监护人） ---------- */
  function guardianWorkbench() {
    const myTodos = D.todos.filter(t => t.status === 'pending' && t.assigneeRole === 'guardian');
    const openRisks = D.risks.filter(r => !r.resolved);
    const awaiting = D.requests.filter(q => !q.resolved);
    const completedRequests = D.requests.filter(q => q.resolved).slice(0, 2);
    const executed = D.transactions.filter(t => t.status === 'executed' && t.elderId === 'E001');
    const spent = executed.reduce((sum, t) => sum + t.amount, 0);
    const todoRows = myTodos.length ? myTodos.map(t => {
      const txn = D.transactions.find(x => x.id === t.txnId);
      return `
      <button class="todo-row" data-action="open-payment" data-id="${esc(t.txnId)}">
        <span class="todo-id">${esc(t.txnId)}</span>
        <span class="tag tag-blue">${esc(t.kind)}</span>
        <span class="todo-note">${esc(txn ? `${txn.payee} · ${yuan(txn.amount)}` : '')}</span>
        ${icon('chevron')}
      </button>`;
    }).join('') : '<div class="empty-box">暂无待办</div>';
    const requestRows = awaiting.length || completedRequests.length ? [...awaiting, ...completedRequests].map(q => `
      <div class="request-row"><span class="request-avatar">${esc([...q.name][0])}</span><div><strong>请${esc(q.name)}协助</strong><p>${esc(q.resolved ? q.note || '家属已完成处理' : q.message || '提交了求助')}</p></div><span class="tag ${q.resolved ? 'tag-green' : 'tag-amber'}">${q.resolved ? '已完成' : '待协助'}</span></div>`).join('')
      : '<div class="empty-box">暂无待处理求助</div>';
    return `
      ${pageHead('照护工作台', '关注长辈风险，及时处理求助与支付', `<button class="button primary" data-action="goto" data-value="payment-new">${icon('coin')}发起请款</button>`)}
      <div class="kpi-grid">${[
        kpi('待确认支付', String(myTodos.length).padStart(2, '0'), '项', '', 'check'),
        kpi('待核实风险', String(openRisks.length).padStart(2, '0'), '条', '', 'bell'),
        kpi('待处理求助', String(awaiting.length).padStart(2, '0'), '件', '', 'heart'),
        kpi('累计支出', yuan(spent), '', '', 'coin'),
      ].join('')}</div>
      <div class="workbench-grid">
        <section class="panel">
          <div class="panel-heading"><div class="panel-title"><h2>待办确认</h2></div><button class="text-link" data-action="goto" data-value="todos">全部待办 ${icon('chevron')}</button></div>
          ${todoRows}
        </section>
        <section class="panel">
          <div class="panel-heading"><div class="panel-title"><h2>家庭求助</h2></div><span class="muted">${awaiting.length ? `${awaiting.length} 件待协助` : completedRequests.length ? '最近处理结果' : ''}</span></div>
          ${requestRows}
        </section>
      </div>
      ${auditSummary('care')}`;
  }

  /* ---------- 受托管理总览（信托公司管理员） ---------- */
  function trustWorkbench() {
    const totalBalance = D.accounts.reduce((sum, a) => sum + a.balance, 0);
    const monthSpent = D.transactions.filter(t => t.status === 'executed' && inMonth(t.executedAt)).reduce((sum, t) => sum + t.amount, 0);
    const frozen = D.transactions.filter(t => t.status === 'frozen');
    const myTodos = D.todos.filter(t => t.status === 'pending' && t.assigneeRole === 'trust');
    const openRisks = D.risks.filter(r => !r.resolved);
    const openObj = D.objections.filter(o => o.status === 'open');
    const bigPending = D.transactions.filter(t => t.status !== 'executed' && t.status !== 'rejected' && t.amount >= 50000);
    const scamCount = D.transactions.filter(t => t.hits?.some(h => h.code === 'R11')).length;
    const frequent = D.transactions.filter(t => t.hits?.some(h => h.code === 'R08'));
    const quick = [['accounts', '账户管理', 'bank'], ['todos', '审批中心', 'clipboard'], ['risks', '风险处置', 'bell-alert'], ['rules', '规则管理', 'scale'], ['audit', '审计报告', 'doc'], ['scam', '反诈风险检测', 'eye']];
    return `
      ${pageHead('受托管理总览', '管理受托资金，复核支付风险', `<button class="button primary" data-action="goto" data-value="todos">${icon('clipboard')}处理审批</button>`)}
      <div class="kpi-grid">${[
        kpi('管理账户', String(D.accounts.length), '户', '', 'bank'),
        kpi('受托资产', yuan(totalBalance), '', '', 'wallet'),
        kpi('当月支出', yuan(monthSpent), '', '', 'coin'),
        kpi('冻结支付', String(frozen.length), '笔', '', 'lock'),
      ].join('')}</div>
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>审批与处置</h2></div></div>
        <div class="dispatch-grid">
          <button class="dispatch-card" data-action="goto" data-value="todos"><strong>${myTodos.length} 项</strong><span>待审批</span>${icon('chevron')}</button>
          <button class="dispatch-card" data-action="goto" data-value="risks"><strong>${openRisks.length} 条</strong><span>待核实风险</span>${icon('chevron')}</button>
          <button class="dispatch-card" data-action="goto" data-value="audit"><strong>${openObj.length} 条</strong><span>待跟进异议</span>${icon('chevron')}</button>
          <button class="dispatch-card" data-action="goto" data-value="rules"><strong>${D.rules.filter(r => r.enabled).length} 条</strong><span>启用规则</span>${icon('chevron')}</button>
        </div>
      </section>
      <div class="workbench-grid">
        <section class="panel">
          <div class="panel-heading"><div class="panel-title"><h2>风险监控</h2></div><button class="text-link" data-action="goto" data-value="risks">风险处置 ${icon('chevron')}</button></div>
          <div class="monitor-list">
            <div class="monitor-row"><strong>大额待处理支付</strong><span class="monitor-num">${bigPending.length}</span><p>单笔金额 ≥ ¥50,000</p></div>
            <div class="monitor-row"><strong>高频交易</strong><span class="monitor-num">${frequent.length}</span><p>${frequent.length ? '命中短时高频申请规则，需复核' : '暂无高频交易'}</p></div>
            <div class="monitor-row"><strong>疑似诈骗风险</strong><span class="monitor-num">${scamCount}</span><p>${scamCount ? '命中话术特征的申请，需复核' : '暂无话术检测产生的待处置事件'}</p></div>
          </div>
        </section>
        ${auditSummary('fund')}
      </div>
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>快捷入口</h2></div></div>
        <div class="quick-grid">${quick.map(([to, label, iconName]) => `
          <button class="quick-tile" data-action="goto" data-value="${to}"><span class="q-icon">${icon(iconName)}</span><span>${esc(label)}</span></button>`).join('')}
        </div>
      </section>`;
  }

  /* ---------- 监督工作台（监察人 · 四标签页） ---------- */
  function supervisorWorkbench() {
    const tab = parse().param || 'summary';
    const tabs = [['summary', '监督概览'], ['audit', '审计报告'], ['objections', '异议管理'], ['focus', '重点监督']];
    const tabBar = `<div class="tabs sup-tabs" role="tablist">${tabs.map(([key, label]) =>
      `<button class="tab ${tab === key ? 'active' : ''}" data-action="goto" data-value="overview/${key}" role="tab" aria-selected="${tab === key}">${label}${key === 'objections' && D.objections.filter(o => o.status === 'open').length ? `<span class="tab-dot"></span>` : ''}</button>`).join('')}</div>`;
    return `
      ${pageHead('监督工作台', '独立核查交易、风险与操作记录', `<span class="tag tag-gray">${icon('lock')}只读监督</span>`)}
      <div class="notice readonly"><span class="notice-icon">${icon('scale')}</span><span>可查账、提异议；支付由监护人与信托公司确认。</span></div>
      ${tabBar}
      ${tab === 'audit' ? auditPanel() : tab === 'objections' ? objectionPanel() : tab === 'focus' ? focusPanel() : supervisorSummary()}`;
  }
  function supervisorSummary() {
    const openRisks = D.risks.filter(r => !r.resolved);
    const openObj = D.objections.filter(o => o.status === 'open');
    const monthTxns = D.transactions.filter(t => inMonth(t.createdAt));
    return `
      <div class="kpi-grid">${[
        kpi('监督账户', String(D.accounts.length), '户', '', 'bank'),
        kpi('本月交易', String(monthTxns.length), '笔', '', 'list'),
        kpi('待处理风险', String(openRisks.length + D.transactions.filter(t => t.status === 'frozen').length), '条', '', 'bell-alert'),
        kpi('待跟进异议', String(openObj.length), '条', '', 'scale'),
      ].join('')}</div>
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>三方权限</h2></div><span class="muted">照护 · 受托 · 监督</span></div>
        <div class="table-scroll"><table class="matrix-table">
          <thead><tr><th>动作 \ 角色</th><th>意定监护人</th><th>信托管理员</th><th>监察人</th></tr></thead>
          <tbody>${D.matrix.rows.map(row => `
            <tr>
              <td class="matrix-action"><strong>${esc(row.action)}</strong><details class="matrix-detail"><summary>说明</summary><small>${esc(row.sub)}</small></details></td>
              ${['guardian', 'trust', 'supervisor'].map(k => {
                const state = row.states[k];
                const cls = state === 'yes' ? 'yes' : state === 'no' ? 'no' : 'scope';
                const text = state === 'yes' ? '✓ 可以' : state === 'no' ? '✕ 不可' : '◐ 按范围';
                return `<td class="matrix-cell ${cls}">${text}</td>`;
              }).join('')}
            </tr>`).join('')}</tbody>
        </table></div>
        <details class="disclosure"><summary>查看监督权限说明</summary><div class="matrix-notes">
          <div class="matrix-note ok"><strong>${icon('check')}可以做什么</strong><ul>${D.matrix.canText.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="matrix-note deny"><strong>${icon('close')}不可以做什么</strong><ul>${D.matrix.cannotText.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
        </div></details>
      </section>`;
  }
  function auditPanel() {
    const rows = auditEntries('all');
    return `
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>全量审计</h2></div><span class="muted">${rows.length} 条记录</span></div>
        ${auditFeed(rows)}
        <p class="panel-footnote">在支付详情中提出异议，全程留痕。</p>
      </section>`;
  }
  function objectionPanel() {
    const open = D.objections.filter(o => o.status === 'open');
    const closed = D.objections.filter(o => o.status === 'closed');
    const card = o => `
      <article class="objection-card ${o.status}">
        <div class="objection-head">
          <span class="tag ${o.status === 'open' ? 'tag-amber' : 'tag-green'}">${o.status === 'open' ? '待跟进' : '已终结'}</span>
          <button class="text-link" data-action="open-payment" data-id="${esc(o.txnId)}">${esc(o.txnId)} ${icon('chevron')}</button>
          <time>${esc(o.createdAt)}</time>
        </div>
        <p class="objection-reason">${esc(o.reason)}</p>
        <div class="objection-meta">提出人：${esc(o.by)} · 已分派：${esc(o.dispatchedTo)}</div>
        ${o.status === 'closed' ? `<div class="objection-close">${icon('check')}终结说明：${esc(o.closeNote)}（${esc(o.closedAt)}）</div>` : ''}
      </article>`;
    return `
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>异议管理</h2></div><span class="muted">异议只留痕、不改变支付状态</span></div>
        <div class="sub-head"><strong>待跟进（${open.length}）</strong></div>
        ${open.length ? open.map(card).join('') : '<div class="empty-box">暂无待跟进异议。可在支付申请详情页提出异议。</div>'}
        <div class="sub-head"><strong>已终结（${closed.length}）</strong></div>
        ${closed.length ? closed.map(card).join('') : '<div class="empty-box">暂无已终结异议</div>'}
      </section>`;
  }
  function focusPanel() {
    const frozen = D.transactions.filter(t => t.status === 'frozen');
    const openObj = D.objections.filter(o => o.status === 'open');
    const l3 = D.transactions.filter(t => t.level === 'L3');
    const hitCounts = new Map();
    D.transactions.forEach(t => (t.hits || []).forEach(h => {
      const current = hitCounts.get(h.code) || { code: h.code, name: h.name, count: 0 };
      current.count += 1;
      hitCounts.set(h.code, current);
    }));
    const topHits = [...hitCounts.values()].sort((a, b) => b.count - a.count).slice(0, 4);
    return `
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>重点监督</h2></div><span class="muted">按风险与状态自动聚焦</span></div>
        <div class="focus-grid">
          <div class="focus-card"><span class="focus-icon">${icon('lock')}</span><strong>冻结中申请 ${frozen.length} 笔</strong><p>${frozen.length ? frozen.map(t => t.id).join('、') : '当前没有冻结中的申请'}</p></div>
          <div class="focus-card"><span class="focus-icon">${icon('scale')}</span><strong>待跟进异议 ${openObj.length} 条</strong><p>${openObj.length ? '等待信托 / 监护人补充说明后终结' : '暂无待跟进异议'}</p></div>
          <div class="focus-card"><span class="focus-icon">${icon('warning')}</span><strong>L3 高危申请 ${l3.length} 笔</strong><p>双确认 + 全程留痕，可在审计报告回放</p></div>
          <div class="focus-card"><span class="focus-icon">${icon('doc')}</span><strong>规则命中 Top</strong><p>${topHits.length ? topHits.map(h => `${esc(h.code)} ${esc(h.name)}`).join(' · ') : '暂无规则命中记录'}</p></div>
        </div>
      </section>`;
  }

  /* ---------- 审计报告页（全局审计，按角色裁剪） ---------- */
  window.Views.audit = () => {
    const scope = role().key === 'guardian' ? 'care' : 'all';
    const mine = parse().param === 'mine';
    const rows = auditEntries(scope, mine);
    const scopeText = role().key === 'supervisor' ? '全部账户的交易与操作记录'
      : role().key === 'trust' ? '受托资金的支付与审批记录'
        : '照护范围内的支付、风险与操作记录';
    return `
      ${pageHead('审计报告', scopeText, `
        <div class="tabs">
          <button class="tab ${!mine ? 'active' : ''}" data-action="goto" data-value="audit">全部动态</button>
          <button class="tab ${mine ? 'active' : ''}" data-action="goto" data-value="audit/mine">我的操作留痕</button>
        </div>`)}
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>${mine ? '我的操作留痕' : '审计动态'}</h2></div><span class="muted">${rows.length} 条记录 · 只读留痕</span></div>
        ${auditFeed(rows)}
      </section>`;
  };

  /* ---------- 演示控制台 ---------- */
  window.Views.demoConsole = () => `
    ${pageHead('演示流程', '家庭守护 → 支付风控 → 审计追溯', `
      <button class="button primary" data-action="demo-console-action" data-value="start">${icon('play')}开始演示</button>`)}
    <div class="demo-plan-grid">${[
      { title: '家庭协同', time: '约 1 分 30 秒', start: 0, end: 5, icon: 'users' },
      { title: '资金风控', time: '约 2 分钟', start: 5, end: 8, icon: 'shield' },
      { title: '审计追溯', time: '约 30 秒', start: 8, end: 9, icon: 'doc' },
    ].map((phase, index) => `<section class="panel demo-plan"><div class="demo-plan-heading"><span class="journey-number">0${index + 1}</span>${icon(phase.icon)}<h2>${phase.title}</h2></div><p class="demo-plan-time">${phase.time}</p><ol class="demo-step-list" start="${phase.start + 1}">${D.demoSteps.slice(phase.start, phase.end).map(step => `<li><strong>${esc(step.title)}</strong><span>${esc(step.text)}</span></li>`).join('')}</ol></section>`).join('')}</div>
    <details class="panel disclosure demo-options"><summary>演示工具</summary>
      <div class="demo-op-row">
        <div><strong>待办超时</strong><p>查看超时后 L2 / L3 支付自动冻结的效果。</p></div>
        <button class="button subtle" data-action="demo-console-action" data-value="expire">${icon('timer')}触发超时</button>
      </div>
      <div class="demo-op-row">
        <div><strong>清除演示操作</strong><p>清除本次操作、审计动态与操作留痕，恢复演示初始状态。家庭成员、演示脚本及展示案例保留。</p></div>
        <button class="button subtle" data-action="clear-all">${icon('close')}清除演示操作</button>
      </div>
    </details>
    <details class="panel disclosure"><summary>关于本次演示</summary>
      <ul class="boundary-list">${D.boundary.map(item => `<li>${icon('check')}<span>${esc(item)}</span></li>`).join('')}</ul>
    </details>`;

  /* 供其它视图复用 */
  window.Views._audit = { auditFeed, auditEntries, levelTag, levelName, statusName, statusTag, kpi, pageHead, datePill, esc, yuan };
})();
