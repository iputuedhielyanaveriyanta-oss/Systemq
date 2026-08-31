const MASTER_KEYS=['systemq_v17_data','systemq_v18_data','systemq_v16_data'];
const GR_KEY='systemq_goods_receiving_v1';
let dbMaster={}, records=JSON.parse(localStorage.getItem(GR_KEY)||'[]'), current=null;

function loadMaster(){
  for(const key of MASTER_KEYS){
    try{
      const x=JSON.parse(localStorage.getItem(key)||'{}');
      if(x && (Array.isArray(x.product)||Array.isArray(x.supplier))){dbMaster=x;return;}
    }catch(e){}
  }
  dbMaster={product:[],supplier:[]};
}
function suppliers(){return Array.isArray(dbMaster.supplier)?dbMaster.supplier:[]}
function products(){return Array.isArray(dbMaster.product)?dbMaster.product:[]}
function persist(){localStorage.setItem(GR_KEY,JSON.stringify(records))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function today(){return new Date().toISOString().slice(0,10)}
function statusLabel(s){return s==='POSTED'?'POSTED':s==='BALANCED'?'BALANCED':s==='SCANNING'?'SCANNING':'DRAFT'}

function showList(){
  document.getElementById('listView').classList.remove('hidden');
  document.getElementById('formView').classList.add('hidden');
  current=null; renderList();
}
function renderList(){
  const q=(document.getElementById('search').value||'').toLowerCase();
  const rows=[...records].filter(r=>`${r.plNo} ${r.supplierName}`.toLowerCase().includes(q)).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
  document.getElementById('listBody').innerHTML=rows.length?rows.map(r=>`<tr>
    <td>${esc(r.date)}</td><td>${esc(r.supplierName)}</td><td>${esc(r.plNo)}</td><td>${r.items.length}</td><td><b>${statusLabel(r.status)}</b></td>
    <td><button onclick="openReceiving('${r.id}')">BUKA</button></td></tr>`).join(''):`<tr><td colspan="6">Belum ada Goods Receiving.</td></tr>`;
}
function newReceiving(){
  loadMaster();
  current={id:'GR-'+Date.now(),date:today(),supplier:'',supplierName:'',plNo:'',note:'',items:[],status:'DRAFT',posted:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  openForm();
}
function openReceiving(id){
  loadMaster();
  if(id){current=records.find(x=>x.id===id);if(!current)return}
  document.getElementById('listView').classList.add('hidden');
  document.getElementById('formView').classList.remove('hidden');
  document.getElementById('pageTitle').textContent=current.status==='POSTED'?'GOODS RECEIVING (POSTED)':'GOODS RECEIVING';
  document.getElementById('grDate').value=current.date||today();
  const opts=['<option value="">-- PILIH SUPPLIER --</option>',...suppliers().map(s=>`<option value="${esc(s.code||s.name)}">${esc(s.name||s.code)}</option>`)];
  document.getElementById('supplier').innerHTML=opts.join('');
  document.getElementById('supplier').value=current.supplier||'';
  document.getElementById('plNo').value=current.plNo||'';
  document.getElementById('note').value=current.note||'';
  document.getElementById('continueBtn').disabled=!current.items.length||current.status==='POSTED';
  document.getElementById('importResult').classList.toggle('hidden',!current.items.length);
  document.getElementById('scanPanel').classList.toggle('hidden',!['SCANNING','BALANCED','POSTED'].includes(current.status));
  if(current.items.length){renderItems()}
  if(current.status==='POSTED'){
    ['grDate','supplier','plNo','note','excelFile'].forEach(id=>{const e=document.getElementById(id);if(e)e.disabled=true});
  }
}
function readHeader(){
  current.date=document.getElementById('grDate').value;
  current.supplier=document.getElementById('supplier').value;
  const s=suppliers().find(x=>String(x.code||x.name)===current.supplier);
  current.supplierName=s?(s.name||s.code):'';
  current.plNo=document.getElementById('plNo').value.trim();
  current.note=document.getElementById('note').value.trim();
  current.updatedAt=new Date().toISOString();
}
function saveCurrent(){
  readHeader();
  const i=records.findIndex(x=>x.id===current.id);
  if(i<0)records.push(current);else records[i]=current;
  persist();
}
function saveDraft(){
  readHeader();
  if(!current.date||!current.supplier||!current.plNo){alert('Tanggal, Supplier, dan Nomor Packing List wajib diisi.');return}
  saveCurrent();alert('Draft Goods Receiving disimpan.');
}
function importPL(ev){
  readHeader();
  if(!current.date||!current.supplier||!current.plNo){alert('Isi Tanggal, Supplier, dan Nomor Packing List terlebih dahulu.');ev.target.value='';return}
  const file=ev.target.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      let rows=[];
      if(file.name.toLowerCase().endsWith('.csv')){
        const lines=String(e.target.result).replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
        rows=lines.map(x=>x.split(',').map(v=>v.trim().replace(/^"|"$/g,'')));
      }else{
        if(!window.XLSX)throw new Error('Library Excel belum termuat. Periksa koneksi internet.');
        const wb=XLSX.read(e.target.result,{type:'array'});
        rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});
      }
      const headers=(rows.shift()||[]).map(x=>String(x).trim().toLowerCase());
      const bi=headers.findIndex(h=>['barcode','bar code','kode barcode'].includes(h));
      const qi=headers.findIndex(h=>['qty','quantity','jumlah'].includes(h));
      if(bi<0||qi<0)throw new Error('Excel harus memiliki kolom BARCODE dan QTY.');
      const map=new Map(), errors=[];
      rows.forEach((r,n)=>{
        const barcode=String(r[bi]??'').trim(); const qty=Number(r[qi]);
        if(!barcode)return;
        if(!Number.isFinite(qty)||qty<=0){errors.push(`Baris ${n+2}: QTY tidak valid (${barcode})`);return}
        const p=products().find(x=>String(x.barcode||'').trim()===barcode);
        if(!p){errors.push(`Baris ${n+2}: Barcode ${barcode} tidak ditemukan di MASTER BARANG`);return}
        const key=barcode;
        if(map.has(key))map.get(key).expected+=qty;
        else map.set(key,{barcode,sku:p.sku||'',name:p.name||'',size:p.size||'',expected:qty,scanned:0});
      });
      current.items=[...map.values()];
      current.status='DRAFT';
      document.getElementById('importError').classList.toggle('hidden',!errors.length);
      document.getElementById('importError').textContent=errors.join(' | ');
      renderItems(); saveCurrent();
      document.getElementById('continueBtn').disabled=!current.items.length;
      alert(`${current.items.length} item berhasil diimport.${errors.length?' Ada barcode yang perlu diperiksa.':''}`);
    }catch(err){alert('Import gagal: '+err.message)}
    ev.target.value='';
  };
  if(file.name.toLowerCase().endsWith('.csv'))reader.readAsText(file);else reader.readAsArrayBuffer(file);
}
function renderItems(){
  const total=current.items.reduce((a,x)=>a+x.expected,0);
  const scanned=current.items.reduce((a,x)=>a+x.scanned,0);
  const balance=current.items.reduce((a,x)=>a+(x.expected-x.scanned),0);
  const body=current.items.map(x=>`<tr><td>${esc(x.barcode)}</td><td>${esc(x.sku)}</td><td>${esc(x.name)}</td><td>${esc(x.size)}</td><td>${x.expected}</td><td>${x.scanned}</td><td class="${x.expected-x.scanned===0?'zero':'notzero'}">${x.expected-x.scanned}</td></tr>`).join('');
  document.getElementById('plBody').innerHTML=body;
  document.getElementById('scanBody').innerHTML=body;
  document.getElementById('importSummary').textContent=`${current.items.length} ITEM • ${total} PCS`;
  document.getElementById('totalExpected').textContent=total;
  document.getElementById('totalScanned').textContent=scanned;
  document.getElementById('totalBalance').textContent=balance;
  const ok=balance===0 && current.items.length>0;
  current.status=ok?'BALANCED':(current.status==='POSTED'?'POSTED':current.status==='SCANNING'?'SCANNING':'DRAFT');
  document.getElementById('balanceStatus').textContent=current.status==='POSTED'?'POSTED':ok?'BALANCED':'BELUM BALANCE';
  document.getElementById('postBtn').disabled=!ok||current.status==='POSTED';
}
function continueScan(){
  readHeader();
  if(!current.date||!current.supplier||!current.plNo){alert('Header belum lengkap.');return}
  if(!current.items.length){alert('Import Excel Packing List terlebih dahulu.');return}
  current.status='SCANNING';saveCurrent();
  document.getElementById('scanPanel').classList.remove('hidden');
  document.getElementById('stepHeader').classList.add('compact');
  renderItems();
  setTimeout(()=>document.getElementById('scanInput').focus(),100);
}
function scanBarcode(){
  if(current.status==='POSTED')return;
  const input=document.getElementById('scanInput');const code=input.value.trim();if(!code)return;
  const msg=document.getElementById('scanMessage');
  const item=current.items.find(x=>String(x.barcode)===code);
  if(!item){msg.className='message bad';msg.textContent='BARCODE TIDAK ADA DI PACKING LIST INI.';input.value='';input.focus();return}
  if(item.scanned>=item.expected){msg.className='message bad';msg.textContent=`${code}: SUDAH LENGKAP (${item.scanned}/${item.expected}).`;input.value='';input.focus();return}
  item.scanned++;
  current.status='SCANNING';renderItems();saveCurrent();
  msg.className='message ok';msg.textContent=`✓ ${item.name} • ${item.scanned}/${item.expected} berhasil discan.`;
  input.value='';input.focus();
}
function postReceiving(){
  const balance=current.items.reduce((a,x)=>a+(x.expected-x.scanned),0);
  if(balance!==0){alert('POSTING terkunci karena Balance belum 0.');return}
  if(!confirm('POSTING Goods Receiving ini? Stok akan ditambahkan dan transaksi dikunci.'))return;
  // Stock is stored separately to avoid modifying Master Global product records.
  const stockKey='systemq_inventory_stock_v1';
  const stock=JSON.parse(localStorage.getItem(stockKey)||'{}');
  current.items.forEach(x=>{const k=x.sku||x.barcode;stock[k]=(Number(stock[k])||0)+Number(x.scanned)});
  localStorage.setItem(stockKey,JSON.stringify(stock));
  current.status='POSTED';current.posted=true;current.postedAt=new Date().toISOString();saveCurrent();
  alert('GOODS RECEIVING BERHASIL DIPOSTING. STOK BERTAMBAH.');
  openForm();
}
document.addEventListener('DOMContentLoaded',()=>{loadMaster();renderList()});
