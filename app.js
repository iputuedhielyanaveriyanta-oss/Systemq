function login(){
  const u=document.getElementById('username').value.trim()||'EDHY';
  document.getElementById('userLabel').textContent=u.toUpperCase();
  document.getElementById('avatar').textContent=u.charAt(0).toUpperCase();
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}
function showPage(id,btn){
  document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('crumb').textContent=id==='home'?'MENU UTAMA':id==='stores'?'MASTER / STORE':id.toUpperCase();
  document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
  if(btn)btn.classList.add('active');
}
function openFinance(){document.getElementById('financeModal').classList.remove('hidden')}
function closeFinance(){document.getElementById('financeModal').classList.add('hidden')}
function unlockFinance(){closeFinance();showPage('finance');document.getElementById('crumb').textContent='FINANCE & ACCOUNTING'}
document.querySelectorAll('.pin input').forEach((el,i,arr)=>el.addEventListener('input',()=>{if(el.value&&arr[i+1])arr[i+1].focus()}));
document.getElementById('password').addEventListener('keydown',e=>{if(e.key==='Enter')login()});

const stores = [
  {code:'KTA01',name:'SURF WAREHOUSE KUTA',status:'ACTIVE'},
  {code:'SMY01',name:'SURF WAREHOUSE SEMINYAK',status:'ACTIVE'},
  {code:'CGG01',name:'SURF WAREHOUSE CANGGU',status:'ACTIVE'}
];

function openStoreForm(){document.getElementById('storeFormModal').classList.remove('hidden')}
function closeStoreForm(){document.getElementById('storeFormModal').classList.add('hidden')}
function addStore(){
  const code=document.getElementById('newStoreCode').value.trim().toUpperCase();
  const name=document.getElementById('newStoreName').value.trim().toUpperCase();
  const status=document.getElementById('newStoreStatus').value;
  if(!code||!name){alert('Kode Store dan Nama Store wajib diisi.');return}
  if(stores.some(s=>s.code===code)){alert('Kode Store sudah digunakan.');return}
  stores.push({code,name,status});
  renderStores();
  document.getElementById('newStoreCode').value='';
  document.getElementById('newStoreName').value='';
  closeStoreForm();
}
function renderStores(){
  const table=document.getElementById('storeTable');
  if(table) table.innerHTML=stores.map(s=>`<tr><td><b>${s.code}</b></td><td>${s.name}</td><td class="${s.status==='ACTIVE'?'stock-ok':'stock-low'}">● ${s.status}</td><td><button class="btn light" onclick="setActiveStore('${s.code}','${s.name}')">PILIH</button></td></tr>`).join('');
}
function setActiveStore(code,name){
  document.getElementById('activeStoreCode').textContent=code;
  document.getElementById('activeStoreName').textContent=name;
  closeStoreSelector();
  const subtitle=[...document.querySelectorAll('#cashier .subtitle')][0];
  if(subtitle) subtitle.textContent=`STORE: ${code} — ${name} • KASIR: ${document.getElementById('userLabel').textContent}`;
}
function openStoreSelector(){
  const list=document.getElementById('storeSelectorList');
  list.innerHTML=stores.filter(s=>s.status==='ACTIVE').map(s=>`<button class="btn light" style="width:100%;text-align:left;margin:6px 0" onclick="setActiveStore('${s.code}','${s.name}')"><b>${s.code}</b><br><small>${s.name}</small></button>`).join('');
  document.getElementById('storeSelectorModal').classList.remove('hidden');
}
function closeStoreSelector(){document.getElementById('storeSelectorModal').classList.add('hidden')}