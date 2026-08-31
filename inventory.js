/* SYSTEMQ Inventory - Step 1: New Goods Receiving Header
   Tidak mengubah index.html / app.js / Master Global. */
const MASTER_KEY = 'systemq_v17_data';
const GR_KEY = 'systemq_inventory_goods_receiving_v1';

let master = {};
let docs = [];
let current = null;

const $ = id => document.getElementById(id);

function loadData(){
  try { master = JSON.parse(localStorage.getItem(MASTER_KEY) || '{}'); }
  catch(e){ master = {}; }
  if(!Array.isArray(master.supplier)) master.supplier = [];

  try { docs = JSON.parse(localStorage.getItem(GR_KEY) || '[]'); }
  catch(e){ docs = []; }
  if(!Array.isArray(docs)) docs = [];
}

function saveDocs(){
  localStorage.setItem(GR_KEY, JSON.stringify(docs));
}

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function activeSuppliers(){
  return master.supplier.filter(s => !s.status || String(s.status).toUpperCase() === 'ACTIVE');
}

function supplierLabel(s){
  const code = String(s.code || '').trim();
  const name = String(s.name || '').trim();
  return code && name ? `${code} - ${name}` : (name || code);
}

function supplierKey(s){
  return String(s.code || s.name || '').trim();
}

function renderSupplier(selected=''){
  const suppliers = activeSuppliers();
  $('grSupplier').innerHTML = '<option value="">-- PILIH SUPPLIER --</option>' +
    suppliers.map(s => `<option value="${esc(supplierKey(s))">${esc(supplierLabel(s))}</option>`).join('');
  $('grSupplier').value = selected || '';
}

function newGR(){
  loadData();
  current = {
    id: 'GR-' + Date.now(),
    date: new Date().toISOString().slice(0,10),
    supplier: '',
    supplierName: '',
    plNo: '',
    note: '',
    items: [],
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  openForm();
}

function openGR(id){
  loadData();
  current = docs.find(d => d.id === id);
  if(!current) return alert('Data Goods Receiving tidak ditemukan.');
  if(!Array.isArray(current.items)) current.items = [];
  openForm();
}

function openForm(){
  $('listView').classList.add('hidden');
  $('formView').classList.remove('hidden');
  $('formTitle').textContent = current && current.id ? 'NEW / EDIT GOODS RECEIVING' : 'NEW GOODS RECEIVING';
  renderSupplier(current?.supplier || '');
  $('grDate').value = current?.date || new Date().toISOString().slice(0,10);
  $('grPL').value = current?.plNo || '';
  $('grNote').value = current?.note || '';
}

function backToList(){
  current = null;
  $('formView').classList.add('hidden');
  $('listView').classList.remove('hidden');
  loadData();
  renderList();
}

function collectHeader(){
  if(!current) return null;
  const date = $('grDate').value;
  const supplier = $('grSupplier').value;
  const plNo = $('grPL').value.trim();
  const note = $('grNote').value.trim();

  if(!date || !supplier || !plNo){
    alert('Tanggal, Supplier, dan Nomor Packing List wajib diisi.');
    return null;
  }

  const supplierRecord = activeSuppliers().find(s => supplierKey(s) === supplier);
  current.date = date;
  current.supplier = supplier;
  current.supplierName = supplierRecord ? supplierLabel(supplierRecord) : supplier;
  current.plNo = plNo;
  current.note = note;
  current.status = current.status === 'POSTED' ? 'POSTED' : 'DRAFT';
  current.updatedAt = new Date().toISOString();
  return current;
}

function saveGR(){
  const data = collectHeader();
  if(!data) return;

  loadData();
  const index = docs.findIndex(d => d.id === data.id);
  if(index === -1) docs.unshift(data);
  else docs[index] = data;
  saveDocs();

  alert('HEADER GOODS RECEIVING BERHASIL DISIMPAN SEBAGAI DRAFT.');
  backToList();
}

function renderList(){
  const q = String($('search')?.value || '').trim().toLowerCase();
  const rows = docs.filter(d =>
    `${d.plNo || ''} ${d.supplierName || ''} ${d.date || ''}`.toLowerCase().includes(q)
  );

  $('listBody').innerHTML = rows.length ? rows.map(d => `
    <tr>
      <td>${esc(d.date || '-')}</td>
      <td>${esc(d.supplierName || '-')}</td>
      <td><b>${esc(d.plNo || '-')}</b></td>
      <td>${esc(d.note || '-')}</td>
      <td><span class="status ${String(d.status||'DRAFT').toLowerCase()}">${esc(d.status || 'DRAFT')}</span></td>
      <td><button type="button" class="smallBtn" onclick="openGR('${esc(d.id)}')">EDIT</button></td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty">Belum ada Goods Receiving. Tekan NEW GOODS RECEIVING untuk membuat transaksi baru.</td></tr>';
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderList();
});
