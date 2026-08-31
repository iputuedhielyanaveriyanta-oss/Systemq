
const STORAGE_KEY = 'systemq_v16_data';

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
  brand: {
    title: 'BRAND',
    fields: [
      ['code','KODE BRAND'],
      ['name','NAMA BRAND'],
      ['supplier','SUPPLIER'],
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
      ['sizes','DAFTAR SIZE'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  },
  product: {
    title: 'MASTER BARANG',
    fields: [
      ['brand','BRAND'],
      ['sku','SKU'],
      ['name','NAMA BARANG'],
      ['barcode','BARCODE'],
      ['spare','SPARE'],
      ['color','WARNA'],
      ['price','HARGA JUAL'],
      ['discount','DISKON %'],
      ['size','SIZE'],
      ['status','STATUS','select',['ACTIVE','INACTIVE']]
    ]
  }
};

let db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
Object.keys(SCHEMA).forEach(key => {
  if (!Array.isArray(db[key])) db[key] = [];
});

let currentType = 'store';
let selectedIndex = null;
let editingIndex = null;

function $(id) {
  return document.getElementById(id);
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function currentSchema() {
  return SCHEMA[currentType];
}

function currentFields() {
  return currentSchema().fields;
}

function title() {
  return currentSchema().title;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function show(id) {
  document.querySelectorAll('main section').forEach(section => section.classList.add('hidden'));
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

  const search = $('search');
  if (search) search.value = '';

  render();
}

function render() {
  const searchValue = (($('search') && $('search').value) || '').toLowerCase().trim();
  const rows = db[currentType].filter(record =>
    Object.values(record).join(' ').toLowerCase().includes(searchValue)
  );

  $('head').innerHTML =
    '<tr>' + currentFields().map(field => '<th>' + escapeHtml(field[1]) + '</th>').join('') + '</tr>';

  if (!rows.length) {
    $('body').innerHTML =
      '<tr><td colspan="' + currentFields().length +
      '" style="text-align:center;padding:35px;color:#77838e">Belum ada data. Tekan ADD untuk menambahkan.</td></tr>';
  } else {
    $('body').innerHTML = rows.map(record => {
      const realIndex = db[currentType].indexOf(record);
      const rowClass = realIndex === selectedIndex ? 'selected' : '';
      const cells = currentFields().map(field => {
        const value = record[field[0]];
        return '<td>' + escapeHtml(value || '-') + '</td>';
      }).join('');

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

function openForm() {
  const record = editingIndex === null ? {} : db[currentType][editingIndex];

  $('modalTitle').textContent =
    (editingIndex === null ? 'Tambah ' : 'Update ') + title();

  const html = currentFields().map(field => {
    const key = field[0];
    const label = field[1];
    const kind = field[2];
    const options = field[3] || [];
    const value = record[key] || '';

    if (kind === 'select') {
      return '<div class="field"><label>' + escapeHtml(label) + '</label>' +
        '<select name="' + escapeHtml(key) + '">' +
        options.map(option =>
          '<option value="' + escapeHtml(option) + '"' +
          (value === option ? ' selected' : '') + '>' +
          escapeHtml(option) + '</option>'
        ).join('') +
        '</select></div>';
    }

    const inputType = ['commission','discount','margin','price'].includes(key) ? 'number' : 'text';
    return '<div class="field"><label>' + escapeHtml(label) + '</label>' +
      '<input type="' + inputType + '" name="' + escapeHtml(key) +
      '" value="' + escapeHtml(value) + '"></div>';
  }).join('');

  $('form').innerHTML = html + '<button class="orange" type="submit">SIMPAN</button>';
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

  if (editingIndex === null) {
    db[currentType].push(record);
  } else {
    db[currentType][editingIndex] = record;
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
    ...db[currentType].map(record =>
      currentFields().map(field => record[field[0]] || '')
    )
  ];

  const csv = rows
    .map(row => row.map(value =>
      '"' + String(value).replace(/"/g, '""') + '"'
    ).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8;'
  });

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

  db.product.forEach(item => {
    item.discount = String(number);
  });

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
    if (!text) {
      alert('File kosong.');
      return;
    }

    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      alert('CSV harus memiliki header dan minimal satu data.');
      return;
    }

    const headers = parseCSVLine(lines.shift()).map(item => item.trim().toLowerCase());
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
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

document.addEventListener('DOMContentLoaded', () => {
  $('form').addEventListener('submit', save);
  setType('store');
});
