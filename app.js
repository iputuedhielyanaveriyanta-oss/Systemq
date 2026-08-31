const STORAGE_KEY = 'systemq_v18_data';
const LEGACY_KEYS = ['systemq_v17_data','systemq_v16_data'];

const SCHEMA = {
  store:{title:'STORE',fields:[['code','KODE STORE'],['name','NAMA STORE'],['status','STATUS','select',['ACTIVE','INACTIVE']]]},
  guide:{title:'GUIDE',fields:[['code','KODE GUIDE'],['name','NAMA GUIDE'],['address','ALAMAT'],['phone','NO HP'],['commission','KOMISI %'],['status','STATUS','select',['ACTIVE','INACTIVE']]]},
  supplier:{title:'SUPPLIER',fields:[['code','KODE SUPPLIER'],['name','NAMA SUPPLIER'],['address','ALAMAT'],['phone','NO HP'],['status','STATUS','select',['ACTIVE','INACTIVE']]]},
  brand:{title:'BRAND',fields:[['code','KODE BRAND'],['name','NAMA BRAND'],['supplier','SUPPLIER','dynamic','supplier'],['status','STATUS','select',['ACTIVE','INACTIVE']]]},
  spare:{title:'SPARE',fields:[['code','KODE SPARE'],['name','JENIS SPARE'],['status','STATUS','select',['ACTIVE','INACTIVE']]]},
  color:{title:'WARNA',fields:[['code','KODE WARNA'],['name','NAMA WARNA'],['status','STATUS','select',['ACTIVE','INACTIVE']]]},
  size:{title:'KOLOM SIZE',fields:[['code','KODE SIZE'],['type','JENIS SIZE'],['sizes','DAFTAR SIZE (pisahkan dengan koma)'],['status','STATUS','select',['ACTIVE','INACTIVE']]]},
  product:{title:'MASTER BARANG',fields:[['brand','BRAND','dynamic','brand'],['supplier','SUPPLIER','dynamic','supplier'],['sku','SKU'],['name','NAMA BARANG'],['barcode','BARCODE'],['spare','SPARE','dynamic','spare'],['color','WARNA','dynamic','color'],['price','HARGA JUAL'],['discount','DISKON %'],['size','SIZE','dynamic','size'],['status','STATUS','select',['ACTIVE','INACTIVE']]]}
};

let db = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
if (!db) {
  for (const key of LEGACY_KEYS) { const old=localStorage.getItem(key); if(old){ try{ db=JSON.parse(old); break; }catch(e){} } }
}
if (!db || typeof db !== 'object') db={};
Object.keys(SCHEMA).forEach(key=>{if(!Array.isArray(db[key])) db[key]=[];});
if(!db.brandPromos || typeof db.brandPromos!=='object') db.brandPromos={};

let currentType='store', selectedIndex=null, editingIndex=null;
let currentBrandIndex=null, editingPromoIndex=null;
function $(id){return document.getElementById(id)}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(db))}
function currentSchema(){return SCHEMA[currentType]}
function currentFields(){return currentSchema().fields}
function title(){return currentSchema().title}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
function brandKey(brand,index=currentBrandIndex){return brand && (brand.code||brand.name) ? String(brand.code||brand.name) : 'brand_'+index}

function migrateLegacyBrandPromos(){
  db.brand.forEach((brand,i)=>{
    const key=brandKey(brand,i);
    if(!Array.isArray(db.brandPromos[key])) db.brandPromos[key]=[];
    if(db.brandPromos[key].length===0 && (brand.newArrival||brand.discount||brand.margin)){
      if(String(brand.newArrival||'').toUpperCase()==='YA') db.brandPromos[key].push({group:'',promo:'New Arrival',discount:'',margin:'',status:'ACTIVE'});
      if(brand.discount||brand.margin) db.brandPromos[key].push({group:'',promo:'Diskon '+(brand.discount||''),discount:String(brand.discount||''),margin:String(brand.margin||''),status:'ACTIVE'});
    }
  });
  persist();
}

function show(id){document.querySelectorAll('main section').forEach(s=>s.classList.add('hidden')); const t=$(id); if(t)t.classList.remove('hidden')}
function setType(v){currentType=v;selectedIndex=null;editingIndex=null; const pt=$('productTools'); if(pt)pt.classList.toggle('hidden',v!=='product'); $('tableTitle').textContent=title(); $('search').value=''; render()}

function render(){
  const q=($('search').value||'').toLowerCase().trim();
  const rows=db[currentType].filter(r=>Object.values(r).join(' ').toLowerCase().includes(q));
  const extra=currentType==='brand'?'<th>DETAIL</th>':'';
  $('head').innerHTML='<tr>'+currentFields().map(f=>'<th>'+esc(f[1])+'</th>').join('')+extra+'</tr>';
  if(!rows.length){$('body').innerHTML='<tr><td colspan="'+(currentFields().length+(currentType==='brand'?1:0))+'" style="text-align:center;padding:35px;color:#77838e">Belum ada data. Tekan ADD untuk menambahkan.</td></tr>'}
  else {
    $('body').innerHTML=rows.map(r=>{const i=db[currentType].indexOf(r); const cells=currentFields().map(f=>'<td>'+esc(r[f[0]]||'-')+'</td>').join(''); const detail=currentType==='brand'?'<td><button class="small" onclick="event.stopPropagation();openBrandDetail('+i+')">LIHAT PROMO</button></td>':''; return '<tr class="'+(i===selectedIndex?'selected':'')+'" data-index="'+i+'">'+cells+detail+'</tr>'}).join('');
    $('body').querySelectorAll('tr[data-index]').forEach(row=>row.addEventListener('click',()=>{const i=Number(row.dataset.index); if(currentType==='brand'){openBrandDetail(i)}else{selectedIndex=i;render()}}));
  }
  $('count').textContent=rows.length+' DATA';
}
function activeRecords(type){return(db[type]||[]).filter(x=>!x.status||x.status==='ACTIVE')}
function dynamicOptions(source){
  if(source==='size'){const a=[];activeRecords('size').forEach(x=>String(x.sizes||'').split(',').forEach(s=>{s=s.trim();if(s&&!a.includes(s))a.push(s)}));return a.map(x=>({value:x,label:x}))}
  return activeRecords(source).map(x=>({value:x.name||x.code||'',label:x.code&&x.name?x.code+' - '+x.name:(x.name||x.code||'')})).filter(x=>x.value)
}
function renderDynamicSelect(f,v){const opts=dynamicOptions(f[3]); let h='<select name="'+esc(f[0])+'"><option value="">-- PILIH '+esc(f[1])+' --</option>'; if(v&&!opts.some(o=>o.value===v))h+='<option selected value="'+esc(v)+'">'+esc(v)+'</option>'; h+=opts.map(o=>'<option value="'+esc(o.value)+'"'+(v===o.value?' selected':'')+'>'+esc(o.label)+'</option>').join(''); return h+'</select>'}
function add(){editingIndex=null;openForm()}
function edit(){if(selectedIndex===null)return alert('Pilih satu data terlebih dahulu.');editingIndex=selectedIndex;openForm()}
function openForm(){const r=editingIndex===null?{}:db[currentType][editingIndex];$('modalTitle').textContent=(editingIndex===null?'Tambah ':'Update ')+title();$('form').innerHTML=currentFields().map(f=>{const v=r[f[0]]||'';let c;if(f[2]==='select')c='<select name="'+esc(f[0])+'">'+f[3].map(o=>'<option value="'+esc(o)+'"'+(v===o?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select>';else if(f[2]==='dynamic')c=renderDynamicSelect(f,v);else c='<input type="'+(['commission','discount','margin','price'].includes(f[0])?'number':'text')+'" name="'+esc(f[0])+'" value="'+esc(v)+'">';return '<div class="field"><label>'+esc(f[1])+'</label>'+c+'</div>'}).join('')+'<button class="orange" type="submit">SIMPAN</button>';$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
function save(e){e.preventDefault();const fd=new FormData($('form')),r={};currentFields().forEach(f=>r[f[0]]=String(fd.get(f[0])||'').trim());const key=currentType==='product'?'sku':'code';if(r[key]){const dup=db[currentType].some((x,i)=>String(x[key]||'').toLowerCase()===r[key].toLowerCase()&&i!==editingIndex);if(dup)return alert(key.toUpperCase()+' sudah digunakan.')}if(editingIndex===null)db[currentType].push(r);else db[currentType][editingIndex]=r;selectedIndex=null;editingIndex=null;persist();closeModal();render()}
function del(){if(selectedIndex===null)return alert('Pilih data terlebih dahulu.');if(!confirm('Hapus data yang dipilih?'))return;db[currentType].splice(selectedIndex,1);selectedIndex=null;persist();render()}

function openBrandDetail(i){currentBrandIndex=i; const b=db.brand[i]; if(!b)return; const key=brandKey(b,i); if(!Array.isArray(db.brandPromos[key]))db.brandPromos[key]=[]; $('brandDetailTitle').textContent='BRAND: '+(b.name||b.code||''); $('brandDetailInfo').innerHTML='<b>KODE BRAND:</b> '+esc(b.code||'-')+' &nbsp; <b>SUPPLIER:</b> '+esc(b.supplier||'-')+' &nbsp; <b>STATUS:</b> '+esc(b.status||'-'); renderBrandPromos(); $('brandDetail').classList.remove('hidden')}
function closeBrandDetail(){$('brandDetail').classList.add('hidden');currentBrandIndex=null;editingPromoIndex=null;render()}
function currentBrand(){return currentBrandIndex===null?null:db.brand[currentBrandIndex]}
function currentPromoList(){const b=currentBrand();if(!b)return[];const k=brandKey(b,currentBrandIndex);if(!Array.isArray(db.brandPromos[k]))db.brandPromos[k]=[];return db.brandPromos[k]}
function renderBrandPromos(){const list=currentPromoList();$('brandPromoBody').innerHTML=list.length?list.map((x,i)=>'<tr><td>'+esc(x.group||'-')+'</td><td>'+esc(x.promo||'-')+'</td><td>'+esc(x.discount||'-')+'</td><td>'+esc(x.margin||'-')+'</td><td>'+esc(x.status||'-')+'</td><td><button class="small" onclick="editBrandPromo('+i+')">✎ EDIT</button> <button class="small red" onclick="deleteBrandPromo('+i+')">DELETE</button></td></tr>').join(''):'<tr><td colspan="6" style="text-align:center;padding:30px;color:#77838e">Belum ada promo. Klik TAMBAH PROMO / MARGIN.</td></tr>'}
function editCurrentBrand(){if(currentBrandIndex===null)return;$('brandDetail').classList.add('hidden');currentType='brand';selectedIndex=currentBrandIndex;editingIndex=currentBrandIndex;openForm()}
function addBrandPromo(){editingPromoIndex=null;openBrandPromoForm()}
function editBrandPromo(i){editingPromoIndex=i;openBrandPromoForm()}
function openBrandPromoForm(){const list=currentPromoList();const r=editingPromoIndex===null?{group:'',promo:'',discount:'',margin:'',status:'ACTIVE'}:list[editingPromoIndex];$('modalTitle').textContent=editingPromoIndex===null?'Tambah Promo / Margin':'Edit Promo / Margin';$('form').innerHTML=`
<div class="field"><label>KELOMPOK</label><input name="group" value="${esc(r.group||'')}" placeholder="Kosongkan bila tidak perlu"></div>
<div class="field"><label>PROMO</label><input name="promo" value="${esc(r.promo||'')}" placeholder="Contoh: New Arrival / Diskon 30"></div>
<div class="field"><label>DISKON %</label><input type="number" name="discount" value="${esc(r.discount||'')}" placeholder="Contoh: 30"></div>
<div class="field"><label>MARGIN</label><input type="number" name="margin" value="${esc(r.margin||'')}" placeholder="Contoh: 27"></div>
<div class="field"><label>STATUS</label><select name="status"><option ${r.status==='ACTIVE'?'selected':''}>ACTIVE</option><option ${r.status==='INACTIVE'?'selected':''}>INACTIVE</option></select></div>
<button class="orange" type="submit">SIMPAN</button>`;
$('form').onsubmit=saveBrandPromo;$('modal').classList.remove('hidden')}
function saveBrandPromo(e){e.preventDefault();const fd=new FormData($('form'));const r={group:String(fd.get('group')||'').trim(),promo:String(fd.get('promo')||'').trim(),discount:String(fd.get('discount')||'').trim(),margin:String(fd.get('margin')||'').trim(),status:String(fd.get('status')||'ACTIVE')};if(!r.promo)return alert('PROMO wajib diisi.');const list=currentPromoList();if(editingPromoIndex===null)list.push(r);else list[editingPromoIndex]=r;persist();editingPromoIndex=null;$('form').onsubmit=save;closeModal();$('brandDetail').classList.remove('hidden');renderBrandPromos()}
function deleteBrandPromo(i){if(!confirm('Hapus promo ini?'))return;currentPromoList().splice(i,1);persist();renderBrandPromos()}

function exportData(){const rows=[currentFields().map(f=>f[1]),...db[currentType].map(r=>currentFields().map(f=>r[f[0]]||''))];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SYSTEMQ_'+currentType.toUpperCase()+'.csv';a.click();URL.revokeObjectURL(a.href)}
function discount(){if(currentType!=='product')return alert('Fitur ini hanya untuk MASTER BARANG.');const v=prompt('Masukkan diskon baru (%) untuk semua Master Barang:','');if(v===null)return;const n=Number(v);if(!Number.isFinite(n)||n<0||n>100)return alert('Diskon harus antara 0 sampai 100.');db.product.forEach(x=>x.discount=String(n));persist();render();alert('Diskon berhasil diperbarui.')}
function importCSV(e){const file=e.target.files&&e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const text=String(reader.result||'').replace(/^\uFEFF/,'').trim();if(!text)return alert('File kosong.');const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2)return alert('CSV harus memiliki header dan minimal satu data.');const headers=parseCSVLine(lines.shift()).map(x=>x.trim().toLowerCase());let imported=0;lines.forEach(line=>{const vals=parseCSVLine(line),r={};currentFields().forEach(f=>{let i=headers.indexOf(f[0].toLowerCase());if(i<0)i=headers.indexOf(f[1].toLowerCase());r[f[0]]=i>=0?String(vals[i]||'').trim():''});if(Object.values(r).some(Boolean)){db[currentType].push(r);imported++}});persist();render();alert(imported+' data berhasil diimport.')};reader.readAsText(file);e.target.value=''}
function parseCSVLine(line){const r=[];let c='',q=false;for(let i=0;i<line.length;i++){const x=line[i];if(x==='"'){if(q&&line[i+1]==='"'){c+='"';i++}else q=!q}else if(x===','&&!q){r.push(c);c=''}else c+=x}r.push(c);return r}

document.addEventListener('DOMContentLoaded',()=>{migrateLegacyBrandPromos();$('form').addEventListener('submit',save);setType('store')});
