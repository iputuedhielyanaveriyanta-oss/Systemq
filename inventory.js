(function(){
'use strict';
var MASTER_KEY='systemq_v17_data';
var GR_KEY='systemq_inventory_goods_receiving_v1';
var master={};
var docs=[];
var current=null;

function el(id){return document.getElementById(id);}
function text(v){return String(v===undefined||v===null?'':v);}
function esc(v){return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function load(){
  try{master=JSON.parse(localStorage.getItem(MASTER_KEY)||'{}');}catch(e){master={};}
  if(!master||typeof master!=='object')master={};
  if(!Array.isArray(master.supplier))master.supplier=[];
  try{docs=JSON.parse(localStorage.getItem(GR_KEY)||'[]');}catch(e){docs=[];}
  if(!Array.isArray(docs))docs=[];
}
function save(){localStorage.setItem(GR_KEY,JSON.stringify(docs));}
function supplierKey(s){return text(s&& (s.code||s.name)).trim();}
function supplierLabel(s){
  var code=text(s&&s.code).trim(), name=text(s&&s.name).trim();
  return code&&name?code+' - '+name:(name||code);
}
function suppliers(){
  return master.supplier.filter(function(s){
    return !s.status || text(s.status).toUpperCase()==='ACTIVE';
  });
}
function renderSupplier(selected){
  var select=el('grSupplier');
  if(!select)return;
  var html='<option value="">-- PILIH SUPPLIER --</option>';
  suppliers().forEach(function(s){
    html+='<option value="'+esc(supplierKey(s))+'">'+esc(supplierLabel(s))+'</option>';
  });
  select.innerHTML=html;
  select.value=selected||'';
  var warning=el('supplierWarning');
  if(suppliers().length===0){
    warning.textContent='Supplier belum ditemukan di Master Global. Tambahkan Supplier terlebih dahulu di Master Global.';
    warning.classList.remove('hidden');
  }else warning.classList.add('hidden');
}
function showForm(){
  el('listView').classList.add('hidden');
  el('formView').classList.remove('hidden');
  renderSupplier(current?current.supplier:'');
  el('grDate').value=current&&current.date?current.date:new Date().toISOString().slice(0,10);
  el('grPL').value=current&&current.plNo?current.plNo:'';
  el('grNote').value=current&&current.note?current.note:'';
}
function newGR(){
  current={id:'GR-'+Date.now(),date:new Date().toISOString().slice(0,10),supplier:'',supplierName:'',plNo:'',note:'',items:[],status:'DRAFT',createdAt:new Date().toISOString()};
  showForm();
}
function back(){
  current=null;
  el('formView').classList.add('hidden');
  el('listView').classList.remove('hidden');
  load();renderList();
}
function openDoc(id){
  load();
  for(var i=0;i<docs.length;i++){if(docs[i].id===id){current=docs[i];break;}}
  if(!current){alert('Data Goods Receiving tidak ditemukan.');return;}
  showForm();
}
function renderList(){
  var body=el('listBody'), q=text(el('search').value).toLowerCase().trim();
  var rows=docs.filter(function(d){return (text(d.plNo)+' '+text(d.supplierName)+' '+text(d.date)).toLowerCase().indexOf(q)!==-1;});
  if(!rows.length){body.innerHTML='<tr><td colspan="6" class="empty">Belum ada Goods Receiving. Tekan NEW GOODS RECEIVING untuk membuat transaksi baru.</td></tr>';return;}
  body.innerHTML='';
  rows.forEach(function(d){
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+esc(d.date||'-')+'</td><td>'+esc(d.supplierName||'-')+'</td><td><b>'+esc(d.plNo||'-')+'</b></td><td>'+esc(d.note||'-')+'</td><td><span class="status">'+esc(d.status||'DRAFT')+'</span></td><td></td>';
    var btn=document.createElement('button');btn.type='button';btn.textContent='EDIT';
    btn.addEventListener('click',function(){openDoc(d.id);});
    tr.lastChild.appendChild(btn);body.appendChild(tr);
  });
}
function saveDraft(){
  if(!current)return;
  var date=el('grDate').value;
  var supplier=el('grSupplier').value;
  var pl=el('grPL').value.trim();
  var note=el('grNote').value.trim();
  if(!date||!supplier||!pl){alert('Tanggal, Supplier, dan Nomor Packing List wajib diisi.');return;}
  var label=supplier;
  suppliers().forEach(function(s){if(supplierKey(s)===supplier)label=supplierLabel(s);});
  current.date=date;current.supplier=supplier;current.supplierName=label;current.plNo=pl;current.note=note;current.status='DRAFT';current.updatedAt=new Date().toISOString();
  load();
  var found=false;
  for(var i=0;i<docs.length;i++){if(docs[i].id===current.id){docs[i]=current;found=true;break;}}
  if(!found)docs.unshift(current);
  save();
  alert('HEADER GOODS RECEIVING BERHASIL DISIMPAN SEBAGAI DRAFT.');
  back();
}
function bind(id,fn){var node=el(id);if(node)node.addEventListener('click',fn);}
function init(){
  load();renderList();
  bind('newGRTop',newGR);bind('newGRMain',newGR);
  bind('backTop',back);bind('cancelBtn',back);bind('saveBtn',saveDraft);
  el('search').addEventListener('input',renderList);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('error',function(e){console.error('Inventory error',e.error||e.message);});
})();