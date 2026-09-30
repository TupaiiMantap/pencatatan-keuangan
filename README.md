# FinansialKu Pro - Aplikasi Manajemen Aset & Keuangan Cerdas

Aplikasi web modern untuk manajemen aset multi-wadah, pencatatan transaksi cerdas, utang-piutang dengan cicilan bertahap, scan struk belanja OCR otomatis, tabungan impian (goals), AI financial insights, dan keamanan PIN biometrik.

Aplikasi ini disediakan dalam bentuk **1 berkas mandiri (`index.html`)** yang dapat langsung dijalankan cukup dengan klik ganda di peramban (Chrome, Firefox, Edge) tanpa perlu konfigurasi backend maupun instalasi package. Kode sumber modular juga tersedia di direktori `src_app/` dan dapat dikompilasi ulang kapan saja menggunakan `node build.js`.

---

## 🌟 Fitur-Fitur Lanjutan yang Telah Diimplementasikan

### 1. MANAJEMEN ASET & TRANSFER
- **Multi-Wadah / Multi-Akun**:
  - Dukungan beragam jenis wadah: **Dompet Tunai (Cash)**, **Rekening Bank (BCA, Mandiri, BRI, dll)**, **E-Wallet (GoPay, OVO, Dana, ShopeePay)**, **Kartu Kredit**, dan **Investasi**.
  - Total Kekayaan Bersih (*Total Net Worth*) dikalkulasi otomatis secara real-time dari seluruh wadah aktif.
  - Setiap transaksi pemasukan/pengeluaran otomatis mendebit atau mengkredit saldo wadah yang dipilih.
- **Modul Transfer Antar-Akun**:
  - Memindahkan dana dari akun sumber ke akun tujuan dengan dukungan nominal dan biaya admin opsional.
  - Saldo kedua wadah diperbarui secara instan tanpa mencatatnya sebagai beban pengeluaran maupun pemasukan, sehingga grafik arus kas tetap akurat.
- **Sistem Rekonsiliasi Saldo (Penyesuaian Saldo Riil)**:
  - Fitur untuk mencocokkan saldo catatan aplikasi dengan uang riil fisik (misal uang tunai di dompet).
  - Sistem menghitung selisih (kurang/lebih) secara otomatis dan membukukan transaksi penyesuaian (*audit trail* transparan).
- **Modul Utang & Piutang Terpisah**:
  - **Piutang Saya (Aset Tertagih)**: Uang yang dipinjam pihak lain.
  - **Utang Saya (Kewajiban)**: Uang yang kita pinjam dari orang lain/lembaga.
  - **Pembayaran Bertahap (Cicilan)**: Catat pelunasan bertahap dengan memilih akun penerima/pembayar; status otomatis beralih ke *Lunas* saat nominal terpenuhi.
  - **Pengingat Jatuh Tempo Cerdas**: Indikator warna dinamis untuk status *Terlambat*, *Jatuh Tempo Hari Ini*, *H-7 Hari Lagi*, dan *Aman*.

---

### 2. OTOMATISASI & INTEGRASI DATA
- **Scan Struk Belanja Cerdas (OCR & Regex Parser)**:
  - Mengintegrasikan engine **Tesseract.js** untuk membaca teks langsung dari foto struk belanja atau nota pembayaran (kamera HP / unggah berkas gambar).
  - **Smart Parser Engine**: Otomatis mendeteksi total nominal, tanggal transaksi, nama toko/merchant, dan mengelompokkan kategori yang sesuai (misal: SPBU Pertamina -> Transportasi, Kafe Kopi -> Makanan & Minuman, Indomaret -> Belanja).
  - Dilengkapi **3 Tombol Preset Demo** (*Struk Minimarket, Kafe Kopi, SPBU*) untuk pengujian kilat tanpa perlu mencari foto struk fisik.
  - Tombol *"Terapkan ke Form Transaksi"* untuk auto-fill seluruh data transaksi dalam 1 klik.
- **Ekspor & Impor Data Komprehensif**:
  - **Ekspor Excel (.xlsx Multi-Sheet)**: Menggunakan SheetJS untuk menghasilkan workbook spreadsheet asli yang memuat 4 sheet rapi: *Wadah & Saldo*, *Riwayat Transaksi*, *Utang & Piutang*, dan *Goals Impian*.
  - **Ekspor CSV**: Format CSV berstandar UTF-8 BOM untuk kompatibilitas penuh dengan Microsoft Excel Indonesia/Global.
  - **Cetak Laporan / PDF**: Tampilan cetak yang dioptimalkan (*clean layout* tanpa tombol navigasi).
  - **Backup & Restore JSON Lengkap**: Pencadangan total seluruh profil, wadah, riwayat transaksi, utang-piutang, anggaran, dan target impian.

---

### 3. FITUR KEUANGAN PINTAR & GOALS
- **Financial Goals / Tabungan Impian**:
  - Penetapan target nominal, kategori, catatan motivasi, dan tenggat waktu (*deadline countdown*).
  - Kalkulator rekomendasi menabung bulanan: Menghitung otomatis nominal yang harus disisihkan per bulan agar target tercapai tepat waktu.
  - **Alokasi Saldo / Setor Tabungan**: Pengguna dapat memindahkan dana dari wadah tertentu (misal: Bank BCA) langsung ke target impian, atau menariknya kembali jika dibutuhkan.
- **FinAI Insight & Financial Intelligence Widget**:
  - Panel analitik AI cerdas di Dashboard utama yang mengevaluasi performa finansial:
    - *Rasio Penghematan (Savings Rate)*: Target ideal min. 20% sesuai pilar 50/30/20.
    - *Daily Burn Rate*: Rata-rata laju pengeluaran per hari.
    - *Pos Belanja Terbesar*: Deteksi kategori yang menyerap anggaran tertinggi.
  - Rekomendasi tindakan efisiensi otomatis: Saran pemangkasan pos sekunder, alokasi dana surplus ke target impian, serta peringatan jatuh tempo utang terdekat.
  - Tombol *"Perbarui Analisis"* dengan tips finansial interaktif.
- **Manajemen Anggaran Bulanan (Budgeting)**:
  - Pembatasan anggaran per kategori pengeluaran dengan indikator peringatan 80% (*Waspada*) dan 100% (*Overbudget*).

---

### 4. KEAMANAN & PENGATURAN
- **Penguncian Aplikasi (PIN 4-6 Digit & Mock Biometrik)**:
  - Layar kunci *Full-Screen Glassmorphism* yang aktif saat aplikasi dimuat atau dikunci manual via tombol gembok di navbar.
  - Papan ketik angka virtual interaktif dengan indikator titik PIN.
  - **Simulasi Biometrik (Face ID / Sidik Jari)**: Animasi radar pemindai biometrik modern yang membuka kunci instan dalam 1 detik.
  - Opsi reset keamanan jika pengguna lupa PIN.
- **Switcher Multi-Profil**:
  - Dropdown pemilih profil di navbar atas (*contoh: "👤 Keuangan Pribadi" vs "💼 Bisnis Sampingan"*).
  - Fitur tambah profil kustom tanpa batas (misal: *Keuangan Keluarga, Usaha Kost, Toko Online*).
  - Setiap profil memiliki wadah aset, transaksi, utang-piutang, anggaran, dan goals yang terisolasi secara independen.

---

## 🛠️ Struktur Direktori Proyek

```
pencatatan-keuangan/
├── index.html                 # Berkas utama aplikasi (Single-file All-in-One, siap pakai)
├── README.md                  # Dokumentasi lengkap arsitektur dan fitur
├── build.js                   # Script kompilasi modular Node.js -> index.html
├── serve.js                   # Server lokal sederhana untuk pengujian
├── verify_syntax.js           # Script verifikasi sintaks & keseimbangan delimiter
└── src_app/                   # Modul kode sumber terstruktur
    ├── head.html              # HTML Head, Tailwind, React, Chart.js, Tesseract.js, XLSX
    ├── icons.js               # Komponen ikon SVG modern
    ├── constants_and_helpers.js # Formatters IDR, tanggal, data inisial, helper hari
    ├── ocr_modal.js           # Modal OCR Scan Struk belanja & regex smart parser
    ├── accounts_view.js       # Modul wadah aset, transfer antar-akun & rekonsiliasi saldo
    ├── debts_view.js          # Modul utang-piutang, cicilan bertahap & pengingat jatuh tempo
    ├── goals_budget_view.js   # Modul tabungan impian & manajemen anggaran kategori
    ├── ai_widget.js           # Widget FinAI Financial Intelligence & saran otomatis
    ├── security_components.js # Layar kunci PIN, simulasi biometrik & modal pengaturan
    ├── charts_and_tables.js   # Komponen Chart.js (Bar, Donut, Line) & tabel riwayat
    ├── transaction_modal.js   # Form transaksi terintegrasi akun & shortcut OCR
    └── app_main.js            # Komponen inti App, multi-profil switcher & ekspor Excel
```

---

## 🚀 Cara Menjalankan

1. **Cara Paling Mudah (Langsung Pakai)**:
   - Cukup klik ganda pada file `index.html` menggunakan peramban favorit Anda (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
   - Seluruh fitur, grafik, OCR parser, dan ekspor Excel langsung berfungsi 100% tanpa perlu server.

2. **Melalui Local Development Server (Opsional)**:
   - Pastikan Node.js terpasang di komputer Anda.
   - Buka terminal pada folder proyek dan jalankan:
     ```bash
     node serve.js
     ```
   - Buka peramban di `http://localhost:3000`.

3. **Kompilasi Ulang Kode Modular**:
   - Jika Anda mengubah kode di dalam folder `src_app/`, satukan kembali ke `index.html` dengan menjalankan:
     ```bash
     node build.js
     ```

---
*FinansialKu Pro &copy; 2026 &mdash; Aplikasi Manajemen Aset & Keuangan Cerdas*
