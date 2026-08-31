(function(){
'use strict';
var MASTER_KEY='systemq_v17_data';
var GR_KEY='systemq_inventory_goods_receiving_v1';
var master={},docs=[],current=null;

function el(id){return document.getElementById(id);}
function text(v){return String(v===undefined||v===null?'':v);}
function esc(v){return text(v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
function load(){
  try{master=JSON.parse(localStorage.getItem(MASTER_KEY)||'{}');}catch(e){master={};}
  if(!master||typeof master!=='object')master={};
  if(!Array.isArray(master.supplier))master.supplier=[];
  try{docs=JSON.parse(localStorage.getItem(GR_KEY)||'[]');}catch(e){docs=[];}
  if(!Array.isArray(docs))docs=[];
}
function save(){localStorage.setItem(GR_KEY,JSON.stringify(docs));}
function supplierKey(s){return text(s&&(s.code||s.name)).trim();}
function supplierLabel(s){var c=text(s&&s.code).trim(),n=text(s&&s.name).trim();return c&&n?c+' - '+n:(n||c);}
function suppliers(){return master.supplier.filter(function(s){return !s.status||text(s.status).toUpperCase()==='ACTIVE';});}

function renderSupplier(selected){
  var select=el('grSupplier'),html='<option value="">-- PILIH SUPPLIER --</option>';
  suppliers().forEach(function(s){html+='<option value="'+esc(supplierKey(s))+'">'+esc(supplierLabel(s))+'</option>';});
  select.innerHTML=html;select.value=selected||'';
  if(suppliers().length===0){el('supplierWarning').textContent='Supplier belum ditemukan di Master Global. Tambahkan Supplier terlebih dahulu.';el('supplierWarning').classList.remove('hidden');}
  else el('supplierWarning').classList.add('hidden');
}
function show(view){
  ['listView','formView','importView'].forEach(function(id){el(id).classList.add('hidden');});
  el(view).classList.remove('hidden');
}
function showForm(){
  show('formView');renderSupplier(current?current.supplier:'');
  el('grDate').value=current&&current.date?current.date:new Date().toISOString().slice(0,10);
  el('grPL').value=current&&current.plNo?current.plNo:'';
  el('grNote').value=current&&current.note?current.note:'';
}
function newGR(){
  current={id:'GR-'+Date.now(),date:new Date().toISOString().slice(0,10),supplier:'',supplierName:'',plNo:'',note:'',items:[],status:'DRAFT',createdAt:new Date().toISOString()};
  showForm();
}
function backToList(){current=null;load();show('listView');renderList();}
function openDoc(id){
  load();current=null;
  docs.forEach(function(d){if(d.id===id)current=d;});
  if(!current){alert('Data Goods Receiving tidak ditemukan.');return;}
  if(Array.isArray(current.items)&&current.items.length)showImport();else showForm();
}
function renderList(){
  var body=el('listBody'),q=text(el('search').value).toLowerCase().trim();
  var rows=docs.filter(function(d){return (text(d.plNo)+' '+text(d.supplierName)+' '+text(d.date)).toLowerCase().indexOf(q)!==-1;});
  if(!rows.length){body.innerHTML='<tr><td colspan="6" class="empty">Belum ada Goods Receiving. Tekan NEW GOODS RECEIVING untuk membuat transaksi baru.</td></tr>';return;}
  body.innerHTML='';
  rows.forEach(function(d){
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+esc(d.date||'-')+'</td><td>'+esc(d.supplierName||'-')+'</td><td><b>'+esc(d.plNo||'-')+'</b></td><td>'+esc(d.note||'-')+'</td><td><span class="status">'+esc(d.status||'DRAFT')+'</span></td><td></td>';
    var btn=document.createElement('button');btn.type='button';btn.textContent='EDIT';btn.addEventListener('click',function(){openDoc(d.id);});
    tr.lastChild.appendChild(btn);body.appendChild(tr);
  });
}
function persistCurrent(){
  load();var found=false;
  for(var i=0;i<docs.length;i++){if(docs[i].id===current.id){docs[i]=current;found=true;break;}}
  if(!found)docs.unshift(current);save();
}
function saveDraft(){
  if(!current)return;
  var date=el('grDate').value,supplier=el('grSupplier').value,pl=el('grPL').value.trim(),note=el('grNote').value.trim();
  if(!date||!supplier||!pl){alert('Tanggal, Supplier, dan Nomor Packing List wajib diisi.');return;}
  var label=supplier;suppliers().forEach(function(s){if(supplierKey(s)===supplier)label=supplierLabel(s);});
  current.date=date;current.supplier=supplier;current.supplierName=label;current.plNo=pl;current.note=note;
  current.items=Array.isArray(current.items)?current.items:[];current.status='DRAFT';current.updatedAt=new Date().toISOString();
  persistCurrent();showImport();
}
function showImport(){
  if(!current)return;
  show('importView');
  el('importSub').textContent='PL '+current.plNo+' • '+current.supplierName;
  renderImport();
}
function normKey(k){return text(k).toLowerCase().replace(/[\s_\-\.]/g,'');}
function pick(row,names){
  var keys=Object.keys(row||{}),i,j,k,n;
  for(i=0;i<keys.length;i++){k=normKey(keys[i]);for(j=0;j<names.length;j++){n=normKey(names[j]);if(k===n)return row[keys[i]];}}
  return '';
}
function numberValue(v){var s=text(v).replace(/\./g,'').replace(',','.').replace(/[^\d.\-]/g,'');var n=Number(s);return isFinite(n)?n:0;}
function parseRows(rows){
  var items=[],errors=0;
  rows.forEach(function(row,index){
    var barcode=pick(row,['barcode','bar code','ean','upc','kode barcode','kodebarcode']);
    var sku=pick(row,['sku','kode sku','kodesku','item code','itemcode']);
    var qty=pick(row,['qty','quantity','qty pl','qtypl','jumlah','pcs']);
    barcode=text(barcode).trim();sku=text(sku).trim();qty=numberValue(qty);
    if(!barcode&& !sku && !qty)return;
    if(!barcode || qty<=0){errors++;return;}
    items.push({line:index+1,barcode:barcode,sku:sku,expectedQty:qty,scanQty:0});
  });
  return {items:items,errors:errors};
}
function renderImport(){
  var body=el('importBody'),items=(current&&Array.isArray(current.items))?current.items:[];
  el('continueScanBtn').disabled=!items.length;
  if(!items.length){body.innerHTML='<tr><td colspan="5" class="empty">Belum ada Packing List yang diimport.</td></tr>';el('importSummary').classList.add('hidden');return;}
  var total=0;body.innerHTML='';
  items.forEach(function(it,i){
    total+=Number(it.expectedQty)||0;
    body.innerHTML+='<tr><td>'+(i+1)+'</td><td><b>'+esc(it.barcode)+'</b></td><td>'+esc(it.sku||'-')+'</td><td>'+esc(it.expectedQty)+'</td><td class="ok">✓ SIAP SCAN</td></tr>';
  });
  el('importCount').textContent=items.length;el('importQty').textContent=total;el('importSummary').classList.remove('hidden');
}
function importFile(){
  var file=el('plFile').files[0];
  if(!file)return;
  el('fileName').textContent=file.name;
  if(typeof XLSX==='undefined'){el('importMessage').textContent='Library Excel belum termuat. Pastikan koneksi internet tersedia, lalu refresh halaman dan coba lagi.';el('importMessage').classList.remove('hidden');return;}
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var wb=XLSX.read(e.target.result,{type:'array'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var rows=XLSX.utils.sheet_to_json(ws,{defval:''});
      var result=parseRows(rows);
      if(!result.items.length){
        el('importMessage').textContent='Tidak ada data valid. Pastikan Excel memiliki kolom Barcode dan Qty dengan Qty lebih dari 0.';
        el('importMessage').classList.remove('hidden');return;
      }
      current.items=result.items;current.status='DRAFT - PL IMPORTED';current.importFile=file.name;current.importedAt=new Date().toISOString();
      persistCurrent();renderImport();
      el('importMessage').textContent='Import berhasil: '+result.items.length+' baris Packing List dimuat.'+(result.errors?' '+result.errors+' baris dilewati karena Barcode/Qty tidak valid.':'');
      el('importMessage').classList.remove('hidden');
    }catch(err){
      el('importMessage').textContent='File tidak dapat dibaca. Gunakan format .xlsx, .xls, atau .csv.';
      el('importMessage').classList.remove('hidden');
    }
  };
  reader.readAsArrayBuffer(file);
}
function continueScan(){if(!current||!current.items||!current.items.length)return;alert('Tahap berikutnya adalah SCAN BARANG. Kita akan membuat halaman scan dengan Qty PL, Qty Scan, dan Balance tanpa mengubah stok sampai Balance = 0 dan POSTING.');}
function bind(id,fn){var n=el(id);if(n)n.addEventListener('click',fn);}
function init(){
  load();show('listView');renderList();
  bind('newGRMain',newGR);bind('backTop',backToList);bind('cancelBtn',backToList);bind('saveBtn',saveDraft);
  bind('importBack',backToList);bind('replaceImportBtn',function(){el('plFile').click();});bind('continueScanBtn',continueScan);
  el('plFile').addEventListener('change',importFile);el('search').addEventListener('input',renderList);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();