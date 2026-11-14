/* 纯静态演示数据 —— 按《养老金盾比赛演示版修改方案》与 v10 口径组织。
 * 结构：角色档案 / 老人与账户 / 支付交易（含 L3 主线）/ 待办 / 审计动态 / 异议 / 规则 / 权限矩阵。
 * 保留并沿用旧版 risks（长辈提醒）/ articles（防骗知识）/ family（家庭成员）/ requests（求助）。
 * 全部为虚构数据：不做真实检测、不接真实账户、不发送任何真实消息。 */
window.DemoData = {
  meta: { version: '演示版 v2 · 2026-10-10', demo: true },
  /* 角色档案：首页三卡 + 侧栏导航按角色裁剪（对齐 v10 口径）。 */
  roles: [
    {
      key: 'guardian', label: '意定监护人', tag: '推荐展示', duty: '照护执行',
      person: '陈曦 · G001', personName: '陈曦', actorId: 'G001', tone: 'blue', homeTitle: '照护工作台',
      homeSub: '处理家人求助，确认照护支付',
      desc: '家庭协助 · 支付确认 · 照护跟进',
      nav: [
        { to: 'overview', label: '照护工作台' }, { to: 'payment-new', label: '发起请款' },
        { to: 'todos', label: '支付确认' }, { to: 'risks', label: '风险提醒' },
        { to: 'audit', label: '审计报告' }, { to: 'family', label: '家庭成员' },
      ],
    },
    {
      key: 'trust', label: '信托公司管理员', tag: '', duty: '受托管理',
      person: '信托公司 TRUST-01', personName: '信托公司 TRUST-01', actorId: 'TRUST-01', tone: 'sage', homeTitle: '受托管理总览',
      homeSub: '管理受托资产，复核风险支付',
      desc: '资产管理 · 支付复核 · 规则管理',
      nav: [
        { to: 'overview', label: '受托总览' }, { to: 'accounts', label: '账户管理' },
        { to: 'todos', label: '审批中心' }, { to: 'risks', label: '风险处置' },
        { to: 'scam', label: '反诈风险检测' }, { to: 'rules', label: '规则管理' },
        { to: 'audit', label: '审计报告' },
      ],
    },
    {
      key: 'supervisor', label: '监察人', tag: '只读', duty: '监督核查',
      person: '青秀区公证处 · S001', personName: '青秀区公证处', actorId: 'S001', tone: 'ink', homeTitle: '监督工作台',
      homeSub: '追溯交易全过程，独立监督留痕',
      desc: '交易核查 · 审计追溯 · 提出异议',
      nav: [
        { to: 'overview', label: '监督概览' }, { to: 'transactions', label: '交易记录' },
        { to: 'risks', label: '风险核查' }, { to: 'audit', label: '审计报告' },
      ],
    },
  ],
  /* 老人与账户。余额单位：元。 */
  elders: [
    { id: 'E001', name: '陈桂芳', accountId: 'A001' },
    { id: 'E002', name: '周伯康', accountId: 'A002' },
    { id: 'E003', name: '王秀兰', accountId: 'A003' },
  ],
  accounts: [
    { id: 'A001', elderId: 'E001', elderName: '陈桂芳', owner: '陈桂芳', balance: 485000, monthSpent: 28000, singleLimit: 120000, monthLimit: 200000, monthAvg: 28000, status: '正常', guardian: 'G001 陈曦', note: '意定监护：G001 陈曦' },
    { id: 'A002', elderId: 'E002', elderName: '周伯康', owner: '周伯康', balance: 312000, monthSpent: 0, singleLimit: 100000, monthLimit: 150000, monthAvg: 26000, status: '正常', guardian: 'G002 周敏', note: '意定监护：G002 周敏' },
    { id: 'A003', elderId: 'E003', elderName: '王秀兰', owner: '王秀兰', balance: 159000, monthSpent: 10200, singleLimit: 80000, monthLimit: 120000, monthAvg: 21000, status: '正常', guardian: 'G003 林海', note: '意定监护：G003 林海' },
  ],
  /* 支付交易。status：draft / pending（待确认）/ frozen（已冻结）/ released（已放行）/ executed（已执行）/ rejected（已驳回）。 */
  transactions: [
    {
      id: 'P20261010-001', accountId: 'A001', elderId: 'E001', elderName: '陈桂芳',
      payee: '恒信健康管理咨询部', payeeAccount: 'MOCK-ACC-7721', amount: 150000,
      purpose: '预付半年护理服务费（加急代缴）', channel: '转账', source: '家属提交', applicant: '陈曦（家属）',
      createdAt: '2026-10-10 19:46', status: 'frozen', level: 'L3', score: 230,
      guardianConfirmed: false, trustReleased: false,
      hits: [
        { code: 'R03', name: '大额转账', kind: '硬', note: '¥150,000 ≥ 阈值 ¥50,000', weight: 120 },
        { code: 'R05', name: '收款方新出现', kind: '硬', note: '收款方不在历史交易名单内', weight: 80 },
        { code: 'R06', name: '非正常时段', kind: '软', note: '19:46 发起，为时段外操作', weight: 15 },
        { code: 'R11', name: '疑似诈骗话术', kind: '软', note: '「加急代缴」话术特征 0.85', weight: 15 },
      ],
      missNote: '收款方为清单外机构，且金额高于历史月均 5.36 倍，建议要求补充合同与服务清单。',
      trail: [
        { time: '10-10 19:46', actor: '陈曦（家属）', action: '提交支付申请', from: '草稿', to: '已提交' },
        { time: '10-10 19:46', actor: 'system', action: '进入规则审核', from: '已提交', to: '规则审核' },
        { time: '10-10 19:46', actor: '规则引擎', action: '规则审核完成，命中 2 条硬规则', from: '规则审核', to: '命中挂起' },
        { time: '10-10 19:46', actor: '编排器', action: '按风险等级分派待办：意定监护人 1 人 + 信托公司 1 人', from: '命中挂起', to: '已冻结' },
      ],
    },
    {
      id: 'P20261010-002', accountId: 'A002', elderId: 'E002', elderName: '周伯康',
      payee: '晚晴苑护理院', payeeAccount: 'MOCK-ACC-2018', amount: 86000,
      purpose: '预付床位及护理费', channel: '缴费', source: '家属提交', applicant: '周敏（家属）',
      createdAt: '2026-10-10 18:12', status: 'pending', level: 'L2', score: 30,
      guardianConfirmed: false, trustReleased: false,
      hits: [
        { code: 'R01', name: '单笔超限', kind: '硬', note: '¥86,000 ≥ 单笔阈值 ¥50,000', weight: 30 },
        { code: 'R05', name: '收款方新出现', kind: '软', note: '本年度首次交易', weight: 15 },
      ],
      missNote: '等待信托公司按职责预览确认。',
      trail: [
        { time: '10-10 18:12', actor: '周敏（家属）', action: '提交支付申请', from: '草稿', to: '已提交' },
        { time: '10-10 18:12', actor: '规则引擎', action: '规则审核完成，命中 1 条硬规则', from: '已提交', to: '命中挂起' },
        { time: '10-10 18:12', actor: '编排器', action: '按风险等级分派待办：信托公司 1 人', from: '命中挂起', to: '待确认' },
      ],
    },
    {
      id: 'P20260912-001', accountId: 'A001', elderId: 'E001', elderName: '陈桂芳',
      payee: '康民药房', payeeAccount: 'MOCK-ACC-1187', amount: 12600,
      purpose: '药品采购', channel: '转账', source: '家属提交', applicant: '陈曦（家属）',
      createdAt: '2026-09-12 15:47', executedAt: '2026-09-12 16:10', status: 'executed', level: 'L1', score: 20,
      guardianConfirmed: true, trustReleased: true,
      hits: [{ code: 'R05', name: '收款方新出现', kind: '软', note: '当年度第二次交易', weight: 15 }],
      missNote: '已执行出账，可在资金流水与审计报告中回查。',
      trail: [
        { time: '09-12 15:47', actor: '陈曦（家属）', action: '提交支付申请', from: '草稿', to: '已提交' },
        { time: '09-12 15:47', actor: '规则引擎', action: '规则审核完成，命中 R05 软规则', from: '已提交', to: '待确认' },
        { time: '09-12 16:10', actor: '陈曦（意定监护人）', action: '确认放行', from: '待确认', to: '已放行' },
        { time: '09-12 16:10', actor: '信托公司 TRUST-01', action: '复核通过，执行出账', from: '已放行', to: '已执行' },
      ],
    },
    {
      id: 'P20261008-001', accountId: 'A001', elderId: 'E001', elderName: '陈桂芳',
      payee: '青秀区康乐养老服务中心', payeeAccount: 'MOCK-ACC-3301', amount: 28000,
      purpose: '护理费月付', channel: '缴费', source: '机构提交', applicant: '康乐养老服务中心',
      createdAt: '2026-10-08 09:30', executedAt: '2026-10-08 09:31', status: 'executed', level: 'L0', score: 0,
      guardianConfirmed: false, trustReleased: false,
      hits: [], missNote: '未命中硬规则，按基线自动放行。',
      trail: [
        { time: '10-08 09:30', actor: '康乐养老服务中心', action: '提交支付申请', from: '草稿', to: '已提交' },
        { time: '10-08 09:31', actor: '规则引擎', action: '未命中硬规则，L0 自动放行', from: '已提交', to: '已执行' },
      ],
    },
    {
      id: 'P20260928-001', accountId: 'A003', elderId: 'E003', elderName: '王秀兰',
      payee: '青秀区社区食堂', payeeAccount: 'MOCK-ACC-4456', amount: 6800,
      purpose: '餐费充值', channel: '缴费', source: '家属提交', applicant: '林海（家属）',
      createdAt: '2026-09-28 10:05', executedAt: '2026-09-28 10:05', status: 'executed', level: 'L0', score: 0,
      guardianConfirmed: false, trustReleased: false,
      hits: [], missNote: '常规月费类目，自动放行。',
      trail: [
        { time: '09-28 10:05', actor: '林海（家属）', action: '提交支付申请', from: '草稿', to: '已提交' },
        { time: '09-28 10:05', actor: '规则引擎', action: '未命中硬规则，L0 自动放行', from: '已提交', to: '已执行' },
      ],
    },
  ],
  /* 待办：支付确认 / 支付复核 / 补充说明。assigneeRole：guardian / trust。 */
  todos: [
    { id: 'TD-20261010-01', kind: '支付确认', txnId: 'P20261010-001', assigneeRole: 'guardian', assignee: 'G001', createdAt: '2026-10-10 19:46', status: 'pending', note: '' },
    { id: 'TD-20261010-02', kind: '支付复核', txnId: 'P20261010-001', assigneeRole: 'trust', assignee: 'TRUST-01', createdAt: '2026-10-10 19:46', status: 'pending', note: '' },
    { id: 'TD-20261010-03', kind: '支付确认', txnId: 'P20261010-002', assigneeRole: 'trust', assignee: 'TRUST-01', createdAt: '2026-10-10 18:12', status: 'pending', note: '' },
  ],
  /* 审计动态：scope 用于按角色裁剪（supervisor=全量；guardian=E001 照护相关；trust=资金相关=全量）。 */
  audit: [
    { date: '10-10', time: '19:46', actor: '编排器', text: '按风险等级分派待办', level: 'L3', tag: '已冻结', txn: 'P20261010-001', detail: '陈桂芳 · 收款方 恒信健康管理咨询部 · ¥150,000', elderId: 'E001' },
    { date: '10-10', time: '19:46', actor: '规则引擎', text: '规则审核完成，命中 4 条规则（2 硬 + 2 软）', level: 'L3', tag: '已冻结', txn: 'P20261010-001', detail: '陈桂芳 · 收款方 恒信健康管理咨询部 · ¥150,000', elderId: 'E001' },
    { date: '10-10', time: '19:46', actor: 'system', text: '支付申请进入规则审核', level: 'L3', tag: '已冻结', txn: 'P20261010-001', detail: '陈桂芳 · 收款方 恒信健康管理咨询部 · ¥150,000', elderId: 'E001' },
    { date: '10-10', time: '19:46', actor: '家属', text: '提交支付申请', level: 'L3', tag: '已冻结', txn: 'P20261010-001', detail: '陈桂芳 · 收款方 恒信健康管理咨询部 · ¥150,000', elderId: 'E001' },
    { date: '10-10', time: '18:12', actor: '编排器', text: '分派待办：信托公司 1 人', level: 'L2', tag: '待确认', txn: 'P20261010-002', detail: '周伯康 · 收款方 晚晴苑护理院 · ¥86,000', elderId: 'E002' },
    { date: '10-10', time: '18:12', actor: '规则引擎', text: '规则审核完成，命中 2 条规则', level: 'L2', tag: '待确认', txn: 'P20261010-002', detail: '周伯康 · 收款方 晚晴苑护理院 · ¥86,000', elderId: 'E002' },
    { date: '10-08', time: '09:31', actor: '编排器', text: '未命中硬规则，L0 自动放行并出账', level: 'L0', tag: '已执行', txn: 'P20261008-001', detail: '陈桂芳 · 收款方 康乐养老服务中心 · ¥28,000', elderId: 'E001' },
    { date: '09-28', time: '10:05', actor: '规则引擎', text: '常规月费类目，自动放行', level: 'L0', tag: '已执行', txn: 'P20260928-001', detail: '王秀兰 · 收款方 青秀区社区食堂 · ¥6,800', elderId: 'E003' },
    { date: '09-12', time: '16:10', actor: '陈曦（意定监护人）', text: '确认放行', level: 'L1', tag: '已执行', txn: 'P20260912-001', detail: '陈桂芳 · 收款方 康民药房 · ¥12,600', elderId: 'E001' },
    { date: '09-12', time: '15:47', actor: 'scam', text: '模型调用超时，降级为规则基线', level: 'L1', tag: '已执行', txn: 'P20260912-001', detail: '陈桂芳 · 收款方 康民药房 · ¥12,600', elderId: 'E001' },
    { date: '09-12', time: '15:47', actor: '规则引擎', text: '规则审核完成，命中 R05 软规则', level: 'L1', tag: '已执行', txn: 'P20260912-001', detail: '陈桂芳 · 收款方 康民药房 · ¥12,600', elderId: 'E001' },
    { date: '09-12', time: '15:47', actor: '家属', text: '提交支付申请', level: 'L1', tag: '已执行', txn: 'P20260912-001', detail: '陈桂芳 · 收款方 康民药房 · ¥12,600', elderId: 'E001' },
  ],
  /* 异议：status = open（待跟进）/ closed（已终结）。监察人唯一动作：只留痕，不改变支付状态。 */
  objections: [
    {
      id: 'OBJ-20260912-001', txnId: 'P20260912-001', by: '青秀区公证处（S001）', createdAt: '2026-09-13 09:20',
      reason: '建议补充药房采购清单作为留痕。', status: 'closed',
      dispatchedTo: '信托公司 TRUST-01（补充说明）',
      closedAt: '2026-09-14 10:05', closeNote: '已上传药房采购清单与发票存根，核对无误。',
    },
  ],
  /* 判定规则（只读展示）。kind：硬 / 软。 */
  rules: [
    { code: 'R01', name: '单笔超限', kind: '硬', weight: 30, threshold: '¥50,000', desc: '单笔金额超过账户单笔限额。', enabled: true, version: 'v3', updated: '2026-09-30' },
    { code: 'R02', name: '收款方清单', kind: '硬', weight: 40, threshold: '白名单外', desc: '收款方不在托管白名单内。', enabled: true, version: 'v3', updated: '2026-09-30' },
    { code: 'R03', name: '大额转账', kind: '硬', weight: 120, threshold: '≥ ¥50,000', desc: '大额转账类目强制复核。', enabled: true, version: 'v4', updated: '2026-10-02' },
    { code: 'R04', name: '月度累计超限', kind: '硬', weight: 35, threshold: '月度限额', desc: '当月累计支出超过月度限额。', enabled: true, version: 'v3', updated: '2026-09-30' },
    { code: 'R05', name: '收款方新出现', kind: '软', weight: 15, threshold: '首次交易', desc: '该收款方没有历史交易记录。', enabled: true, version: 'v3', updated: '2026-09-30' },
    { code: 'R06', name: '非正常时段', kind: '软', weight: 15, threshold: '22:00–07:00', desc: '在通常休息的时段发起申请。', enabled: true, version: 'v2', updated: '2026-09-12' },
    { code: 'R07', name: '大额整数', kind: '软', weight: 10, threshold: '千元整数 ≥ ¥50,000', desc: '金额为整数万元/全部为整数千元的大额。', enabled: true, version: 'v2', updated: '2026-09-12' },
    { code: 'R08', name: '高频短时申请', kind: '软', weight: 20, threshold: '24h ≥ 3 笔', desc: '短时间内连续发起多笔申请。', enabled: true, version: 'v3', updated: '2026-09-30' },
    { code: 'R09', name: '异地远程操作', kind: '软', weight: 15, threshold: '归属地外', desc: '操作地点与常用地点不一致。', enabled: true, version: 'v2', updated: '2026-09-12' },
    { code: 'R10', name: '账户状态异常', kind: '硬', weight: 60, threshold: '非正常状态', desc: '账户处于挂失、冻结或异常状态。', enabled: true, version: 'v3', updated: '2026-09-30' },
    { code: 'R11', name: '疑似诈骗话术', kind: '软', weight: 15, threshold: '特征分 ≥ 0.55', desc: '用途与备注命中反诈话术特征（仅作提示）。', enabled: true, version: 'v5', updated: '2026-10-10' },
    { code: 'R12', name: '超出护理合约范围', kind: '软', weight: 20, threshold: '合约外', desc: '用途超出护理服务合约约定范围。', enabled: true, version: 'v2', updated: '2026-09-12' },
  ],
  /* 反诈话术检测样例（写死演示结果，不依赖外部大模型）。 */
  scamSample: {
    text: '您好，我是民政局养老补贴中心的工作人员，您的补贴账户出现异常，需要在今天 20:00 前把资金转到安全账户完成验证，请不要告诉其他人。',
    score: 0.85, label: '高危话术', model: 'demo-simulated（预置结果）',
    features: [
      { name: '冒充官方机构', hit: true, note: '自称民政局工作人员' },
      { name: '限时催促', hit: true, note: '要求 20:00 前完成' },
      { name: '转账/验证话术', hit: true, note: '「转到安全账户验证」' },
      { name: '要求保密', hit: true, note: '「不要告诉其他人」' },
    ],
    note: '规则优先，AI 辅助提示：模型结论只能提高风险提示等级，不能降低规则判定；最终是否放行仍以人工确认结果为准。',
  },
  /* 权限边界 · 三方制衡一页纸（对齐 v10 矩阵字段）。state：yes / no / scope。 */
  matrix: {
    roles: ['guardian', 'trust', 'supervisor'],
    rows: [
      { action: '发起支付', sub: '发起方为机构 / 家属 / 意定监护人；信托管钱不发起，监察人只读', states: { guardian: 'yes', trust: 'no', supervisor: 'no' } },
      { action: '确认', sub: '按等级分类：L2 意定监护人确认；L3 意定监护人与信托公司各 1 人确认', states: { guardian: 'yes', trust: 'yes', supervisor: 'no' } },
      { action: '驳回', sub: '驳回即终结；信托公司对已冻结申请的驳回是终审', states: { guardian: 'yes', trust: 'yes', supervisor: 'no' } },
      { action: '冻结', sub: '冻结权在意定监护人（防老人受骗的特权动作）；信托以解冻与终审配合', states: { guardian: 'yes', trust: 'no', supervisor: 'no' } },
      { action: '解冻', sub: '解冻是信托公司专责（管财力），避免冻结人自己解冻自己', states: { guardian: 'no', trust: 'yes', supervisor: 'no' } },
      { action: '提异议', sub: '监察人唯一动作：只留痕，不改变支付状态；同时触发补充说明待办（给信托 / 监护人）', states: { guardian: 'no', trust: 'no', supervisor: 'yes' } },
      { action: '改规则', sub: '判定规则的启停走信托「规则管理」（全程留痕，判定用当时快照）', states: { guardian: 'no', trust: 'yes', supervisor: 'no' } },
      { action: '看审计', sub: '范围不同：监察人=全量审计；信托=资金相关（含全量资金流）；意定监护人=照护相关（被监护老人）', states: { guardian: 'scope', trust: 'scope', supervisor: 'yes' } },
    ],
    canText: ['查看全部账户、交易与审计记录（只读）', '查看支付详情、规则判定与风险事件', '对任意申请提出异议（进入跟踪留痕，不改变申请状态）', '看到异议触发的补充说明待办由谁负责、何时终结'],
    cannotText: ['确认支付 / 审批支付（放行 / 驳回 / 冻结 / 解冻）', '修改账户状态与限额', '启停或修改判定规则', '修改审计记录（审计轨迹只读、只增不改）', '发起支付申请或编辑反诈内容'],
  },
  /* 演示流程（九步）：三端联动 + 支付风控。 */
  demoSteps: [
    { title: '查看风险提醒', text: '查看可疑来电：对方要求转账验证账户。', phase: '家庭协同', duration: '约1分半' },
    { title: '请家人协助', text: '选择家人，提交求助。', phase: '家庭协同', duration: '约1分半' },
    { title: '家属收到求助', text: '在家属端查看新收到的求助。', phase: '家庭协同', duration: '约1分半' },
    { title: '联系并解决', text: '先「确认已联系」，再「完成处理」。', phase: '家庭协同', duration: '约1分半' },
    { title: '查看同步结果', text: '照护工作台已同步求助处理记录。', phase: '家庭协同', duration: '约1分半' },
    { title: '提交高风险支付', text: '选「疑似诈骗」，提交支付申请。', phase: '资金风控', duration: '约2分钟' },
    { title: 'L3 自动冻结', text: '查看命中规则与冻结结果，资金等待双确认。', phase: '资金风控', duration: '约2分钟' },
    { title: '完成双确认', text: '监护人确认后，切换信托身份复核放行。', phase: '资金风控', duration: '约2分钟' },
    { title: '回看完整审计', text: '查看规则判定、人工确认与最终支付记录。', phase: '审计追溯', duration: '约半分钟' },
  ],
  boundary: [
    '全程标注「演示」；全部使用模拟账户与脱敏档案',
    '不连接真实信托账户、不发送真实短信、不存储真实身份信息',
    '演示中产生的求助与支付只在当前页面内生效，刷新后回到初始状态',
    '不替代持牌机构履职：判定结果仅用于演示与教学，不构成任何真实建议',
  ],
  /* ---------- 以下为旧版沿用的长辈端 / 家属端数据，字段保持兼容 ---------- */
  requests: [],
  risks: [
    { id: 'r1', title: '“养老补贴领取”短信', channel: '短信', icon: 'message', level: 'high', riskLevel: 'L3', rules: ['R09', 'R11'], time: '演示 · 10:24', summary: '短信要求点击陌生链接，填写身份及银行卡信息。', detail: '示例短信：您的养老补贴待领取，请进入陌生网址登记。这个演示案例包含陌生链接和敏感信息索取。', advice: ['不要点击短信中的陌生链接。', '通过自己查找到的官方渠道核实信息。', '可以请信任的家人一起查看。'], resolved: false },
    { id: 'r2', title: '自称工作人员的来电', channel: '电话', icon: 'phone', level: 'high', riskLevel: 'L3', rules: ['R06', 'R11'], time: '演示 · 09:42', summary: '对方要求转账到指定账户，称用于“账户验证”。', detail: '示例来电要求以转账方式验证账户。这里的风险标签仅用于展示界面，不代表真实识别能力。', advice: ['先结束通话，不按对方要求转账。', '使用自行查到的机构联系方式核实。', '不要提供密码或短信验证码。'], resolved: false },
    { id: 'r3', title: '陌生群聊的投资链接', channel: '链接', icon: 'link', level: 'medium', riskLevel: 'L2', rules: ['R11'], time: '演示 · 昨天', summary: '群消息以“保本高收益”为由，引导下载陌生应用。', detail: '示例群消息声称收益有保证，要求安装未知来源的应用。请把这个页面当作交互演示。', advice: ['不要安装陌生群聊推荐的未知应用。', '不要因为限时或名额话术急于操作。', '先与家人讨论，再通过正规渠道核实。'], resolved: true },
  ],
  articles: [
    { id: 'a1', category: '短信防骗', icon: 'message', title: '“补贴到账”的短信，先核实再操作', description: '认清陌生链接，守好个人信息。', minutes: 3, color: 'blue', content: ['收到“补贴领取”“资料补录”等信息时，先确认发送方和信息来源。', '不要通过陌生短信链接填写身份证号、银行卡号、密码或验证码。', '需要核实时，使用自己查到的官方渠道，不依赖短信中提供的号码。'] },
    { id: 'a2', category: '投资防骗', icon: 'wallet', title: '遇到“高收益”，给自己一点思考时间', description: '看懂常见话术，不被催促带着走。', minutes: 4, color: 'violet', content: ['“限时名额”“稳赚不赔”等说法容易让人忽略核实步骤。', '把项目名称、机构信息和资金去向写下来，和信任的家人一起讨论。', '不要因为群聊截图、陌生人的成功案例或催促而匆忙转账。'] },
    { id: 'a3', category: '电话防骗', icon: 'phone', title: '来电说账户异常？先挂断，再核实', description: '给可疑来电按下暂停键。', minutes: 3, color: 'cyan', content: ['来电显示和自称身份不能单独证明对方可信。', '遇到转账、共享屏幕或提供验证码的要求，先停止操作。', '通过自己查到的机构联系方式核实，必要时请家人协助。'] },
    { id: 'a4', category: '日常守护', icon: 'lock', title: '验证码，只留给自己', description: '建立一个简单、实用的信息保护习惯。', minutes: 2, color: 'blue', content: ['验证码可能用于登录、支付或变更账户信息。', '不要向陌生人发送验证码，也不要在通话中报出验证码。', '使用账户服务时，仔细阅读短信说明，确认是自己发起的操作。'] },
    { id: 'a5', category: '日常守护', icon: 'users', title: '和家人约定一次“转账前确认”', description: '遇到拿不准的事，多一次沟通。', minutes: 2, color: 'cyan', content: ['和家人约定：遇到陌生收款人或紧急转账要求时，先沟通确认。', '通过熟悉的联系方式回拨，不只依赖群消息或语音。', '家人协助应建立在本人知情同意的基础上。'] },
    { id: 'a6', category: '短信防骗', icon: 'link', title: '打开链接前，先看看它从哪里来', description: '陌生链接和未知应用，需要多留意。', minutes: 3, color: 'violet', content: ['不要仅凭页面上的标志、名称或截图判断真实性。', '优先通过已经确认的官方应用或入口办理业务。', '对要求额外下载应用、授权远程控制的页面，先停止操作。'] },
  ],
  family: [
    { id: 'f1', name: '陈曦', relation: '儿子', initial: '曦', color: 'blue' },
    { id: 'f2', name: '陈露', relation: '女儿', initial: '露', color: 'violet' },
  ],
};
