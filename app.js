const STORAGE_KEY = 'systemq_v17_data';

const SCHEMA = {
  store: {
    title: 'STORE',
    fields: [
      ['code','KODE STORE'],
      ['name','NAMA STORE'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  },
  guide: {
    title: 'GUIDE',
    fields: [
      ['code','KODE GUIDE'],
      ['name','NAMA GUIDE'],
      ['address','ALAMAT'],
      ['phone','NO HP'],
      ['commission','KOMISI %'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  },
  supplier: {
    title: 'SUPPLIER',
    fields: [
      ['code','KODE SUPPLIER'],
      ['name','NAMA SUPPLIER'],
      ['address','ALAMAT'],
      ['phone','NO HP'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  },
  brand: {
    title: 'BRAND',
    fields: [
      ['code','KODE BRAND'],
      ['name','NAMA BRAND'],
      ['supplier','SUPPLIER','dynamic','supplier'],
      ['newArrival','NEW ARRIVAL','select',['YA','TIDAK']],
      ['discount','DISKON %'],
      ['margin','MARGIN'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  },
  spare: {
    title: 'SPARE',
    fields: [
      ['code','KODE SPARE'],
      ['name','JENIS SPARE'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  },
  color: {
    title: 'WARNA',
    fields: [
      ['code','KODE WARNA'],
      ['name','NAMA WARNA'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  },
  size: {
    title: 'KOLOM SIZE',
    fields: [
      ['code','KODE SIZE'],
      ['type','JENIS SIZE'],
      ['sizes','DAFTAR SIZE (pisahkan dengan koma)'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  },
  product: {
    title: 'MASTER BARANG',
    fields: [
      ['brand','BRAND','productBrand'],
      ['group','KELOMPOK','productGroup'],
      ['supplier','SUPPLIER','productSupplier'],
      ['sku','SKU'],
      ['name','NAMA BARANG'],
      ['barcode','BARCODE'],
      ['spare','SPARE','dynamic','spare'],
      ['color','WARNA','dynamic','color'],
      ['price','HARGA JUAL'],
      ['promo','PROMO','readonly'],
      ['discount','DISKON %','readonly'],
      ['margin','MARGIN %','readonly'],
      ['sizeCode','KODE SIZE','sizeCode'],
      ['size','SIZE','sizeValue'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  }
};

let db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
Object.keys(SCHEMA).forEach(key => {
  if (!Array.isArray(db[key])) db[key] = [];
});
if (!db.brandPromos || typeof db.brandPromos !== 'object') db.brandPromos = {};

// SAFE RECOVERY: only fill missing Brand Promo/Group data from older local storage,
// never overwrite data already present in systemq_v17_data.
(function recoverBrandPromos() {
  ['systemq_v18_data', 'systemq_v16_data'].forEach(oldKey => {
    try {
      const oldDb = JSON.parse(localStorage.getItem(oldKey) || '{}');
      const oldPromos = oldDb && oldDb.brandPromos;
      if (!oldPromos || typeof oldPromos !== 'object') return;

      Object.keys(oldPromos).forEach(key => {
        if (!Array.isArray(db.brandPromos[key]) || db.brandPromos[key].length === 0) {
          db.brandPromos[key] = oldPromos[key];
        }
      });
    } catch (e) {}
  });
})();


let currentType = 'store';
let selectedIndex = null;
let editingIndex = null;

function $(id) { return document.getElementById(id); }
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
function currentSchema() { return SCHEMA[currentType]; }
function currentFields() { return currentSchema().fields; }
function title() { return currentSchema().title; }

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function show(id) {
  document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
  const target = $(id);
  if (target) target.classList.remove('hidden');
}

function setType(value) {
  currentType = value;
  selectedIndex = null;
  editingIndex = null;

  const productTools = $('productTools');
  if (productTools) productTools.classList.toggle('hidden', value !== 'product');

  const tableTitle = $('tableTitle');
  if (tableTitle) tableTitle.textContent = title();

  if ($('search')) $('search').value = '';
  render();
}

function render() {
  const searchValue = (($('search') && $('search').value) || '').toLowerCase().trim();
  const rows = db[currentType].filter(record =>
    Object.values(record).join(' ').toLowerCase().includes(searchValue)
  );

  $('head').innerHTML = '<tr>' + currentFields()
    .map(field => '<th>' + escapeHtml(field[1]) + '</th>').join('') + '</tr>';

  if (!rows.length) {
    $('body').innerHTML =
      '<tr><td colspan="' + currentFields().length +
      '" style="text-align:center;padding:35px;color:#77838e">Belum ada data. Tekan ADD untuk menambahkan.</td></tr>';
  } else {
    $('body').innerHTML = rows.map(record => {
      const realIndex = db[currentType].indexOf(record);
      const rowClass = realIndex === selectedIndex ? 'selected' : '';
      const cells = currentFields().map(field =>
        '<td>' + escapeHtml(record[field[0]] || '-') + '</td>'
      ).join('');
      return '<tr class="' + rowClass + '" data-index="' + realIndex + '">' + cells + '</tr>';
    }).join('');

    $('body').querySelectorAll('tr[data-index]').forEach(row => {
      row.addEventListener('click', () => {
        selectedIndex = Number(row.dataset.index);
        render();
      });
    });
  }

  $('count').textContent = rows.length + ' DATA';
}

function activeRecords(type) {
  return (db[type] || []).filter(item => !item.status || item.status === 'ACTIVE');
}

function dynamicOptions(source) {
  if (source === 'size') {
    const values = [];
    activeRecords('size').forEach(item => {
      String(item.sizes || '').split(',').forEach(size => {
        const clean = size.trim();
        if (clean && !values.includes(clean)) values.push(clean);
      });
    });
    return values.map(value => ({value, label: value}));
  }

  return activeRecords(source).map(item => ({
    value: item.name || item.code || '',
    label: item.code && item.name ? item.code + ' - ' + item.name : (item.name || item.code || '')
  })).filter(item => item.value);
}

function renderDynamicSelect(field, value) {
  const options = dynamicOptions(field[3]);
  const currentExists = value && !options.some(o => o.value === value);

  let html = '<select name="' + escapeHtml(field[0]) + '">';
  html += '<option value="">-- PILIH ' + escapeHtml(field[1]) + ' --</option>';

  if (currentExists) {
    html += '<option value="' + escapeHtml(value) + '" selected>' + escapeHtml(value) + '</option>';
  }

  html += options.map(option =>
    '<option value="' + escapeHtml(option.value) + '"' +
    (value === option.value ? ' selected' : '') + '>' +
    escapeHtml(option.label) + '</option>'
  ).join('');

  html += '</select>';
  return html;
}

function add() {
  editingIndex = null;
  openForm();
}

function edit() {
  if (selectedIndex === null) {
    alert('Pilih satu data terlebih dahulu.');
    return;
  }
  editingIndex = selectedIndex;
  openForm();
}


function brandRecord(value) {
  return activeRecords('brand').find(item =>
    String(item.name || item.code || '').trim() === String(value || '').trim()
  ) || null;
}

function brandPromoKey(brand) {
  return String((brand && (brand.code || brand.name)) || '').trim();
}

function getBrandPromos(brandValue) {
  const brand = brandRecord(brandValue);
  if (!brand || !db.brandPromos || typeof db.brandPromos !== 'object') return [];

  // Current format uses brand code. Older saved data may use brand name.
  const candidates = [
    String(brand.code || '').trim(),
    String(brand.name || '').trim(),
    String(brandValue || '').trim()
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (Array.isArray(db.brandPromos[candidate])) return db.brandPromos[candidate];
  }

  // Case-insensitive fallback so existing data is not hidden when key casing differs.
  const matchedKey = Object.keys(db.brandPromos).find(key =>
    candidates.some(candidate => String(key).trim().toLowerCase() === candidate.toLowerCase())
  );

  return matchedKey && Array.isArray(db.brandPromos[matchedKey])
    ? db.brandPromos[matchedKey]
    : [];
}

function groupLabel(item, index) {
  return String(item.group || '').trim() ||
         String(item.promo || '').trim() ||
         ('PROMO ' + (index + 1));
}

function productBrandSelect(value) {
  const options = dynamicOptions('brand');
  let html = '<select name="brand" id="productBrand" onchange="onProductBrandChange(this.value)">';
  html += '<option value="">-- PILIH BRAND --</option>';
  html += options.map(o => '<option value="' + escapeHtml(o.value) + '"' +
    (String(value) === String(o.value) ? ' selected' : '') + '>' +
    escapeHtml(o.label) + '</option>').join('');
  return html + '</select>';
}

function productGroupSelect(brandValue, value) {
  const promos = getBrandPromos(brandValue);
  let html = '<select name="group" id="productGroup" onchange="onProductGroupChange(this.value)">';
  html += '<option value="">-- PILIH KELOMPOK --</option>';
  html += promos.map((item, i) => {
    const label = groupLabel(item, i);
    return '<option value="' + escapeHtml(label) + '"' +
      (String(value) === String(label) ? ' selected' : '') + '>' +
      escapeHtml(label) + '</option>';
  }).join('');
  return html + '</select>';
}

function productSupplierSelect(value) {
  const options = dynamicOptions('supplier');
  let html = '<select name="supplier" id="productSupplier">';
  html += '<option value="">-- PILIH SUPPLIER --</option>';
  html += options.map(o => '<option value="' + escapeHtml(o.value) + '"' +
    (String(value) === String(o.value) ? ' selected' : '') + '>' +
    escapeHtml(o.label) + '</option>').join('');
  return html + '</select>';
}

function sizeCodeSelect(value) {
  const records = activeRecords('size');
  let html = '<select name="sizeCode" id="productSizeCode" onchange="onSizeCodeChange(this.value)">';
  html += '<option value="">-- PILIH KODE SIZE --</option>';
  html += records.map(item => {
    const code = String(item.code || '').trim();
    const sizes = String(item.sizes || '').trim();
    return '<option value="' + escapeHtml(code) + '"' +
      (String(value) === code ? ' selected' : '') + '>' +
      escapeHtml(code + (sizes ? ' = ' + sizes : '')) + '</option>';
  }).join('');
  return html + '</select>';
}

function sizeValueSelect(code, value) {
  const master = activeRecords('size').find(item =>
    String(item.code || '').trim() === String(code || '').trim()
  );
  const sizes = master ? String(master.sizes || '').split(',').map(x => x.trim()).filter(Boolean) : [];
  let html = '<select name="size" id="productSize">';
  html += '<option value="">-- PILIH SIZE --</option>';
  html += sizes.map(s => '<option value="' + escapeHtml(s) + '"' +
    (String(value) === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>').join('');
  return html + '</select>';
}

function onSizeCodeChange(code) {
  const wrap = $('productSizeWrap');
  if (wrap) wrap.innerHTML = '<label>SIZE</label>' + sizeValueSelect(code, '');
}

function onProductBrandChange(value) {
  const groupWrap = $('productGroupWrap');
  if (groupWrap) groupWrap.innerHTML = '<label>KELOMPOK</label>' + productGroupSelect(value, '');
  const brand = brandRecord(value);
  const supplier = $('productSupplier');
  if (supplier && brand && brand.supplier) supplier.value = brand.supplier;
  const promo = $('productPromo');
  const discount = $('productDiscount');
  const margin = $('productMargin');
  if (promo) promo.value = '';
  if (discount) discount.value = '';
  if (margin) margin.value = '';
}

function onProductGroupChange(value) {
  const brandValue = $('productBrand') ? $('productBrand').value : '';
  const promos = getBrandPromos(brandValue);
  const item = promos.find((x, i) => groupLabel(x, i) === String(value || ''));
  if ($('productPromo')) $('productPromo').value = item ? (item.promo || '') : '';
  if ($('productDiscount')) $('productDiscount').value = item ? (item.discount || '') : '';
  if ($('productMargin')) $('productMargin').value = item ? (item.margin || '') : '';
}

function openProductForm(record) {
  const r = record || {};
  const html = [
    '<div class="field"><label>BRAND</label>' + productBrandSelect(r.brand || '') + '</div>',
    '<div class="field" id="productGroupWrap"><label>KELOMPOK</label>' + productGroupSelect(r.brand || '', r.group || '') + '</div>',
    '<div class="field"><label>SUPPLIER</label>' + productSupplierSelect(r.supplier || '') + '</div>',
    '<div class="field"><label>SKU</label><input name="sku" value="' + escapeHtml(r.sku || '') + '"></div>',
    '<div class="field"><label>NAMA BARANG</label><input name="name" value="' + escapeHtml(r.name || '') + '"></div>',
    '<div class="field"><label>BARCODE</label><input name="barcode" value="' + escapeHtml(r.barcode || '') + '"></div>',
    '<div class="field"><label>SPARE</label>' + renderDynamicSelect(['spare','SPARE','dynamic','spare'], r.spare || '') + '</div>',
    '<div class="field"><label>WARNA</label>' + renderDynamicSelect(['color','WARNA','dynamic','color'], r.color || '') + '</div>',
    '<div class="field"><label>HARGA JUAL</label><input type="number" step="any" name="price" value="' + escapeHtml(r.price || '') + '"></div>',
    '<div class="field"><label>PROMO</label><input id="productPromo" name="promo" readonly value="' + escapeHtml(r.promo || '') + '"></div>',
    '<div class="field"><label>DISKON %</label><input id="productDiscount" name="discount" readonly value="' + escapeHtml(r.discount || '') + '"></div>',
    '<div class="field"><label>MARGIN %</label><input id="productMargin" name="margin" readonly value="' + escapeHtml(r.margin || '') + '"></div>',
    '<div class="field"><label>KODE SIZE</label>' + sizeCodeSelect(r.sizeCode || '') + '</div>',
    '<div class="field" id="productSizeWrap"><label>SIZE</label>' + sizeValueSelect(r.sizeCode || '', r.size || '') + '</div>',
    '<div class="field"><label>STATUS</label><select name="status"><option value="ACTIVE"' + ((r.status || 'ACTIVE') === 'ACTIVE' ? ' selected' : '') + '>ACTIVE</option><option value="INACTIVE"' + (r.status === 'INACTIVE' ? ' selected' : '') + '>INACTIVE</option></select></div>'
  ].join('');
  $('form').innerHTML = html + '<button class="orange" type="submit">SIMPAN</button>';
}

function openBrandForm(record) {
  const r = record || {};
  const promos = getBrandPromos(r.name || r.code || '');
  let promoRows = promos.map((p, i) =>
    '<div class="promo-row" data-promo-row="' + i + '">' +
    '<input placeholder="KELOMPOK" value="' + escapeHtml(p.group || '') + '">' +
    '<input placeholder="PROMO" value="' + escapeHtml(p.promo || '') + '">' +
    '<input type="number" step="any" placeholder="DISKON %" value="' + escapeHtml(p.discount || '') + '">' +
    '<input type="number" step="any" placeholder="MARGIN %" value="' + escapeHtml(p.margin || '') + '">' +
    '<button type="button" onclick="this.parentElement.remove()">×</button></div>'
  ).join('');

  const base = currentFields().map(field => {
    const key = field[0], label = field[1], kind = field[2], options = field[3] || [], value = r[key] || '';
    let control = '';
    if (kind === 'select') control = '<select name="' + key + '">' + options.map(o => '<option value="' + escapeHtml(o) + '"' + (value === o ? ' selected' : '') + '>' + escapeHtml(o) + '</option>').join('') + '</select>';
    else if (kind === 'dynamic') control = renderDynamicSelect(field, value);
    else control = '<input ' + (['discount','margin'].includes(key) ? 'type="number" step="any" ' : '') + 'name="' + key + '" value="' + escapeHtml(value) + '">';
    return '<div class="field"><label>' + escapeHtml(label) + '</label>' + control + '</div>';
  }).join('');

  $('form').innerHTML = base +
    '<div class="promo-box"><label>PROMO / MARGIN BRAND</label><small>Isi kelompok lalu promo, diskon, dan margin. Bisa tambah lebih dari satu.</small><div id="brandPromoRows">' + promoRows + '</div><button type="button" class="secondary" onclick="addBrandPromoRow()">＋ ADD PROMO / MARGIN</button></div>' +
    '<button class="orange" type="submit">SIMPAN</button>';
}

function addBrandPromoRow() {
  const wrap = $('brandPromoRows');
  if (!wrap) return;
  const row = document.createElement('div');
  row.className = 'promo-row';
  row.innerHTML = '<input placeholder="KELOMPOK"><input placeholder="PROMO"><input type="number" step="any" placeholder="DISKON %"><input type="number" step="any" placeholder="MARGIN %"><button type="button" onclick="this.parentElement.remove()">×</button>';
  wrap.appendChild(row);
}

function openForm() {
  const record = editingIndex === null ? {} : db[currentType][editingIndex];
  $('modalTitle').textContent = (editingIndex === null ? 'Tambah ' : 'Update ') + title();

  if (currentType === 'product') {
    openProductForm(record);
  } else if (currentType === 'brand') {
    openBrandForm(record);
  } else {
    const html = currentFields().map(field => {
      const key = field[0], label = field[1], kind = field[2], options = field[3] || [], value = record[key] || '';
      let control = '';
      if (kind === 'select') {
        control = '<select name="' + escapeHtml(key) + '">' + options.map(option =>
          '<option value="' + escapeHtml(option) + '"' + (value === option ? ' selected' : '') + '>' + escapeHtml(option) + '</option>'
        ).join('') + '</select>';
      } else if (kind === 'dynamic') {
        control = renderDynamicSelect(field, value);
      } else {
        const inputType = ['commission','discount','margin','price'].includes(key) ? 'number' : 'text';
        control = '<input type="' + inputType + '" step="any" name="' + escapeHtml(key) + '" value="' + escapeHtml(value) + '">';
      }
      return '<div class="field"><label>' + escapeHtml(label) + '</label>' + control + '</div>';
    }).join('');
    $('form').innerHTML = html + '<button class="orange" type="submit">SIMPAN</button>';
  }
  $('modal').classList.remove('hidden');
}
function closeModal() {
  $('modal').classList.add('hidden');
}

function save(event) {
  event.preventDefault();
  const formData = new FormData($('form'));
  const record = {};

  currentFields().forEach(field => {
    record[field[0]] = String(formData.get(field[0]) || '').trim();
  });

  const uniqueKey = currentType === 'product' ? 'sku' : 'code';
  if (record[uniqueKey]) {
    const duplicate = db[currentType].some((item, index) =>
      String(item[uniqueKey] || '').toLowerCase() === record[uniqueKey].toLowerCase() &&
      index !== editingIndex
    );
    if (duplicate) {
      alert(uniqueKey.toUpperCase() + ' sudah digunakan.');
      return;
    }
  }

  if (currentType === 'brand') {
    const old = editingIndex === null ? null : db.brand[editingIndex];
    const oldKey = old ? brandPromoKey(old) : '';
    if (editingIndex === null) db.brand.push(record);
    else db.brand[editingIndex] = record;

    const rows = [...document.querySelectorAll('#brandPromoRows .promo-row')].map(row => {
      const inputs = row.querySelectorAll('input');
      return {
        group: String(inputs[0].value || '').trim(),
        promo: String(inputs[1].value || '').trim(),
        discount: String(inputs[2].value || '').trim(),
        margin: String(inputs[3].value || '').trim()
      };
    }).filter(x => x.group || x.promo || x.discount || x.margin);

    const newKey = brandPromoKey(record);
    if (oldKey && oldKey !== newKey) delete db.brandPromos[oldKey];
    if (newKey) db.brandPromos[newKey] = rows;
  } else {
    if (editingIndex === null) db[currentType].push(record);
    else db[currentType][editingIndex] = record;
  }

  selectedIndex = null;
  editingIndex = null;
  persist();
  closeModal();
  render();
}
function del() {
  if (selectedIndex === null) {
    alert('Pilih data terlebih dahulu.');
    return;
  }
  if (!confirm('Hapus data yang dipilih?')) return;

  db[currentType].splice(selectedIndex, 1);
  selectedIndex = null;
  persist();
  render();
}

function exportData() {
  const rows = [
    currentFields().map(field => field[1]),
    ...db[currentType].map(record => currentFields().map(field => record[field[0]] || ''))
  ];

  const csv = rows.map(row =>
    row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')
  ).join('\n');

  const blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'SYSTEMQ_' + currentType.toUpperCase() + '.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function discount() {
  if (currentType !== 'product') {
    alert('Fitur ini hanya untuk MASTER BARANG.');
    return;
  }

  const value = prompt('Masukkan diskon baru (%) untuk semua Master Barang:', '');
  if (value === null) return;

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    alert('Diskon harus antara 0 sampai 100.');
    return;
  }

  db.product.forEach(item => item.discount = String(number));
  persist();
  render();
  alert('Diskon berhasil diperbarui.');
}

function importCSV(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '').replace(/^\uFEFF/, '').trim();
    if (!text) return alert('File kosong.');

    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return alert('CSV harus memiliki header dan minimal satu data.');

    const headers = parseCSVLine(lines.shift()).map(x => x.trim().toLowerCase());
    let imported = 0;

    lines.forEach(line => {
      const values = parseCSVLine(line);
      const record = {};

      currentFields().forEach(field => {
        const key = field[0];
        const label = field[1].toLowerCase();
        let index = headers.indexOf(key.toLowerCase());
        if (index < 0) index = headers.indexOf(label);
        record[key] = index >= 0 ? String(values[index] || '').trim() : '';
      });

      if (Object.values(record).some(Boolean)) {
        db[currentType].push(record);
        imported++;
      }
    });

    persist();
    render();
    alert(imported + ' data berhasil diimport.');
  };

  reader.readAsText(file);
  event.target.value = '';
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      result.push(current);
      current = '';
    } else current += char;
  }
  result.push(current);
  return result;
}

document.addEventListener('DOMContentLoaded', () => {
  $('form').addEventListener('submit', save);
  setType('store');
});