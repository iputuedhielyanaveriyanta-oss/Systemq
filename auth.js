(function(){
'use strict';
var CFG={
  url:'https://jyqheupnegdrdbtpojhl.supabase.co',
  key:'sb_publishable_m86qfyYUEvp6cIi3VMG3Cw_iY-5t9ds'
};
var PAGE=(location.pathname.split('/').pop()||'index.html').toLowerCase();
var MODULE_BY_PAGE={
  'index.html':'dashboard','inventory.html':'inventory','saldo-stok.html':'inventory','kartu-stok.html':'inventory','rubah-stok.html':'inventory','retur.html':'inventory',
  'kasir.html':'cashier','closing-kasir.html':'cashier','laporan.html':'report','finance.html':'finance','user-management.html':'users'
};
var ACCESS={
  OWNER:['dashboard','master','inventory','cashier','report','finance','users'],
  ADMIN:['dashboard','master','inventory','cashier','report','finance','users'],
  LEADER:['dashboard','inventory','cashier','report'],
  CASHIER:['dashboard','cashier'],
  FINANCE:['dashboard','finance','report'],
  INVENTORY:['dashboard','inventory'],
  STAFF:['dashboard']
};
function normalizeRole(v){
  v=String(v||'STAFF').trim().toUpperCase();
  var alias={OWNER:'OWNER',ADMIN:'ADMIN',LEADER:'LEADER',CASHIER:'CASHIER',KASIR:'CASHIER',FINANCE:'FINANCE',ACCOUNTING:'FINANCE',INVENTORY:'INVENTORY',GUDANG:'INVENTORY',STAFF:'STAFF'};
  return alias[v]||'STAFF';
}
function loadSupabase(){
  if(window.supabase&&window.supabase.createClient)return Promise.resolve();
  return new Promise(function(resolve,reject){
    var old=document.querySelector('script[data-systemq-auth-supabase]');
    if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return;}
    var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.async=true;s.dataset.systemqAuthSupabase='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
}
function moduleAllowed(role,module){return (ACCESS[role]||ACCESS.STAFF).indexOf(module)!==-1;}
function profileFromSession(user){
  return {name:(user.user_metadata&&user.user_metadata.full_name)||user.email||'SYSTEMQ USER',role:normalizeRole((user.app_metadata&&user.app_metadata.role)||(user.user_metadata&&user.user_metadata.role))};
}
function setSessionInfo(user,role,name){
  try{sessionStorage.setItem('systemq_auth_user',JSON.stringify({id:user.id,email:user.email||'',name:name||user.email||'',role:role}));}catch(e){}
}
function getBootstrapOwner(){
  try{
    var raw=sessionStorage.getItem('systemq_bootstrap_owner');
    if(!raw)return null;
    var x=JSON.parse(raw);
    if(x&&x.role==='OWNER'&&x.email==='owner@systemq.com')return x;
  }catch(e){}
  return null;
}
function injectBootstrapOwnerBar(owner){
  if(document.getElementById('systemqUserBar'))return;
  var bar=document.createElement('div');bar.id='systemqUserBar';
  bar.innerHTML='<span class="sq-user-dot"></span><div><b>'+escapeHtml(owner.name||'SYSTEMQ OWNER')+'</b><small>OWNER</small></div><button type="button" id="systemqLogout">LOGOUT</button>';
  var style=document.createElement('style');style.textContent='#systemqUserBar{position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;align-items:center;gap:9px;padding:9px 10px 9px 12px;background:#18222d;color:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.2);font:12px/1.2 Arial,sans-serif}#systemqUserBar .sq-user-dot{width:9px;height:9px;border-radius:50%;background:#49c47c;display:block}#systemqUserBar b{display:block;font-size:12px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#systemqUserBar small{display:block;opacity:.65;margin-top:2px;font-size:10px}#systemqLogout{margin-left:6px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;border-radius:9px;padding:7px 9px;font-size:10px;font-weight:800;cursor:pointer}';document.head.appendChild(style);document.body.appendChild(bar);
  document.getElementById('systemqLogout').onclick=function(){
    if(!confirm('Keluar dari SYSTEMQ?'))return;
    try{sessionStorage.removeItem('systemq_bootstrap_owner');sessionStorage.removeItem('systemq_auth_user');}catch(e){}
    location.replace('./login.html');
  };
}

function hideIndexModules(role){
  if(PAGE!=='index.html')return;
  var modules={master:'master',inventory:'inventory',cashier:'cashier',report:'report',finance:'finance'};
  Object.keys(modules).forEach(function(mod){
    var ok=moduleAllowed(role,mod);
    var sec=document.getElementById(modules[mod]); if(sec&&!ok)sec.style.display='none';
  });
  document.querySelectorAll('nav button').forEach(function(btn){
    var t=(btn.getAttribute('onclick')||'').match(/show\('([^']+)'\)/);
    if(t&&!moduleAllowed(role,t[1]))btn.style.display='none';
  });
}
function injectUserBar(client,user,role,name){
  if(document.getElementById('systemqUserBar'))return;
  var bar=document.createElement('div');bar.id='systemqUserBar';
  bar.innerHTML='<span class="sq-user-dot"></span><div><b>'+escapeHtml(name||user.email||'USER')+'</b><small>'+escapeHtml(role)+'</small></div><button type="button" id="systemqLogout">LOGOUT</button>';
  var style=document.createElement('style');style.textContent='#systemqUserBar{position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;align-items:center;gap:9px;padding:9px 10px 9px 12px;background:#18222d;color:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.2);font:12px/1.2 Arial,sans-serif}#systemqUserBar .sq-user-dot{width:9px;height:9px;border-radius:50%;background:#49c47c;display:block}#systemqUserBar b{display:block;font-size:12px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#systemqUserBar small{display:block;opacity:.65;margin-top:2px;font-size:10px}#systemqLogout{margin-left:6px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;border-radius:9px;padding:7px 9px;font-size:10px;font-weight:800;cursor:pointer}';document.head.appendChild(style);document.body.appendChild(bar);
  document.getElementById('systemqLogout').onclick=async function(){
    if(!confirm('Keluar dari SYSTEMQ?'))return;
    try{await client.auth.signOut();}catch(e){}
    try{sessionStorage.removeItem('systemq_auth_user');}catch(e){}
    location.replace('./login.html');
  };
}
function escapeHtml(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
async function resolveProfile(client,user){
  var fallback=profileFromSession(user);
  try{
    var r=await client.from('systemq_user_profiles').select('full_name,role,is_active').eq('id',user.id).maybeSingle();
    if(!r.error&&r.data){
      return {name:r.data.full_name||fallback.name,role:normalizeRole(r.data.role||fallback.role),is_active:r.data.is_active!==false};
    }
  }catch(e){}
  return fallback;
}
async function boot(){
  if(PAGE==='login.html')return;
  var bootstrapOwner=getBootstrapOwner();
  if(bootstrapOwner){
    setSessionInfo({id:'bootstrap-owner',email:bootstrapOwner.email},'OWNER',bootstrapOwner.name||'SYSTEMQ OWNER');
    hideIndexModules('OWNER');
    injectBootstrapOwnerBar(bootstrapOwner);
    return;
  }
  try{
    await loadSupabase();
    var client=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    var res=await client.auth.getSession();
    var session=res&&res.data&&res.data.session;
    if(!session||!session.user){location.replace('./login.html?next='+encodeURIComponent(PAGE));return;}
    var profile=await resolveProfile(client,session.user);
    setSessionInfo(session.user,profile.role,profile.name);
    if(profile.is_active===false){try{await client.auth.signOut();}catch(e){} alert('Akun Anda dinonaktifkan.');location.replace('./login.html');return;}
    var mod=MODULE_BY_PAGE[PAGE]||'dashboard';
    if(!moduleAllowed(profile.role,mod)){
      alert('Akses ditolak. Akun '+profile.role+' tidak memiliki akses ke halaman ini.');
      location.replace('./index.html');return;
    }
    hideIndexModules(profile.role);
    injectUserBar(client,session.user,profile.role,profile.name);
  }catch(e){
    console.warn('SYSTEMQ login check:',e&&e.message?e.message:e);
    location.replace('./login.html');
  }
}
boot();
})();
