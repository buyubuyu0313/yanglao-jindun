/* 每个 iframe 拥有独立导航、搜索与滚动位置，共享父页面业务资料。 */
(() => {
  const role = new URLSearchParams(location.search).get('role') === 'family' ? 'family' : 'elder';
  let host;
  try { host = parent.Workbench; } catch { /* 非同源页面不能访问宿主。 */ }
  if (!host) { document.getElementById('mobile-root').innerHTML='<div class="m-empty"><p>请从管理端打开手机体验。</p><a href="./">返回管理端</a></div>'; return; }
  const route = () => { const [page='overview',...path]=location.hash.slice(1).split('/');return {page:page||'overview',path:path.join('/')}; };
  function sync() {
    document.documentElement.dataset.theme=parent.document.documentElement.dataset.theme;
    const {preferences}=host.snapshot(role);
    for(const [name,key] of [['large-text','largeText'],['high-contrast','highContrast'],['reduce-motion','reduceMotion']])document.body.classList.toggle(name,preferences[key]);
  }
  function render(preserveDraft=true) {
    const forms=[...document.querySelectorAll('form')];
    const draft=preserveDraft?forms.flatMap(f=>[...f.elements].filter(e=>e.name).map(e=>({form:f.id,name:e.name,type:e.type,value:e.value,checked:e.checked}))):[];
    const active=document.activeElement;
    const focus=preserveDraft&&active?.name?{form:active.form?.id,name:active.name,start:active.selectionStart,end:active.selectionEnd}:null;
    sync();document.getElementById('mobile-root').innerHTML=window.MobileApp.render();window.MobileApp.mount();
    for(const item of draft){const form=document.getElementById(item.form);if(!form)continue;for(const field of [...form.elements].filter(e=>e.name===item.name)){if(item.type==='radio'){if(field.value===item.value)field.checked=item.checked;}else field.value=item.value;}}
    if(focus){const field=document.getElementById(focus.form)?.elements.namedItem(focus.name);if(field?.focus){field.focus({preventScroll:true});if(focus.start!=null&&field.setSelectionRange)field.setSelectionRange(focus.start,focus.end);}}
  }
  function navigate(page,path='',nested=true) {
    const hash=`#${page}${path?'/'+path:''}`;
    if(location.hash!==hash)history.pushState({mobileBack:location.hash},'',hash);
    render(false);window.MobileApp.focusPage();parent.FloatingPhones.changed(role);
  }
  window.MobileApp.connect({
    snapshot:()=>({...host.snapshot(role),...route()}),refresh:render,
    navigate,
    back(fallback) { if(history.state?.mobileBack)history.back();else navigate(fallback||'overview','',false); },
    resolve:id=>host.resolve(role,id),read:id=>host.read(role,id),save:id=>host.save(role,id),
    resolveHelp:(id,note)=>host.resolveHelp(id,note),
    help:host.help,preference:(key,value)=>host.mobilePreference(role,key,value),profile:value=>host.profile(role,value),
  });
  window.MobileWindow={navigate,render,sync,reset(){window.MobileApp.reset();history.replaceState(null,'','#overview');render(false);}};
  const update=()=>render();const reset=()=>window.MobileWindow.reset();
  parent.addEventListener('demo-state-changed',update);parent.addEventListener('demo-data-reset',reset);
  window.addEventListener('pagehide',()=>{parent.removeEventListener('demo-state-changed',update);parent.removeEventListener('demo-data-reset',reset);});
  window.addEventListener('popstate',()=>{render(false);window.MobileApp.focusPage();});
  window.addEventListener('hashchange',()=>render(false));
  window.addEventListener('pointerdown',()=>parent.FloatingPhones.activate(role));
  window.addEventListener('keydown',event=>{if(event.key==='Escape')parent.FloatingPhones.close(role);});
  render(false);parent.FloatingPhones.ready(role);
})();
