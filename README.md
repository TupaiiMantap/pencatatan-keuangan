# FinansialKu Pro - Aplikasi Manajemen Aset, Keuangan Cerdas & Firebase Cloud Sync

Aplikasi web modern untuk manajemen aset multi-wadah, pencatatan transaksi cerdas, utang-piutang dengan cicilan bertahap, scan struk belanja OCR otomatis, tabungan impian (goals), AI financial insights, keamanan PIN biometrik, dan **Sinkronisasi Realtime Cloud Database Firebase**.

Aplikasi ini disediakan dalam bentuk **1 berkas mandiri (`index.html`)** yang dapat langsung dijalankan cukup dengan klik ganda di peramban (Chrome, Firefox, Edge) tanpa perlu konfigurasi backend tambahan. Seluruh konfigurasi Firebase telah tertanam dan aktif.

---

## ☁️ Integrasi Firebase Cloud Database & Autentikasi

Aplikasi telah terhubung ke proyek Firebase Anda:
- **Project ID**: `finansialku-pro`
- **Auth Domain**: `finansialku-pro.firebaseapp.com`
- **Storage Bucket**: `finansialku-pro.firebasestorage.app`

### Fitur Firebase yang Tersedia:
1. **Multi-Method Authentication**:
   - **Google One-Tap / Popup Sign-In**: Masuk cepat dengan akun Google.
   - **Email & Password**: Registrasi akun baru, masuk, dan fitur lupa kata sandi.
   - **Mode Tamu (Anonymous Cloud)**: Sinkronisasi data cloud instan tanpa perlu mendaftar.
2. **Realtime Firestore Database Sync**:
   - Sinkronisasi otomatis dua arah antar-perangkat secara *real-time*.
   - Setiap transaksi, wadah, utang-piutang, anggaran, dan target impian yang diubah akan tersimpan otomatis ke Cloud Firestore (`users/{uid}`).
3. **Offline-First Persistence**:
   - Jika koneksi internet terputus, aplikasi tetap berjalan normal menggunakan LocalStorage lokal dan akan otomatis sinkron ke Cloud saat kembali online.

---

## 🌟 Fitur-Fitur Utama Aplikasi

### 1. MANAJEMEN ASET & TRANSFER
- **Multi-Wadah / Multi-Akun**: Dompet Tunai (Cash), Rekening Bank (BCA, Mandiri, BRI, dll), E-Wallet (GoPay, OVO, Dana, ShopeePay), Kartu Kredit, dan Investasi.
- **Total Kekayaan Bersih (*Total Net Worth*)**: Terkalkulasi otomatis dari seluruh wadah aktif.
- **Transfer Antar-Akun**: Pindah dana antar akun dengan biaya admin opsional tanpa memengaruhi kalkulasi arus kas pemasukan/pengeluaran.
- **Rekonsiliasi Saldo Riil**: Fitur mencocokkan saldo catatan aplikasi dengan uang fisik nyata (menghasilkan transaksi penyesuaian otomatis).
- **Modul Utang & Piutang**: Pencatatan piutang (uang di luar) vs utang (kewajiban), pembayaran cicilan bertahap, dan pengingat jatuh tempo (*Overdue*, *H-7*, *Aman*).

### 2. OTOMATISASI & SCAN STRUK OCR
- **Tesseract.js OCR Scanner**: Pindai foto struk belanja (kamera HP/unggah berkas) untuk mengekstrak nominal total, tanggal, dan nama toko secara otomatis.
- **Smart Category Parser**: Otomatis mendeteksi kategori berdasarkan teks struk belanja.
- **3 Tombol Preset Demo**: Uji coba instan (*Struk Minimarket, Kafe Kopi, SPBU*) dalam 1 klik.

### 3. EKSPOR & CADANGAN LENGKAP
- **Ekspor Excel (.xlsx Multi-Sheet)**: 4 sheet (*Wadah & Saldo*, *Riwayat Transaksi*, *Utang & Piutang*, *Goals Impian*).
- **Ekspor CSV**: Standar UTF-8 BOM untuk kompatibilitas Excel global.
- **Cetak Laporan / PDF**: Format cetak bersih ramah dokumen fisik.
- **Backup & Restore JSON**: Cadangkan seluruh database profil dan pulihkan kapan saja.

### 4. KEUANGAN PINTAR & GOALS
- **Tabungan Impian (Financial Goals)**: Target nominal, tenggat waktu, kalkulator rekomendasi menabung bulanan, dan alokasi saldo langsung dari wadah.
- **FinAI Financial Intelligence Widget**: Analisis rasio tabungan (*Savings Rate*), laju pengeluaran harian (*Burn Rate*), deteksi pos belanja terbesar, dan saran efisiensi otomatis.
- **Manajemen Anggaran (Budgeting)**: Batas anggaran bulanan per kategori dengan indikator peringatan 80% dan 100%.

### 5. KEAMANAN & PENGATURAN
- **Penguncian PIN 4-6 Digit & Mock Biometrik**: Layar kunci interaktif dengan animasi pemindai Face ID / Sidik Jari.
- **Multi-Profil Switcher**: Beralih profil (*Keuangan Pribadi*, *Bisnis Sampingan*, dll) dengan data terisolasi secara mandiri.

---

## 🛠️ Struktur Direktori Proyek

```
pencatatan-keuangan/
├── index.html                 # Berkas utama aplikasi (Single-file All-in-One, siap pakai)
├── README.md                  # Dokumentasi lengkap
├── build.js                   # Skrip penggabung modular Node.js -> index.html
├── serve.js                   # Server pengujian lokal
├── package.json               # Konfigurasi npm & dependensi Firebase
├── node_modules/              # Dependensi Firebase
└── src_app/                   # Kode sumber modular
    ├── head.html              # HTML Head & CDN SDK (Firebase, Tailwind, React, Chart.js, Tesseract, XLSX)
    ├── firebase_service.js    # Konfigurasi Firebase, Auth (Google/Email), Firestore sync & Modal Login
    ├── icons.js               # Komponen ikon SVG modern
    ├── constants_and_helpers.js # Formatters, inisialisasi data, helper
    ├── ocr_modal.js           # Modal OCR Scan Struk & Regex Parser
    ├── accounts_view.js       # Modul wadah aset, transfer antar-akun & rekonsiliasi
    ├── debts_view.js          # Modul utang-piutang & cicilan bertahap
    ├── goals_budget_view.js   # Modul tabungan impian & anggaran
    ├── ai_widget.js           # Widget FinAI Financial Intelligence
    ├── security_components.js # Layar kunci PIN & simulasi biometrik
    ├── charts_and_tables.js   # Komponen grafik Chart.js & tabel riwayat
    ├── transaction_modal.js   # Form transaksi terintegrasi akun & shortcut OCR
    └── app_main.js            # Komponen inti App & sinkronisasi realtime
```

---

## 🚀 Cara Menjalankan

1. **Langsung Menggunakan Peramban**:
   - Cukup klik ganda pada berkas [index.html](file:///c:/Users/Teacher/Documents/pencatatan-keuangan/index.html).
   - Klik tombol **"☁️ Hubungkan Cloud"** di pojok kanan atas untuk masuk dengan akun Google atau Email dan mengaktifkan sinkronisasi realtime Firebase.

2. **Melalui Server Lokal (Opsional)**:
   - Jalankan di terminal:
     ```bash
     node serve.js
     ```
   - Buka `http://localhost:3000` di peramban.

---
*FinansialKu Pro &copy; 2026 &mdash; Terintegrasi dengan Firebase Cloud Platform*
