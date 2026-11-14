/* 独立手机界面；宿主提供共享资料和导航，各实例保留自己的搜索与滚动状态。 */
window.MobileApp = (() => {
  let api;
  let previousKey = '';
  let capturedFocus = null;
  const positions = new Map();
  const local = {
    elder: { search: '', category: '全部', filter: 'pending', notice: '', contactedId: '' },
    family: { search: '', category: '全部', filter: 'pending', notice: '', contactedId: '' },
  };
  const icon = name => window.Icons.svg(name);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const view = () => api.snapshot();
  const ui = () => local[view().role];
  const parts = () => view().path.split('/').filter(Boolean);
  const key = () => `${view().role}/${view().page}/${view().path}`;
  const pending = () => view().data.risks.filter(r => !r.resolved);
  const available = () => view().data.articles.filter(a => a.published);
  const requestPending = request => request.resolved !== true;
  const time = value => String(value).replace('演示 · ', '');
  function action(name, label, id = '', style = '') {
    return `<button class="m-button ${style}" data-mobile-action="${name}" data-id="${esc(id)}">${label}</button>`;
  }
  function badge(risk) {
    return `<span class="m-badge ${risk.resolved ? 'resolved' : risk.level}">${risk.resolved ? '已核实' : risk.level === 'high' ? '重点核实' : '建议核实'}</span>`;
  }
  function heading(text, back = false) {
    return `<header class="m-heading">${back ? `<button class="m-icon-button m-back" data-mobile-action="back" aria-label="返回上一页">${icon('chevron')}</button>` : ''}<h1 tabindex="-1">${text}</h1><span class="m-demo">演示</span></header>`;
  }
  function empty(text, name = 'book') { return `<div class="m-empty">${icon(name)}<p>${text}</p></div>`; }
  function section(text, extra = '') { return `<div class="m-section"><h2>${text}</h2>${extra}</div>`; }
  function riskCard(risk) {
    return `<button class="m-risk ${risk.resolved ? 'resolved' : risk.level}" data-mobile-action="risk" data-id="${risk.id}"><span class="m-risk-icon">${icon(risk.icon)}</span><span class="m-risk-content"><span class="m-risk-meta">${badge(risk)}<small>${time(risk.time)}</small></span><strong>${risk.title}</strong><span>${risk.summary}</span></span>${icon('chevron')}</button>`;
  }
  function home() {
    const { role, profile, elderProfile, data } = view();
    const reminders = pending();
    const reminderStatus = data.risks.length ? '提醒已全部核实' : '暂无风险提醒';
    if (role === 'family') {
      const waiting = data.requests.filter(requestPending);
      const completed = data.requests.filter(request => !requestPending(request));
      return heading('家庭守护')+(data.family.length ? `<button class="m-member m-member-compact" data-mobile-action="member"><span class="m-avatar" data-color="${elderProfile.color}">${esc([...elderProfile.displayName][0])}</span><span><strong>${esc(elderProfile.displayName)}</strong><small>母亲</small></span>${icon('chevron')}</button>` : '')+`<section class="m-hero family"><div class="m-hero-top">${icon('users')}${waiting.length ? '家人需要协助' : '家庭守护状态'}</div><h2>${waiting.length ? `${waiting.length} 条请求待协助` : reminders.length ? `${reminders.length} 条提醒待核实` : reminderStatus}</h2>${waiting.length ? action('request','处理请求 '+icon('arrow'),waiting[0].id,'primary') : action('tab','查看提醒 '+icon('arrow'),'risks','primary')}</section>${waiting.length || completed.length ? section(waiting.length ? '待协助请求' : '协助记录',action('requests','全部 '+icon('chevron'),'','text'))+requestList((waiting.length ? waiting : completed).slice(0,1)) : ''}<div class="m-metrics"><button data-mobile-action="tab" data-id="risks"><strong data-mobile-pending>${reminders.length}</strong><span>待核实</span></button><button data-mobile-action="requests"><strong>${waiting.length}</strong><span>待协助</span></button><button data-mobile-action="records"><strong>${data.risks.filter(r=>r.resolved).length}</strong><span>已核实</span></button></div>${section('风险提醒')}${reminders.slice(0,1).map(riskCard).join('') || empty('暂无待核实提醒','shield')}`;
    }
    const firstRisk = reminders[0];
    return heading('养老金盾')+`<div class="m-greeting"><span>你好，${esc(profile.displayName)}</span><button class="m-avatar small" data-color="${profile.color}" data-mobile-action="profile" aria-label="查看我的资料">${esc([...profile.displayName][0])}</button></div><section class="m-hero"><div class="m-hero-top">${icon(firstRisk ? 'warning' : 'shield')}${firstRisk ? `${reminders.length} 条提醒待核实` : '安心守护'}</div><h2>${firstRisk ? esc(firstRisk.title) : reminderStatus}</h2>${firstRisk ? `<p class="m-hero-summary">${esc(firstRisk.summary)}</p><div class="m-hero-actions">${action('ask',icon('users')+'请家人协助',firstRisk.id,'primary')}${action('risk','查看详情 '+icon('arrow'),firstRisk.id,'hero-link')}</div>` : action('tab','查看提醒 '+icon('arrow'),'risks','primary')}</section><div class="m-shortcuts">${[['risks','bell-alert','风险提醒'],['family','users','家人协助'],['knowledge','book','防骗知识'],['favorites','bookmark','我的收藏']].map(([id,name,label])=>`<button data-mobile-action="${id==='favorites'?'favorites':'tab'}" data-id="${id}"><span>${icon(name)}</span><strong>${label}</strong></button>`).join('')}</div>${reminders.length > 1 ? section('其他提醒',action('tab','全部 '+icon('chevron'),'risks','text'))+reminders.slice(1,2).map(riskCard).join('') : ''}${section('防骗知识',action('tab','更多 '+icon('chevron'),'knowledge','text'))}${available().slice(0,1).map(articleCard).join('') || empty('暂无防骗知识')}`;
  }
  function risks() {
    const filtered = view().data.risks.filter(r=>ui().filter==='all' || (ui().filter==='pending'?!r.resolved:r.resolved));
    return heading(view().role==='family'?'协助提醒':'风险提醒')+`<div class="m-segment">${[['pending','待核实'],['resolved','已核实'],['all','全部']].map(([id,label])=>`<button data-mobile-action="filter" data-id="${id}" class="${ui().filter===id?'active':''}" aria-pressed="${ui().filter===id}">${label}</button>`).join('')}</div><div class="m-risk-list">${filtered.map(riskCard).join('') || empty('暂无提醒','shield')}</div>`;
  }
  function riskDetail() {
    const risk = view().data.risks.find(r=>r.id===parts()[0]);
    if (!risk) return heading('提醒详情',true)+empty('未找到这条提醒','bell-alert');
    const examples = { r1:'您的养老补贴待领取，请点击链接登记身份和银行卡信息。', r2:'您的账户需要验证，请向指定账户转账。', r3:'限时高收益名额，安装应用立即参与。' };
    return heading('提醒详情',true)+`<div class="m-risk-summary ${risk.resolved?'resolved':risk.level}"><span>${icon(risk.resolved?'check':'warning')}</span><div>${badge(risk)}<h2>${risk.title}</h2><p>${risk.channel} · ${time(risk.time)}</p></div></div><div class="m-excerpt"><small>信息内容</small><p>${examples[risk.id] || risk.summary}</p></div><div class="m-actions">${view().role==='elder'?action('ask',icon('users')+'请家人协助',risk.id,'primary'):''}<button class="m-button ${view().role==='elder'?'secondary':'primary'}" data-mobile-action="resolve" data-id="${risk.id}" ${risk.resolved?'disabled':''}>${icon('check')}${risk.resolved?'已核实':'标记已核实'}</button></div>${section('核实建议')}<ol class="m-advice">${risk.advice.map(item=>`<li>${item}</li>`).join('')}</ol>`;
  }
  function articleCard(article) {
    return `<button class="m-article" data-mobile-action="article" data-id="${article.id}"><span class="m-article-icon ${article.color}">${icon(article.icon)}</span><span><small>${article.category} · ${article.minutes} 分钟</small><strong>${article.title}</strong>${view().saved.has(article.id)?'<em>已收藏</em>':''}</span>${icon('chevron')}</button>`;
  }
  function results() {
    const query = ui().search.trim().toLowerCase();
    const articles = available().filter(a=>(ui().category==='全部'||a.category===ui().category) && `${a.title}${a.description}${a.content.join('')}`.toLowerCase().includes(query));
    return articles.map(articleCard).join('') || empty(available().length ? '没有找到相关内容' : '暂无防骗知识');
  }
  function knowledge() {
    const categories=['全部',...new Set(view().data.articles.map(a=>a.category))];
    return heading('防骗知识')+`<label class="m-search">${icon('search')}<input type="search" aria-label="搜索防骗知识" data-mobile-search data-mobile-focus="search" placeholder="搜索防骗知识" value="${esc(ui().search)}"></label><div class="m-categories">${categories.map(c=>`<button data-mobile-action="category" data-id="${c}" class="${ui().category===c?'active':''}" aria-pressed="${ui().category===c}">${c}</button>`).join('')}</div><div id="article-results" class="m-article-list">${results()}</div>`;
  }
  function articleDetail() {
    const article = available().find(a=>a.id===parts()[0]);
    if(!article)return heading('知识详情',true)+empty('这篇知识暂未展示');
    return heading('知识详情',true)+`<div class="m-reading-tag">${icon(article.icon)}${article.category}</div><h2 class="m-reading-title">${article.title}</h2><p class="m-reading-meta">${article.minutes} 分钟阅读</p><div class="m-reading">${article.content.map(p=>`<p>${p}</p>`).join('')}</div><div class="m-actions">${action('save',icon('bookmark')+(view().saved.has(article.id)?'取消收藏':'收藏'),article.id,'secondary')}${action('read',icon('check')+(view().read.has(article.id)?'已阅读':'我了解了'),article.id,'primary')}</div>`;
  }
  function requestList(requests) {
    if(!requests.length)return empty(view().role==='family'?'暂无协助请求':'暂无求助记录','message');
    return requests.map(request=>`<button class="m-request ${requestPending(request)?'pending':'done'}" data-mobile-action="request" data-id="${request.id}"><span class="m-request-icon">${icon(requestPending(request)?'message':'check')}</span><span><strong>${request.riskId ? view().data.risks.find(r=>r.id===request.riskId)?.title || '信息核实' : '请一起看看'}</strong><small>${view().role==='family'?esc(view().elderProfile.displayName):esc(request.name)} · ${request.time}</small></span><em class="${requestPending(request)?'pending':'done'}">${requestPending(request)?'待协助':'已完成'}</em></button>`).join('');
  }
  function family() {
    const { role, data, elderProfile }=view();
    if(role==='family')return heading('家人协助')+(data.family.length ? `<button class="m-member" data-mobile-action="member"><span class="m-avatar" data-color="${elderProfile.color}">${esc([...elderProfile.displayName][0])}</span><span><strong>${esc(elderProfile.displayName)}</strong><small>母亲</small></span>${icon('chevron')}</button>` : empty('暂无家庭成员','users'))+`${section('协助请求')}${requestList(data.requests)}`;
    return heading('我的家人')+(data.family.map(person=>`<article class="m-person"><span class="m-avatar" data-color="${person.color==='violet'?'ink':'blue'}">${esc(person.initial)}</span><div><h2>${esc(person.name)}</h2><p>${esc(person.relation)}</p></div>${action('ask-person','请帮忙',person.id,'compact')}</article>`).join('') || empty('暂无家庭成员','users'))+`<button class="m-settings-row" data-mobile-action="requests">${icon('clock')}<span>求助记录</span>${icon('chevron')}</button>`;
  }
  function help() {
    const { data }=view();
    const person=data.family.find(p=>p.id===parts()[1]) || data.family[0];
    const risk=data.risks.find(r=>r.id===parts()[2]);
    if(!person)return heading('家人协助',true)+empty('暂无家庭成员','users');
    const message=risk?`我收到了一条“${risk.title}”提醒，想请你一起看看。`:'这条信息我拿不准，想请你一起看看。';
    return heading('请家人协助',true)+`<form id="mobile-help-form" data-risk="${risk?.id || ''}"><label class="m-field">选择家人<select name="person">${data.family.map(p=>`<option value="${p.id}" ${p.id===person.id?'selected':''}>${esc(p.name)} · ${esc(p.relation)}</option>`).join('')}</select></label><label class="m-field">留言<textarea name="message" maxlength="200" rows="4" required>${esc(message)}</textarea></label><button class="m-button primary wide" type="submit">${icon('message')}提交协助请求</button></form>`;
  }
  function receipt() {
    const request=view().data.requests.find(r=>r.id===parts()[1]);
    if(!request)return heading('求助记录',true)+empty('未找到这条记录','message');
    return heading('求助记录',true)+`<div class="m-success ${requestPending(request)?'waiting':''}">${icon(requestPending(request)?'clock':'check')}<h2>${requestPending(request)?'等待家人协助':'协助已完成'}</h2><p>协助人：${esc(request.name)}</p></div><div class="m-excerpt"><small>${request.time}</small><p>${esc(request.message)}</p></div>${action('requests','查看求助记录','','primary wide')}`;
  }
  function requestDetail() {
    const request=view().data.requests.find(r=>r.id===parts()[1]);
    if(!request)return heading('协助详情',true)+empty('未找到这条记录','message');
    const isFamily=view().role==='family';
    const contacted=local.family.contactedId===request.id;
    const done=request.resolved===true;
    return heading('协助详情',true)+`<div class="m-excerpt"><small>${esc(isFamily?view().elderProfile.displayName:request.name)} · ${request.time}</small><p>${esc(request.message)}</p></div>`+(
      isFamily&&!done?`<div class="m-flow-steps"><span class="${contacted?'done':'active'}">1 确认联系</span><span class="${contacted?'active':''}">2 完成处理</span></div><form id="mobile-request-form" data-request="${esc(request.id)}"><label class="m-field">处理说明（选填）<textarea name="note" maxlength="120" rows="3" placeholder="如：已与家人核实，提醒不要点击链接"></textarea></label><div class="m-actions"><button class="m-button secondary" type="button" data-mobile-action="contacted" data-id="${esc(request.id)}" ${contacted?'disabled':''}>${icon('phone')}${contacted?'已确认联系':'确认已联系'}</button><button class="m-button primary" type="submit" ${contacted?'':'disabled'}>${icon('check')}完成处理</button></div></form>`
      :done?`<div class="m-success">${icon('check')}<h2>协助已完成</h2>${request.note?`<p>${esc(request.note)}</p>`:''}<small>处理记录已同步至管理端</small></div>`
      :`<div class="m-success waiting">${icon('clock')}<h2>等待家人协助</h2></div>`)+(request.riskId?action('risk','查看提醒 '+icon('arrow'),request.riskId,'secondary wide'):'');
  }
  function member() {
    if(!view().data.family.length)return heading('家人资料',true)+empty('暂无家庭成员','users');
    const profile=view().elderProfile;
    return heading('家人资料',true)+`<div class="m-profile"><span class="m-avatar" data-color="${profile.color}">${esc([...profile.displayName][0])}</span><h2>${esc(profile.displayName)}</h2><p>母亲</p></div><div class="m-metrics"><button data-mobile-action="tab" data-id="risks"><strong>${pending().length}</strong><span>待核实</span></button><button data-mobile-action="records"><strong>${view().data.risks.filter(r=>r.resolved).length}</strong><span>已核实</span></button></div>${action('tab','查看风险提醒 '+icon('arrow'),'risks','primary wide')}${action('requests','查看协助记录','', 'secondary wide')}`;
  }
  function settingsRow(name, title, actionName, id='') {
    return `<button class="m-settings-row" data-mobile-action="${actionName}" data-id="${id}">${icon(name)}<span>${title}</span>${icon('chevron')}</button>`;
  }
  function mine() {
    const { profile, read, saved, data }=view();
    const readCount=data.articles.filter(article=>read.has(article.id)).length;
    const savedCount=data.articles.filter(article=>saved.has(article.id)).length;
    return heading('我的')+`<button class="m-profile" data-mobile-action="profile"><span class="m-avatar" data-color="${profile.color}">${esc([...profile.displayName][0])}</span><h2>${esc(profile.displayName)}</h2><p>${esc(profile.bio || (view().role==='family'?'家属账户':'长辈账户'))}</p><span class="m-edit">编辑资料 ${icon('chevron')}</span></button><div class="m-metrics"><button data-mobile-action="tab" data-id="knowledge"><strong>${readCount}</strong><span>已阅读</span></button><button data-mobile-action="favorites"><strong>${savedCount}</strong><span>已收藏</span></button></div><div class="m-settings-list">${settingsRow('bookmark','我的收藏','favorites')}${settingsRow('clock',view().role==='family'?'协助记录':'求助记录','requests')}${settingsRow('settings','阅读设置','preferences')}${settingsRow('shield','关于养老金盾','about')}</div>`;
  }
  function preferences() {
    return heading('阅读设置',true)+`<p class="m-reading-meta">仅在此手机生效</p><div class="m-settings-list">${[['largeText','放大文字'],['highContrast','增强对比'],['reduceMotion','减少动效']].map(([id,title])=>`<div class="m-preference"><strong id="mobile-label-${id}">${title}</strong><button class="switch" role="switch" aria-checked="${view().preferences[id]}" aria-labelledby="mobile-label-${id}" data-mobile-action="preference" data-id="${id}"></button></div>`).join('')}</div>`;
  }
  function profile() {
    const { profile }=view();
    return heading('个人资料',true)+`<form id="mobile-profile-form"><div class="m-profile-avatar"><span class="m-avatar" data-color="${profile.color}">${esc([...profile.displayName][0])}</span></div><label class="m-field">称呼<input name="displayName" required maxlength="16" value="${esc(profile.displayName)}" data-mobile-focus="displayName" autocomplete="off"></label><label class="m-field">个性签名<input name="bio" maxlength="40" value="${esc(profile.bio)}" data-mobile-focus="bio" autocomplete="off"></label><fieldset class="m-avatar-picker"><legend>头像颜色</legend>${[['ink','深蓝'],['blue','蓝色'],['sage','青绿']].map(([id,title])=>`<label><input name="color" type="radio" value="${id}" ${profile.color===id?'checked':''}><span class="m-avatar" data-color="${id}">${title}</span></label>`).join('')}</fieldset><button class="m-button primary wide" type="submit">保存</button></form>`;
  }
  function favorites() { return heading('我的收藏',true)+available().filter(a=>view().saved.has(a.id)).map(articleCard).join('')+(available().some(a=>view().saved.has(a.id))?'':empty('暂无收藏')); }
  function content() {
    const { page, path }=view();
    if(page==='risks' && path)return riskDetail();
    if(page==='knowledge' && path)return articleDetail();
    if(page==='family' && path) {
      return { help, sent:receipt, request:requestDetail, member, requests:()=>heading(view().role==='family'?'协助记录':'求助记录',true)+requestList(view().data.requests) }[parts()[0]]?.() || heading('家人协助',true)+empty('未找到此页面','users');
    }
    if(page==='settings' && path) {
      return { favorites, preferences, profile, about:()=>heading('关于养老金盾',true)+`<div class="m-about">${icon('shield')}<h2>养老金盾</h2><p>养老反诈与家庭守护</p><small>使用模拟资料，未接入真实账户、风险检测、消息或电话服务。</small></div>` }[parts()[0]]?.() || heading('我的',true)+empty('未找到此页面');
    }
    return { overview:home, risks, knowledge, family, settings:mine }[page]?.() || home();
  }
  function title() {
    const { page,path,role }=view();
    if(path)return page==='risks'?'提醒详情':page==='knowledge'?'知识详情':page==='settings'?({favorites:'我的收藏',profile:'个人资料',preferences:'阅读设置',about:'关于养老金盾'}[parts()[0]] || '我的'):({help:'请家人协助',sent:'求助记录',request:'协助详情',requests:role==='family'?'协助记录':'求助记录',member:'家人资料'}[parts()[0]] || '家人协助');
    return { overview:role==='family'?'家庭守护':'养老金盾',risks:role==='family'?'协助提醒':'风险提醒',knowledge:'防骗知识',family:role==='family'?'家人协助':'我的家人',settings:'我的' }[page];
  }
  function bottom() {
    const { page,role }=view();
    return `<nav class="mobile-bottom-nav" aria-label="手机底部导航">${[['overview','home','首页'],['risks','bell-alert','提醒'],['knowledge','book','知识'],['family','users',role==='family'?'协助':'家人'],['settings','user-round','我的']].map(([id,name,label])=>`<button data-mobile-action="tab" data-id="${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}>${icon(name)}<span>${label}</span></button>`).join('')}</nav>`;
  }
  function capture() {
    const screen=document.querySelector('.mobile-screen');
    if(!screen)return;
    positions.set(previousKey,screen.scrollTop);
    const focus=document.activeElement;
    capturedFocus=focus?.hasAttribute('data-mobile-focus')?{name:focus.dataset.mobileFocus}:focus?.closest('.phone-device')&&focus.dataset.mobileAction?{action:focus.dataset.mobileAction,id:focus.dataset.id || ''}:null;
  }
  function render() {
    capture();
    const { role,page,path }=view();
    const now=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
    return `<section class="mobile-app ${role}" aria-label="${role==='family'?'家属端':'长辈端'}手机界面"><div class="phone-device" data-role="${role}" data-page="${page}" data-view="${esc(path || 'root')}"><div class="mobile-status"><span>${now}</span><span class="device-camera" aria-hidden="true"></span><div>${icon('wifi')}${icon('battery')}</div></div><div class="mobile-screen" tabindex="-1" aria-label="${title()}">${ui().notice?`<div class="m-notice" role="status">${esc(ui().notice)}</div>`:''}${content()}</div>${bottom()}<div class="mobile-home-indicator" aria-hidden="true"></div></div></section>`;
  }
  function focusPage() { document.querySelector('.m-heading h1')?.focus({preventScroll:true}); }
  function mount() {
    const changed=previousKey!==key();
    document.querySelector('.mobile-screen').scrollTop=positions.get(key()) || 0;
    if(!changed && capturedFocus) {
      const selector=capturedFocus.name?`[data-mobile-focus="${capturedFocus.name}"]`:`[data-mobile-action="${CSS.escape(capturedFocus.action)}"][data-id="${CSS.escape(capturedFocus.id)}"]`;
      const target=document.querySelector(`.phone-device ${selector}`);
      if(target&&!target.disabled)target.focus({preventScroll:true});
    }
    previousKey=key();capturedFocus=null;
  }
  function flash(message) {
    const role=view().role;local[role].notice=message;api.refresh();
    clearTimeout(flash.timer);flash.timer=setTimeout(()=>{local[role].notice='';if(view().role===role&&document.querySelector('.phone-device'))api.refresh();},3000);
  }
  function go(page,path='',nested=true) { ui().notice='';api.navigate(page,path,nested); }
  function openRisk(id) { go('risks',id,true); }
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-mobile-action]');if(!target||!api)return;
    const { mobileAction:action,id }=target.dataset;
    switch(action) {
      case 'tab': go(id,'',false);break;
      case 'back': api.back(view().page);break;
      case 'risk': openRisk(id);break;
      case 'filter': ui().filter=id;api.refresh();break;
      case 'article': api.read(id);go('knowledge',id);break;
      case 'category': ui().category=id;api.refresh();break;
      case 'save': api.save(id);break;
      case 'read': api.read(id);flash('已阅读');break;
      case 'resolve': api.resolve(id);break;
      case 'contacted': ui().contactedId=id;api.refresh();break;
      case 'ask': { const person=view().data.family[0];if(person)go('family',`help/${person.id}/${id}`);break; }
      case 'ask-person': go('family',`help/${id}`);break;
      case 'requests': go('family','requests');break;
      case 'request': go('family',`request/${id}`);break;
      case 'member': go('family','member');break;
      case 'records': ui().filter='resolved';go('risks','',false);break;
      case 'favorites': go('settings','favorites');break;
      case 'preferences': go('settings','preferences');break;
      case 'profile': go('settings','profile');break;
      case 'about': go('settings','about');break;
      case 'preference': api.preference(id);break;
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.hasAttribute('data-mobile-search')){ui().search=event.target.value;document.getElementById('article-results').innerHTML=results();}
    if(event.target.closest('#mobile-profile-form'))event.target.form.elements.displayName.setCustomValidity('');
  });
  document.addEventListener('submit',event=>{
    if(event.target.id==='mobile-help-form') {
      event.preventDefault();const form=event.target;const message=form.elements.message.value.trim();
      if(!message){form.elements.message.setCustomValidity('请输入留言');form.elements.message.reportValidity();form.elements.message.addEventListener('input',()=>form.elements.message.setCustomValidity(''),{once:true});return;}
      const id=api.help(form.elements.person.value,form.dataset.risk,message);if(id)go('family',`sent/${id}`);
    }
    if(event.target.id==='mobile-request-form') {
      event.preventDefault();const form=event.target;
      const note=form.elements.note?form.elements.note.value.trim():'';
      api.resolveHelp(form.dataset.request,note);flash('协助已完成');
    }
    if(event.target.id==='mobile-profile-form') {
      event.preventDefault();const form=event.target;
      if(!form.elements.displayName.value.trim()){form.elements.displayName.setCustomValidity('请输入称呼');form.elements.displayName.reportValidity();return;}
      const persisted=api.profile({displayName:form.elements.displayName.value,bio:form.elements.bio.value,color:form.elements.color.value});flash(persisted?'资料已保存':'本次已修改，浏览器未允许保存');
    }
  });
  window.addEventListener('sidebar-profile-changed',()=>{if(api&&document.querySelector('.phone-device'))api.refresh();});
  return { render,mount,title,focusPage,openRisk,showRisks(){ui().filter='pending';go('risks','',false);},connect(value){api=value;},unmount(){previousKey='';},reset(){positions.clear();previousKey='';for(const role of ['elder','family'])local[role]={search:'',category:'全部',filter:'pending',notice:'',contactedId:''};} };
})();
