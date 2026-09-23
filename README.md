# FinansialKu - Aplikasi Pencatatan Keuangan Interaktif

Aplikasi web modern untuk pencatatan keuangan harian, bulanan, dan tahunan yang responsif, interaktif, dan mudah digunakan.

Aplikasi ini telah disediakan dalam bentuk **1 berkas mandiri (`index.html`)** yang dapat langsung dijalankan cukup dengan klik ganda di peramban (Chrome, Firefox, Edge) tanpa perlu konfigurasi backend maupun instalasi package.

---

## 1. Arsitektur & Struktur Direktori Proyek (Versi Modular Next.js / React)

Jika Anda ingin memecah atau mengembangkan aplikasi ini menjadi proyek modular berbasis **Next.js (App Router) + Tailwind CSS + Lucide React + Recharts / Chart.js**, berikut adalah struktur direktori standar industri yang direkomendasikan:

```
finansialku/
├── public/
│   ├── favicon.ico
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root Layout, font Plus Jakarta Sans, Dark Mode provider
│   │   ├── page.tsx                # Dashboard utama (Overview, Metrik, Charts, Quick Actions)
│   │   ├── transactions/
│   │   │   └── page.tsx            # Halaman riwayat transaksi lengkap, filter, & ekspor
│   │   ├── budgets/
│   │   │   └── page.tsx            # Halaman manajemen anggaran bulanan per kategori
│   │   └── globals.css             # Tailwind CSS & print styles
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── MetricCards.tsx     # Kartu Total Pemasukan, Pengeluaran, Saldo Kas
│   │   │   ├── FinancialHealth.tsx # Indikator Rasio & Rekomendasi Finansial
│   │   │   └── PeriodFilter.tsx    # Filter Harian, Bulanan, Tahunan
│   │   ├── transactions/
│   │   │   ├── TransactionForm.tsx # Form Modal Tambah/Edit Transaksi
│   │   │   ├── TransactionTable.tsx# Tabel riwayat dengan aksi edit & hapus
│   │   │   └── ExportButtons.tsx   # Tombol Ekspor CSV & Cetak PDF
│   │   ├── charts/
│   │   │   ├── CashFlowBarChart.tsx# Bar chart pemasukan vs pengeluaran
│   │   │   ├── CategoryPieChart.tsx# Donut chart proporsi pengeluaran kategori
│   │   │   └── YearlyTrendLine.tsx # Line chart tren pengeluaran 12 bulan
│   │   ├── budgets/
│   │   │   ├── BudgetCard.tsx      # Kartu progres anggaran kategori & peringatan 80%/100%
│   │   │   └── BudgetModal.tsx     # Modal ubah batas target anggaran
│   │   └── ui/                     # Komponen UI dasar (Modal, Button, Input, Select, Toast)
│   ├── hooks/
│   │   ├── useLocalStorage.ts      # Custom Hook sinkronisasi LocalStorage
│   │   └── useFinancialMetrics.ts  # Custom Hook perhitungan agregasi & rasio
│   ├── types/
│   │   └── transaction.ts          # Definisi TypeScript interface data transaksi & budget
│   └── lib/
│       ├── formatters.ts           # Format mata uang Rupiah IDR & Tanggal Indonesia
│       └── exportHelpers.ts        # Helper generate file CSV & export JSON
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 2. Struktur Data JSON (Siap Integrasi Database / Supabase)

Model data dirancang agar dapat langsung disimpan ke tabel PostgreSQL atau Supabase:

```typescript
export interface Transaction {
  id: string;               // UUID / Unique string
  type: 'income' | 'expense'; // Jenis transaksi
  amount: number;           // Nominal dalam Rupiah (contoh: 150000)
  date: string;             // Format YYYY-MM-DD (contoh: '2026-09-23')
  time: string;             // Format HH:mm (contoh: '14:30')
  category: string;         // 'Makanan & Minuman', 'Gaji', dll.
  paymentMethod: string;    // 'Tunai (Cash)', 'Transfer Bank', 'E-Wallet', 'Kartu Kredit'
  cycle: string;            // 'Sekali Jalan', 'Harian', 'Mingguan', 'Bulanan'
  notes?: string;           // Keterangan / memo transaksi
}

export interface BudgetConfig {
  [category: string]: number; // Contoh: { "Makanan & Minuman": 2500000, "Transportasi": 800000 }
}
```

---

## 3. Komponen Utama & Kode Logika

### A. State Management & Perhitungan Metrik (Custom Hook / React State)
```javascript
// Menghitung ringkasan pemasukan, pengeluaran, saldo, dan rasio kesehatan
const metrics = useMemo(() => {
  let totalIncome = 0;
  let totalExpense = 0;

  periodFilteredTransactions.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') totalIncome += amt;
    else totalExpense += amt;
  });

  const netBalance = totalIncome - totalExpense;
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 0);

  let healthStatus = 'Sangat Sehat';
  if (expenseRatio > 100) healthStatus = 'Defisit (Bahaya)';
  else if (expenseRatio >= 80) healthStatus = 'Waspada / Kritis';
  else if (expenseRatio >= 50) healthStatus = 'Aman & Seimbang';

  return { totalIncome, totalExpense, netBalance, expenseRatio, healthStatus };
}, [periodFilteredTransactions]);
```

### B. Format Mata Uang Indonesia (IDR)
```javascript
export const formatIDR = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(number) || 0);
};
```

### C. Ekspor Data ke File CSV
```javascript
export const exportToCSV = (transactions, periodName) => {
  const headers = ['ID', 'Tipe', 'Tanggal', 'Waktu', 'Kategori', 'Nominal', 'Metode', 'Siklus', 'Keterangan'];
  const rows = transactions.map(t => [
    t.id,
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.date,
    t.time,
    `"${t.category}"`,
    t.amount,
    `"${t.paymentMethod}"`,
    `"${t.cycle}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const link = document.createElement('a');
  link.href = encodeURI(csvContent);
  link.download = `Laporan_FinansialKu_${periodName}_${Date.now()}.csv`;
  link.click();
};
```

---

## 4. Langkah Menjalankan Aplikasi

### Metode 1: Menggunakan 1 File Standalone `index.html` (Instan & Tanpa Install)
1. Buka folder kerja Anda di File Explorer:
   `c:\Users\Teacher\Documents\gem percobaan pertama`
2. Klik ganda pada berkas **`index.html`** (atau klik kanan -> *Buka dengan / Open with Google Chrome / Microsoft Edge*).
3. Aplikasi akan langsung berjalan di peramban Anda dengan data sampel yang interaktif.
4. Anda dapat langsung:
   - Mencoba tombol **"Catat Transaksi"** untuk menambah atau mengedit transaksi.
   - Menekan tombol **ikon Bulan/Matahari** untuk mencoba *Dark Mode* dan *Light Mode*.
   - Memfilter periode *Harian*, *Bulanan*, atau *Tahunan*.
   - Melihat progress dan peringatan overbudget pada tab **"Anggaran (Budget)"**.
   - Mengekspor data ke file **CSV** atau **Cetak PDF**.
   - Mencadangkan data via tombol **Backup** (file JSON) dan memulihkannya via tombol **Restore**.

### Metode 2: Menjalankan via Local Web Server (Opsional)
Jika ingin menjalankan melalui local server sederhana menggunakan Python atau Node.js:
```bash
# Menggunakan Python:
python -m http.server 3000

# Atau menggunakan npx serve:
npx -y serve .
```
Lalu buka alamat `http://localhost:3000` di peramban Anda.
