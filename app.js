const KEY='systemq_master_v14';
const schemas={
 store:{title:'STORE',fields:[['code','KODE STORE','text',true],['name','NAMA STORE','text',true],['status','STATUS','select',false,['ACTIVE','INACTIVE']]]},
 guide:{title:'GUIDE',fields:[['code','KODE GUIDE','text',true],['name','NAMA GUIDE','text',true],['address','ALAMAT','text'],['phone','NO HP','text'],['commission','KOMISI %','number'],['status','STATUS','select',false,['ACTIVE','INACTIVE']]]},
 brand:{title:'BRAND',fields:[['code','KODE BRAND','text',true],['name','NAMA BRAND','text',true],['supplier','KODE / NAMA SUPPLIER','text'],['newArrival','NEW ARRIVAL','select',false,['YA','TIDAK']],['discount','DISKON %','number'],['margin','MARGIN','number'],['status','STATUS','select',false,['ACTIVE','INACTIVE']]]},
 spare:{title:'SPARE',fields:[['code','KODE SPARE','text',true],['name','JENIS SPARE','text',true],['status','STATUS','select',false,['ACTIVE','INACTIVE']]]},
 color:{title:'WARNA',fields:[['code','KODE WARNA','text',true],['name','NAMA WARNA','text',true],['status','STATUS','select',false,['ACTIVE','INACTIVE']]]},
 size:{title:'KOLOM SIZE',fields:[['code','KODE SIZE','text',true],['type','JENIS SIZE','text',true],['sizes','DAFTAR SIZE (pisahkan dengan koma)','text',true],['status','STATUS','select',false,['ACTIVE','INACTIVE']]]},
 product:{title:'MASTER BARANG',fields:[['brand','BRAND','text',true],['sku','SKU','text',true],['name','NAMA BARANG','text',true],['barcode','BARCODE','text'],['spare','SPARE','text'],['color','WARNA','text'],['price','HARGA JUAL','number'],['discount','DISKON %','number'],['size','SIZE','text'],['status','STATUS','select',false,['ACTIVE','INACTIVE']]]}
};

let db=JSON.parse(localStorage.getItem(KEY)||'{}');
Object.keys(schemas).forEach(k=>db[k]??=[]);
let current='store', selected=null, editing=null;

function persist(){localStorage.setItem(KEY,JSON.stringify(db))}
function openSection(id){document.querySelectorAll('.section').forEach(x=>x.classList.add('hidden'));document.getElementById(id).classList.remove('hidden')}
function selectMaster(type){
 current=type;selected=null;editing=null;
 document.querySelectorAll('#masterTabs button').forEach(b=>b.classList.toggle('active',b.dataset.type===type));
 document.getElementById('specialProductTools').classList.toggle('hidden',type!=='product');
 document.getElementById('searchInput').value='';
 renderTable();
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function display(v,key){
 if(v===undefined||v===null||v==='')return '-';
 if(key==='price')return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);
 if(key==='discount'||key==='commission')return `${v}%`;
 return esc(v);
}
function renderTable(){
 const s=schemas[current], q=document.getElementById('searchInput').value.toLowerCase();
 document.getElementById('tableHead').innerHTML='<tr>'+s.fields.map(f=>`<th>${f[1]}</th>`).join('')+'</tr>';
 const data=db[current].filter(r=>Object.values(r).join(' ').toLowerCase().includes(q));
 document.getElementById('counter').textContent=`${data.length} DATA`;
 const body=document.getElementById('tableBody');
 body.innerHTML=data.length?data.map(r=>{
   const idx=db[current].indexOf(r);
   return `<tr class="${selected===idx?'selected':''}" onclick="selectRow(${idx})">`+
   s.fields.map(f=>`<td class="${f[0]==='status'?(r[f[0]]==='ACTIVE'?'status-active':'status-inactive'):''}">${display(r[f[0]],f[0])}</td>`).join('')+'</tr>';
 }).join(''):`<tr><td class="empty" colspan="${s.fields.length}">Belum ada data. Tekan ADD untuk menambahkan.</td></tr>`;
 updateStoreContext();
}
function selectRow(i){selected=i;renderTable()}
function addRecord(){editing=null;openModal()}
function editSelected(){if(selected===null)return alert('Pilih satu baris data terlebih dahulu.');editing=selected;openModal()}
function openModal(){
 const s=schemas[current], r=editing===null?{}:db[current][editing];
 document.getElementById('modalTitle').textContent=(editing===null?'Tambah ':'Update ')+s.title;
 document.getElementById('recordForm').innerHTML='<div class="form-grid">'+s.fields.map(f=>{
   const [key,label,type,required,opts]=f;
   if(type==='select')return `<div class="field"><label>${label}</label><select name="${key}">${(opts||[]).map(o=>`<option ${r[key]===o?'selected':''}>${o}</option>`).join('')}</select></div>`;
   return `<div class="field ${key==='name'?'full':''}"><label>${label}${required?' *':''}</label><input name="${key}" type="${type||'text'}" value="${esc(r[key]||'')}" ${required?'required':''}></div>`;
 }).join('')+'</div>';
 document.getElementById('modalBg').classList.remove('hidden');
}
function closeModal(){document.getElementById('modalBg').classList.add('hidden')}
function saveRecord(e){
 e.preventDefault();const fd=new FormData(e.target),r={};
 schemas[current].fields.forEach(f=>r[f[0]]=String(fd.get(f[0])??'').trim());
 const key=current==='product'?'sku':'code';
 if(db[current].some((x,i)=>x[key].toLowerCase()===r[key].toLowerCase()&&i!==editing))return alert(`${key.toUpperCase()} sudah digunakan.`);
 if(editing===null)db[current].push(r);else db[current][editing]=r;
 selected=null;persist();closeModal();renderTable();
}
function deleteSelected(){
 if(selected===null)return alert('Pilih data yang ingin dihapus.');
 if(confirm('Hapus data yang dipilih?')){db[current].splice(selected,1);selected=null;persist();renderTable()}
}
function closeMaster(){openSection('master');selected=null;alert('KELUAR dari pilihan '+schemas[current].title);}
function exportExcel(){
 const s=schemas[current], rows=[s.fields.map(f=>f[1]),...db[current].map(r=>s.fields.map(f=>r[f[0]]??''))];
 const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
 const blob=new Blob(["\ufeff"+csv],{type:'text/csv;charset=utf-8;'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=`SYSTEMQ_${current.toUpperCase()}.csv`;a.click();URL.revokeObjectURL(a.href);
}
function bulkDiscount(){
 if(!db.product.length)return alert('Belum ada barang.');
 const v=prompt('Masukkan diskon baru (%) untuk semua barang yang dipilih melalui filter/semua data.\nUntuk versi sederhana sekarang: berlaku untuk semua MASTER BARANG.', '');
 if(v===null)return;const n=Number(v);if(Number.isNaN(n)||n<0||n>100)return alert('Diskon harus 0 sampai 100.');
 db.product.forEach(p=>p.discount=n);persist();renderTable();alert('Diskon berhasil diperbarui.');
}
function importCSV(ev){
 const f=ev.target.files[0];if(!f)return;
 const reader=new FileReader();
 reader.onload=()=>{try{
   const lines=String(reader.result).replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(Boolean);
   if(lines.length<2)return alert('File CSV kosong.');
   const headers=lines.shift().split(',').map(x=>x.trim().replace(/^"|"$/g,'').toLowerCase());
   let count=0;
   lines.forEach(line=>{
     const vals=line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)||line.split(',');
     const r={};schemas[current].fields.forEach(f=>{let i=headers.indexOf(f[0]);if(i<0)i=headers.indexOf(f[1].toLowerCase());r[f[0]]=String(vals[i]??'').replace(/^"|"$/g,'').trim()});
     if(Object.values(r).some(Boolean)){db[current].push(r);count++}
   });
   persist();renderTable();alert(`${count} data berhasil diimport.`);
 }catch(err){alert('Format CSV tidak bisa dibaca.')}}
 reader.readAsText(f);ev.target.value='';
}
function updateNewMaster(){
 if(current!=='product')return;
 const missing=[];
 db.brand.forEach(b=>{if(b.name&&!db.product.some(p=>p.brand.toLowerCase()===b.name.toLowerCase()))missing.push(b.name)});
 alert(missing.length?'Master terbaru terdeteksi. Brand yang belum dipakai produk: '+missing.join(', '):'Master sudah tersinkron dengan data saat ini.');
}
function showProducts(){selectMaster('product')}
function updateStoreContext(){
 const active=db.store.find(s=>s.status==='ACTIVE');
 document.getElementById('storeContext').textContent=active?`${active.code} - ${active.name}`:'BELUM ADA STORE ACTIVE';
}
selectMaster('store');
