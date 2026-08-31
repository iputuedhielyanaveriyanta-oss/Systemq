# SYSTEMQ v1.9

Perbaikan berdasarkan file SYSTEMQ terbaru:

## GUIDE / SIMPAN
- Tombol SIMPAN memakai `saveData()` langsung.
- Tidak lagi bergantung pada inline `onsubmit="save(event)"`.
- ADD, SIMPAN, UPDATE, dan DELETE menggunakan handler yang konsisten.

## EDIT / UPDATE
- UPDATE membuka data yang dipilih.
- Setelah diubah, SIMPAN memperbarui data lama.

## BRAND
Data utama:
- Kode Brand
- Nama Brand
- Supplier
- Status

Kelompok Promo / Harga dinamis:
- Nama kelompok/promo
- Margin %
- + ADD KELOMPOK
- HAPUS kelompok
- Saat UPDATE, seluruh kelompok lama muncul kembali dan dapat diubah.

Contoh:
- New Arrival — 40%
- Diskon 30% — 27%
