/* 支付链路与次级页面：发起支付申请、支付详情（L3 主线）、待办、风险、反诈检测、规则、交易、账户、家庭成员、内容、设置。 */
(() => {
  'use strict';
  const A = window.Views._audit;
  const { icon, esc, yuan, levelTag, levelName, statusName, statusTag, kpi, pageHead, datePill, auditFeed, auditEntries } = {
    icon: window.Icons.svg, ...A,
  };
  const D = window.DemoData;
  const role = () => window.RoleSession.role;
  const parse = () => { const raw = location.hash.replace(/^#\/?/, ''); const [p] = raw.split('?'); const [page = '', ...rest] = p.split('/'); return { page: page || '', param: rest.join('/') }; };
  const txnById = id => D.transactions.find(t => t.id === id);
  const escape = esc;

  /* ---------- 发起支付申请 ---------- */
  window.Views.paymentNew = () => {
    if (role().key !== 'guardian') {
      return `<div class="page-pad">${pageHead('发起支付申请', '由意定监护人发起', `<button class="button subtle" data-action="goto" data-value="overview">${icon('arrow-left')}返回工作台</button>`)}
      <section class="panel"><div class="empty-box">${icon('lock')}<p>${escape(role().label)}无发起权限。<br>切换为「意定监护人」后可提交申请。</p></div></section></div>`;
    }
    if (!D.accounts.length) {
      return `${pageHead('发起支付申请', '暂无可用付款账户', `<button class="button subtle" data-action="goto" data-value="overview">${icon('arrow-left')}返回工作台</button>`)}
      <section class="panel"><div class="empty-box">暂无账户，暂不能发起支付申请。</div></section>`;
    }
    const accounts = D.accounts.map(a => `<option value="${a.id}">${a.id} · ${a.elderName} · 余额 ${yuan(a.balance)}</option>`).join('');
    return `
      ${pageHead('发起支付申请', `${role().personName} · 提交后自动判定风险`, `<button class="button subtle" data-action="goto" data-value="overview">${icon('arrow-left')}返回工作台</button>`)}
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>选择支付场景</h2></div><span class="muted">点击填入</span></div>
        <div class="case-grid">
          <button class="case-chip" type="button" data-action="fill-case" data-value="normal"><strong>常规月费</strong><span>L0 · 自动放行</span></button>
          <button class="case-chip" type="button" data-action="fill-case" data-value="big"><strong>异常大额</strong><span>L2 · 挂起复核</span></button>
          <button class="case-chip" type="button" data-action="fill-case" data-value="scam"><strong>疑似诈骗</strong><span>L3 · 冻结与双确认</span></button>
        </div>
        <p class="case-hint muted" id="case-hint">选择场景或手动填写。</p>
      </section>
      <div class="pay-new-grid">
        <section class="panel">
          <div class="panel-heading"><div class="panel-title"><h2>申请信息</h2></div></div>
          <form id="payment-form" autocomplete="off">
            <label class="form-field">付款账户<select name="accountId">${accounts}</select></label>
            <label class="form-field">申请人角色<input value="${escape(role().label)}" readonly></label>
            <label class="form-field">收款方名称<input name="payee" placeholder="如：晚晴苑护理院" maxlength="40"></label>
            <label class="form-field">收款账户<input name="payeeAccount" placeholder="MOCK-ACC-xxxx" maxlength="24"></label>
            <label class="form-field">申请金额（元）<input name="amount" type="number" min="0" step="100" placeholder="0"></label>
            <label class="form-field">用途<input name="purpose" placeholder="如：预付半年床位及护理费" maxlength="40"></label>
            <label class="form-field">渠道<select name="channel"><option>转账</option><option>缴费</option><option>代扣</option></select></label>
            <div class="dialog-actions left"><button class="button primary" type="button" data-action="submit-payment">提交申请</button></div>
          </form>
        </section>
        <section class="panel">
          <div class="panel-heading"><div class="panel-title"><h2>风险分级</h2></div><span class="muted">提交后自动判定</span></div>
          <div class="precheck-list">
            <div class="precheck-row"><span>L0 · 正常</span><span class="tag tag-green">自动放行</span></div>
            <div class="precheck-row"><span>L2 · 可疑</span><span class="tag tag-amber">挂起复核</span></div>
            <div class="precheck-row"><span>L3 · 高危</span><span class="tag tag-red">冻结与双确认</span></div>
          </div>
          <p class="panel-footnote">判定依据与处理过程全程留痕。</p>
        </section>
      </div>`;
  };

  /* ---------- 支付申请详情 ---------- */
  window.Views.paymentDetail = id => {
    const txn = id ? txnById(id) : D.transactions[0];
    if (!txn) return `${pageHead('支付申请详情', '', `<button class="button subtle" data-action="goto" data-value="overview">${icon('arrow-left')}返回工作台</button>`)}<section class="panel"><div class="empty-box">${D.transactions.length ? '未找到这笔支付申请' : '暂无支付申请；已有审计记录仍可查看。'}</div></section>`;
    const account = D.accounts.find(a => a.id === txn.accountId);
    const hardHits = txn.hits.filter(h => h.kind === '硬');
    const softHits = txn.hits.filter(h => h.kind === '软');
    const passRules = D.rules.filter(r => !txn.hits.some(h => h.code === r.code)).slice(0, 9);
    const isSupervisor = role().key === 'supervisor';
    const canGuardian = role().key === 'guardian';
    const canTrust = role().key === 'trust';
    const verdictText = txn.status === 'executed' ? '支付完成 · 已出账'
      : txn.status === 'rejected' ? '申请已驳回 · 未出账'
        : txn.level === 'L3' ? '高风险支付已冻结'
          : txn.level === 'L2' ? '异常支付待复核'
            : '正常支付 · 自动放行';
    const guardianDone = txn.guardianConfirmed || txn.status === 'executed';
    const trustDone = txn.trustReleased || txn.status === 'executed';
    const stopped = txn.status === 'rejected';
    const confirmationStep = (name, done, waiting, iconName) => `
      <div class="confirmation-step ${stopped && !done ? 'stopped' : done ? 'done' : 'pending'}">
        ${icon(iconName)}<div><strong class="confirmation-label">${name}</strong><span class="confirmation-status">${stopped && !done ? '流程已终止' : done ? '已完成' : waiting}</span></div>
      </div>`;
    const confirmation = txn.level === 'L3' || txn.level === 'L1'
      ? confirmationStep('意定监护人确认', guardianDone, '待确认照护用途', 'user-round') + confirmationStep('信托公司复核', trustDone, guardianDone ? '待复核放行' : '等待监护人确认', 'bank')
      : txn.level === 'L2'
        ? confirmationStep('信托公司复核', trustDone, '待复核放行', 'bank')
        : confirmationStep('自动审核', txn.status === 'executed', '等待系统处理', 'check');
    const riskBasis = hardHits.length
      ? `${hardHits.length} 条硬规则：${hardHits.map(h => h.name).join('、')}`
      : softHits.length ? `风险提示：${softHits.map(h => h.name).join('、')}` : '未命中风险规则';
    /* 决策条：按角色给出可用动作（监察人没有任何审批动作，只能提异议） */
    let decideBar = '';
    if (isSupervisor) {
      decideBar = `
        <div class="decide-bar readonly">
          <div class="decide-copy">${icon('scale')}<span><strong>监察人监督</strong> · 异议留痕，不改变支付状态</span></div>
          <button class="button subtle" data-action="decide" data-value="object" data-id="${txn.id}">${icon('scale')}提出异议</button>
        </div>`;
    } else if (canGuardian) {
      const confirmed = txn.guardianConfirmed || txn.status === 'executed';
      decideBar = `
        <div class="decide-bar">
          <div class="decide-copy">${icon('user-round')}<span>意定监护人 · 确认照护用途${txn.level === 'L3' ? '，再由信托公司复核' : ''}</span></div>
          <div class="decide-actions">
            <button class="button subtle" data-action="decide" data-value="reject" data-id="${txn.id}" ${txn.status === 'executed' || txn.status === 'rejected' ? 'disabled' : ''}>${icon('x-circle')}驳回</button>
            <button class="button subtle" data-action="decide" data-value="freeze" data-id="${txn.id}" ${txn.status !== 'pending' ? 'disabled' : ''}>${icon('lock')}冻结</button>
            <button class="button primary" data-action="decide" data-value="confirm" data-id="${txn.id}" ${confirmed || txn.status === 'executed' || txn.status === 'rejected' ? 'disabled' : ''}>${icon('check')}${confirmed ? '已完成确认' : '确认支付'}</button>
          </div>
        </div>`;
    } else if (canTrust) {
      const needGuardian = txn.level === 'L3' && !txn.guardianConfirmed && txn.status !== 'executed';
      decideBar = `
        <div class="decide-bar">
          <div class="decide-copy">${icon('bank')}<span>信托公司 · ${needGuardian ? '等待监护人确认后复核放行' : '复核用途与资金安全'}</span></div>
          <div class="decide-actions">
            <button class="button subtle" data-action="decide" data-value="reject" data-id="${txn.id}" ${txn.status === 'executed' || txn.status === 'rejected' ? 'disabled' : ''}>${icon('x-circle')}驳回</button>
            <button class="button subtle" data-action="decide" data-value="freeze" data-id="${txn.id}" ${txn.status !== 'pending' ? 'disabled' : ''}>${icon('lock')}冻结</button>
            <button class="button primary" data-action="decide" data-value="release" data-id="${txn.id}" ${needGuardian || txn.status === 'executed' || txn.status === 'rejected' ? 'disabled' : ''}>${icon('lock-open')}${txn.status === 'frozen' ? '解冻并放行' : '复核放行'}</button>
          </div>
        </div>`;
    }
    /* 状态流：七节点 */
    const nodes = ['待审核', '待确认', '已冻结', '待解冻', '已放行', '已执行'];
    const activeIdx = txn.status === 'pending' ? 1 : txn.status === 'frozen' ? 2 : txn.status === 'executed' ? 5 : txn.status === 'rejected' ? -1 : 1;
    const why = txn.status === 'rejected' ? '申请终止，未出账。'
      : txn.status === 'executed' ? '资金流水与审计记录已生成。'
        : txn.status === 'frozen' ? `${txn.guardianConfirmed ? '监护人已确认，等待信托复核放行。' : '资金已冻结，确认完成后才能继续支付。'}`
          : '等待复核后继续支付。';
    const flow = `<div class="status-flow">${nodes.map((name, i) => `<span class="flow-node ${i < activeIdx ? 'done' : i === activeIdx ? 'active' : ''}">${name}</span>`).join('<span class="flow-arrow"></span>')}${txn.status === 'rejected' ? '<span class="flow-arrow"></span><span class="flow-node reject">已驳回</span>' : ''}</div>`;
    return `
      ${pageHead('支付申请详情', `${txn.elderName} · ${txn.id}`, `
        <div class="page-head-actions">
          <button class="button subtle" data-action="goto" data-value="audit">${icon('doc')}查看审计报告</button>
          <button class="button subtle" data-action="goto" data-value="overview">${icon('arrow-left')}返回工作台</button>
        </div>`)}
      <div class="verdict-bar pay-overview lv-${txn.level.toLowerCase()}">
        <div class="verdict-left">${levelTag(txn.level, levelName[txn.level])}<strong>${escape(verdictText)}</strong>
          <span class="verdict-sub">${escape(riskBasis)}</span>
        </div>
        <div class="verdict-right"><span class="verdict-amount payment-amount">${yuan(txn.amount)}</span><span>${escape(txn.payee)}</span></div>
      </div>
      <div class="confirmation-track" aria-label="${txn.level === 'L3' ? '双确认进度' : '审核进度'}">${confirmation}</div>
      ${decideBar}
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>支付用途</h2></div><span class="muted">${statusName[txn.status]}</span></div>
        <div class="info-grid">
          <div><span>用途</span><strong>${escape(txn.purpose)}</strong></div>
          <div><span>申请人</span><strong>${escape(txn.source)}</strong></div>
          <div><span>发起时间</span><strong>${escape(txn.createdAt)}</strong></div>
        </div>
        <details class="disclosure">
          <summary>账户信息与支付进度</summary>
          <div class="info-grid">
            <div><span>付款账户</span><strong>${escape(txn.accountId)}</strong></div>
            <div><span>账户余额</span><strong>${yuan(account ? account.balance : 0)}</strong></div>
            <div><span>收款账户</span><strong>${escape(txn.payeeAccount)}</strong></div>
            <div><span>渠道</span><strong>${escape(txn.channel)}</strong></div>
            <div><span>历史月均支出</span><strong>${yuan(account ? account.monthAvg : 0)}</strong></div>
          </div>
          ${flow}<p class="flow-why">${escape(why)}</p>
        </details>
      </section>
      <div class="pay-detail-grid">
        <details class="panel disclosure">
          <summary>规则依据 <span class="muted">${hardHits.length} 条硬规则 · ${softHits.length} 条提示</span></summary>
          ${txn.hits.length ? txn.hits.map(h => `
            <article class="rule-hit ${h.kind === '硬' ? 'hard' : 'soft'}">
              <div class="rule-hit-head"><span class="rule-mark">${h.kind === '硬' ? '✕' : '!'}</span><strong>${escape(h.code)} ${escape(h.name)}</strong><span class="tag ${h.kind === '硬' ? 'tag-red' : 'tag-amber'}">${h.kind}规则</span><span class="rule-weight">权重 ${h.weight}</span></div>
              <p>${escape(h.note)}</p>
            </article>`).join('') : '<div class="empty-box">未命中规则（自动放行）</div>'}
          <div class="rule-pass-list">
            ${passRules.map(r => `<div class="rule-pass-row"><span class="rule-pass-mark">✓</span><strong>${escape(r.code)} ${escape(r.name)}</strong><span class="muted">${escape(r.threshold)}</span><span class="tag-gray">通过</span></div>`).join('')}
          </div>
        </details>
        <details class="panel disclosure">
          <summary>AI 辅助提示 <span class="muted">预置结果 · 仅供参考</span></summary>
          <div class="model-score"><strong>${txn.hits.some(h => h.code === 'R11') ? '0.85' : '0.15'}</strong><span>话术特征评分（0–1）</span></div>
          <div class="model-note">${icon('warning')}<span>规则优先。AI 提示不能降低风险等级，也不能批准支付。</span></div>
        </details>
      </div>
      <details class="panel disclosure">
        <summary>审计轨迹 <span class="muted">${txn.trail.length} 条记录 · 全程可追溯</span></summary>
        <ul class="trail-list">${txn.trail.map(item => `
          <li><time>${escape(item.time)}</time><strong>${escape(item.actor)}</strong><span>${escape(item.action)}</span><em>${escape(item.from)} → ${escape(item.to)}</em></li>`).join('')}</ul>
      </details>`;
  };

  /* ---------- 待办（支付确认 / 审批中心） ---------- */
  window.Views.todos = () => {
    const label = role().key === 'guardian' ? '支付确认' : role().key === 'trust' ? '审批中心' : '待办审批';
    const mine = D.todos.filter(t => t.assigneeRole === role().key);
    const pending = mine.filter(t => t.status === 'pending');
    const done = mine.filter(t => t.status !== 'pending');
    const row = t => {
      const txn = txnById(t.txnId);
      const isSupplement = t.kind === '补充说明';
      return `
      <article class="todo-card ${isSupplement ? 'supplement' : ''}">
        <div class="todo-card-head">
          <span class="tag ${isSupplement ? 'tag-amber' : 'tag-blue'}">${escape(t.kind)}</span>
          <button class="text-link" data-action="open-payment" data-id="${escape(t.txnId)}">${escape(t.txnId)} ${icon('chevron')}</button>
          <time>${escape(t.createdAt)}</time>
          ${t.status === 'done' ? `<span class="tag tag-green">已完成</span>` : ''}
        </div>
        <p class="todo-card-body">${txn ? `老人「${escape(txn.elderName)}」· 收款方 ${escape(txn.payee)} · ${yuan(txn.amount)} · 等级 ${escape(txn.level)}` : '关联申请已移除'}</p>
        ${t.status === 'done' ? `<div class="todo-done-note">${icon('check')}${escape(t.note || '已处理')}</div>` : isSupplement && role().key === 'trust' ? `
          <form class="todo-form" data-todo="${escape(t.id)}">
            <textarea name="todoNote" placeholder="填写核实情况与补充说明" maxlength="120"></textarea>
            <button class="button primary" type="button" data-action="todo-done" data-id="${escape(t.id)}">提交说明</button>
          </form>` : `
          <div class="todo-actions"><button class="button subtle" data-action="open-payment" data-id="${escape(t.txnId)}">去处理 ${icon('arrow')}</button></div>`}
      </article>`;
    };
    return `
      ${pageHead(label, '当前角色待办 · 处理结果自动留痕', `<span class="muted">${pending.length} 项待处理</span>`)}
      <section class="panel">
        <div class="panel-heading"><div class="panel-title"><h2>待处理</h2></div></div>
        ${pending.length ? pending.map(row).join('') : '<div class="empty-box">暂无待办</div>'}
      </section>
      ${done.length ? `<section class="panel"><div class="panel-heading"><div class="panel-title"><h2>已处理</h2></div></div>${done.map(row).join('')}</section>` : ''}`;
  };

  /* ---------- 风险事件（提醒 / 处置 / 核查） ---------- */
  window.Views.risks = () => {
    const label = role().key === 'guardian' ? '风险提醒' : role().key === 'trust' ? '风险处置' : '风险核查';
    const sub = role().key === 'supervisor' ? '处置过程可查 · 只读监督' : '长辈求助与风险提醒 · 处理结果三端同步';
    return `
      ${pageHead(label, sub, `<span class="muted">待处置 ${D.risks.filter(r => !r.resolved).length} 条 / 共 ${D.risks.length} 条</span>`)}
      <section class="panel">
        ${D.risks.length ? D.risks.map(r => `
          <article class="risk-row ${r.level === 'high' ? 'high' : 'medium'}" data-action="risk-detail" data-id="${r.id}" role="button" tabindex="0">
            <div class="risk-symbol ${r.level}">${icon(r.icon)}</div>
            <div class="risk-info">
              <div class="risk-title"><h3>${escape(r.title)}</h3>${levelTag(r.riskLevel || 'L2', levelName[r.riskLevel || 'L2'])}${r.resolved ? '<span class="tag tag-green">已核实</span>' : ''}</div>
              <p>${escape(r.summary)}</p>
              <span class="risk-time">${escape(r.channel)} · ${escape(r.time)}${r.rules ? ` · 命中 ${r.rules.join(' / ')}` : ''}</span>
            </div>
            <span class="risk-detail">${icon('chevron')}</span>
          </article>`).join('') : '<div class="empty-box">暂无风险事件</div>'}
      </section>`;
  };

  /* ---------- 反诈风险检测（写死演示结果） ---------- */
  window.Views.scam = () => {
    const s = D.scamSample;
    if (!s || !D.accounts.length && !D.transactions.length && !D.risks.length) {
      return `${pageHead('反诈风险检测', '识别可疑话术，辅助人工核实')}<section class="panel"><div class="empty-box">暂无待检测消息或检测结果</div></section>`;
    }
    return `
      ${pageHead('反诈风险检测', '识别可疑话术，辅助人工核实', `<span class="tag tag-amber">预置结果 · 仅供参考</span>`)}
      <div class="scam-grid">
        <section class="panel">
          <div class="panel-heading"><div class="panel-title"><h2>可疑消息</h2></div></div>
          <blockquote class="scam-text">${escape(s.text)}</blockquote>
          <button class="button subtle" data-action="demo-console-action" data-value="start" hidden></button>
        </section>
        <section class="panel">
          <div class="panel-heading"><div class="panel-title"><h2>判定结果</h2></div><span class="tag tag-red">${escape(s.label)}</span></div>
          <div class="model-score big"><strong>${s.score.toFixed(2)}</strong><span>话术特征评分（0–1）</span></div>
          <ul class="feature-list">${s.features.map(f => `<li class="${f.hit ? 'hit' : ''}">${f.hit ? icon('check') : icon('close')}<strong>${escape(f.name)}</strong><span>${escape(f.note)}</span></li>`).join('')}</ul>
          <div class="model-note">${icon('warning')}<span>规则优先。AI 提示不能降低风险等级，也不能批准支付。</span></div>
        </section>
      </div>`;
  };

  /* ---------- 规则管理（只读） ---------- */
  window.Views.rules = () => `
    ${pageHead('规则管理', '规则与判定阈值 · 只读', `<span class="muted">启用 ${D.rules.filter(r => r.enabled).length} / ${D.rules.length} 条</span>`)}
    <section class="panel table-scroll">
      <table class="admin-table rule-table">
        <thead><tr><th>规则</th><th>类型</th><th>权重</th><th>阈值</th><th>说明</th><th>版本</th><th>状态</th></tr></thead>
        <tbody>${D.rules.map(r => `
          <tr><td><strong>${escape(r.code)}</strong> ${escape(r.name)}</td>
          <td><span class="tag ${r.kind === '硬' ? 'tag-red' : 'tag-amber'}">${escape(r.kind)}规则</span></td>
          <td>${r.weight}</td><td>${escape(r.threshold)}</td><td><details class="disclosure"><summary>查看依据</summary><p class="muted">${escape(r.desc)}</p></details></td>
          <td class="muted">${escape(r.version)} · ${escape(r.updated)}</td>
          <td><span class="tag tag-green">${r.enabled ? '启用' : '停用'}</span></td></tr>`).join('')}</tbody>
      </table>
    </section>`;

  /* ---------- 交易记录（监察人） ---------- */
  window.Views.transactions = () => `
    ${pageHead('交易记录', '查看支付状态与详情', `<span class="muted">共 ${D.transactions.length} 笔</span>`)}
    <section class="panel table-scroll">
      <table class="admin-table">
        <thead><tr><th>交易号</th><th>老人</th><th>收款方</th><th>金额</th><th>等级</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>${D.transactions.length ? D.transactions.map(t => `
          <tr class="clickable" data-action="open-payment" data-id="${escape(t.id)}">
            <td><strong>${escape(t.id)}</strong></td><td>${escape(t.elderName)}</td><td>${escape(t.payee)}</td>
            <td class="num">${yuan(t.amount)}</td><td>${levelTag(t.level, levelName[t.level])}</td>
            <td>${statusTag(t.status)}</td><td class="muted">${escape(t.createdAt)}</td></tr>`).join('') : '<tr><td colspan="7"><div class="empty-box">暂无交易记录</div></td></tr>'}</tbody>
      </table>
    </section>`;

  /* ---------- 账户管理（信托，只读） ---------- */
  window.Views.accounts = () => `
    ${pageHead('账户管理', '受托账户、余额与支付限额 · 只读', `<span class="muted">共 ${D.accounts.length} 户</span>`)}
    <section class="panel table-scroll">
      <table class="admin-table">
        <thead><tr><th>账户</th><th>老人</th><th>余额</th><th>本月支出</th><th>单笔限额</th><th>状态</th><th>意定监护</th></tr></thead>
        <tbody>${D.accounts.length ? D.accounts.map(a => `
          <tr><td><strong>${escape(a.id)}</strong></td><td>${escape(a.elderName)}</td>
          <td class="num">${yuan(a.balance)}</td><td class="num">${yuan(a.monthSpent)}</td><td class="num">${yuan(a.singleLimit)}</td>
          <td><span class="tag tag-green">${escape(a.status)}</span></td><td class="muted">${escape(a.guardian)}</td></tr>`).join('') : '<tr><td colspan="7"><div class="empty-box">暂无受托账户</div></td></tr>'}</tbody>
      </table>
      <p class="panel-footnote">受托资产总额 ${yuan(D.accounts.reduce((s, a) => s + a.balance, 0))}</p>
    </section>`;

  /* ---------- 家庭成员 ---------- */
  window.Views.family = () => {
    const elder = window.Sidebar.profile('elder');
    const hasFamily = D.family.length || D.accounts.some(a => a.elderId === 'E001');
    const members = hasFamily ? [{ name: elder.displayName, relation: '长辈', initial: [...elder.displayName][0] }, ...D.family.map(f => ({ name: f.name, relation: f.relation, initial: f.initial }))] : [];
    return `
      ${pageHead('家庭成员', '关联家庭与关爱成员', `<span class="muted">共 ${members.length} 位</span>`)}
      <section class="panel table-scroll">
        <table class="admin-table">
          <thead><tr><th>成员</th><th>身份</th><th>关联家庭</th><th>说明</th></tr></thead>
          <tbody>${members.length ? members.map(m => `
            <tr><td><div class="admin-member"><span class="avatar">${escape(m.initial)}</span><strong>${escape(m.name)}</strong></div></td>
            <td>${escape(m.relation)}</td><td>${escape(elder.displayName)}的家庭</td>
            <td class="muted">${m.relation === '长辈' ? '接收风险提醒' : '接收求助与支付通知'}</td></tr>`).join('') : '<tr><td colspan="4"><div class="empty-box">暂无关联家庭成员</div></td></tr>'}</tbody>
        </table>
      </section>`;
  };

  /* ---------- 内容管理 ---------- */
  window.Views.content = () => `
    ${pageHead('内容管理', '反诈知识 · 长辈与家属同步可见', `<span class="muted">展示中 ${D.articles.filter(a => a.published).length} / ${D.articles.length} 篇</span>`)}
    <section class="panel table-scroll">
      <table class="admin-table">
        <thead><tr><th>文章标题</th><th>分类</th><th>状态</th><th>预览</th><th>操作</th></tr></thead>
        <tbody>${D.articles.length ? D.articles.map(a => `
          <tr><td><strong>${escape(a.title)}</strong><div class="muted">${a.minutes} 分钟阅读</div></td>
          <td>${escape(a.category)}</td>
          <td><span class="tag ${a.published ? 'tag-green' : 'tag-gray'}">${a.published ? '展示中' : '已隐藏'}</span></td>
          <td><button class="text-link" data-action="article-preview" data-id="${a.id}">预览</button></td>
          <td><button class="button subtle small" data-action="toggle-article" data-id="${a.id}">${a.published ? '隐藏内容' : '恢复展示'}</button></td></tr>`).join('') : '<tr><td colspan="5"><div class="empty-box">暂无防骗内容</div></td></tr>'}</tbody>
      </table>
    </section>`;

  /* ---------- 界面设置 ---------- */
  window.Views.settings = () => {
    const prefs = window.Workbench?.webPreferences || {};
    const rows = [['largeText', '放大文字', '提高正文和按钮字号。'], ['highContrast', '增强对比', '提高辅助文字的可读性。'], ['reduceMotion', '减少动效', '减少页面过渡和动画。']];
    return `
      ${pageHead('界面设置', '阅读偏好 · 仅网页生效', datePill())}
      <section class="panel settings-panel">${rows.map(([key, label, description]) => `
        <div class="setting-row"><div><h2 id="label-${key}">${label}</h2><p>${description}</p></div>
        <button class="switch" role="switch" aria-checked="${prefs[key] === true}" aria-labelledby="label-${key}" data-action="preference" data-value="${key}"></button></div>`).join('')}
        <div class="setting-row"><div><h2>清除演示操作</h2><p>清除本次操作、审计动态与操作留痕，恢复演示初始状态。家庭成员、演示脚本及展示案例保留。</p></div>
        <button class="button subtle" data-action="clear-all">清除演示操作</button></div>
      </section>`;
  };
})();
