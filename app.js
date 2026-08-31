const K='systemq_v15',S={
store:['STORE',[['code','KODE STORE'],['name','NAMA STORE'],['status','STATUS']]],
guide:['GUIDE',[['code','KODE GUIDE'],['name','NAMA GUIDE'],['address','ALAMAT'],['phone','NO HP'],['commission','KOMISI %'],['status','STATUS']]],
brand:['BRAND',[['code','KODE BRAND'],['name','NAMA BRAND'],['supplier','SUPPLIER'],['newArrival','NEW ARRIVAL'],['discount','DISKON %'],['margin','MARGIN'],['status','STATUS']]],
spare:['SPARE',[['code','KODE SPARE'],['name','JENIS SPARE'],['status','STATUS']]],
color:['WARNA',[['code','KODE WARNA'],['name','NAMA WARNA'],['status','STATUS']]],
size:['KOLOM SIZE',[['code','KODE SIZE'],['type','JENIS SIZE'],['sizes','DAFTAR SIZE'],['status','STATUS']]],
product:['MASTER BARANG',[['brand','BRAND'],['sku','SKU'],['name','NAMA BARANG'],['barcode','BARCODE'],['spare','SPARE'],['color','WARNA'],['price','HARGA JUAL'],['discount','DISKON %'],['size','SIZE'],['status','STATUS']]]
};let db=JSON.parse(localStorage.getItem(K)||'{}'),type='store',sel=null,editIdx=null;Object.keys(S).forEach(x=>db[x]??=[]);
const saveDB=()=>localStorage.setItem(K,JSON.stringify(db));const title=()=>S[type][0];const fields=()=>S[type][1];
function show(id){document.querySelectorAll('main section').forEach(x=>x.classList.add('hidden'));document.getElementById(id).classList.remove('hidden')}
function setType(x){type=x;sel=null;editIdx=null;document.getElementById('productTools').classList.toggle('hidden',x!=='product');document.getElementById('tableTitle').textContent=title();render()}
function render(){let q=document.getElementById('search').value.toLowerCase(),rows=db[type].filter(r=>Object.values(r).join(' ').toLowerCase().includes(q));head.innerHTML='<tr>'+fields().map(f=>'<th>'+f[1]+'</th>').join('')+'</tr>';body.innerHTML=rows.length?rows.map(r=>{let i=db[type].indexOf(r);return '<tr class="'+(i===sel?'selected':'')+'" onclick="pick('+i+')">'+fields().map(f=>'<td>'+((r[f[0]]??'')||'-')+'</td>').join('')+'</tr>'}).join(''):'<tr><td colspan="'+fields().length+'" style="text-align:center;padding:35px;color:#77838e">Belum ada data. Tekan ADD untuk menambahkan.</td></tr>';count.textContent=rows.length+' DATA'}
function pick(i){sel=i;render()}
function add(){editIdx=null;openForm()}
function edit(){if(sel===null)return alert('Pilih satu data terlebih dahulu');editIdx=sel;openForm()}
function openForm(){let r=editIdx===null?{}:db[type][editIdx];modalTitle.textContent=(editIdx===null?'Tambah ':'Update ')+title();form.innerHTML=fields().map(f=>{let v=r[f[0]]||'';let opts=f[0]==='status'?'<option '+(v==='ACTIVE'?'selected':'')+'>ACTIVE</option><option '+(v==='INACTIVE'?'selected':'')+'>INACTIVE</option>':'';return '<div class="field"><label>'+f[1]+'</label>'+(opts?'<select name="'+f[0]+'">'+opts+'</select>':'<input name="'+f[0]+'" value="'+String(v).replaceAll('"','&quot;')+'">')+'</div>'}).join('')+'<button class="orange" type="submit">SIMPAN</button>';modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden')}
function save(e){e.preventDefault();let fd=new FormData(form),r={};fields().forEach(f=>r[f[0]]=String(fd.get(f[0])||'').trim());let key=type==='product'?'sku':'code';if(r[key]&&db[type].some((x,i)=>x[key]===r[key]&&i!==editIdx))return alert(key.toUpperCase()+' sudah digunakan');if(editIdx===null)db[type].push(r);else db[type][editIdx]=r;sel=null;saveDB();closeModal();render()}
function del(){if(sel===null)return alert('Pilih data terlebih dahulu');if(confirm('Hapus data ini?')){db[type].splice(sel,1);sel=null;saveDB();render()}}
function exportData(){let rows=[fields().map(f=>f[1]),...db[type].map(r=>fields().map(f=>r[f[0]]||''))],csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:'text/csv'}));a.download='SYSTEMQ_'+type.toUpperCase()+'.csv';a.click()}
function discount(){let v=prompt('Diskon baru (%) untuk semua Master Barang');if(v===null||isNaN(v))return;db.product.forEach(x=>x.discount=v);saveDB();render()}
function importCSV(e){let f=e.target.files[0];if(!f)return;let rd=new FileReader();rd.onload=()=>{let ls=String(rd.result).trim().split(/\r?\n/),h=ls.shift().split(',').map(x=>x.trim().toLowerCase()),n=0;ls.forEach(l=>{let v=l.split(','),r={};fields().forEach(f=>{let i=h.indexOf(f[0]);r[f[0]]=i>=0?(v[i]||'').trim():''});db[type].push(r);n++});saveDB();render();alert(n+' data berhasil diimport')};rd.readAsText(f)}
setType('store');