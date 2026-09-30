    const { useState, useEffect, useMemo, useRef } = React;

    // --- UTILITY FORMATTERS ---
    const formatIDR = (number) => {
      const val = Number(number) || 0;
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    };

    const formatDateID = (dateStr) => {
      if (!dateStr) return '-';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(d);
      }
      return dateStr;
    };

    const formatDateTimeID = (dateStr) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    };

    // Calculate days between today and target date
    const getDaysDiff = (targetDateStr) => {
      if (!targetDateStr) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(targetDateStr);
      target.setHours(0, 0, 0, 0);
      const diffTime = target - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // --- DEFAULT PROFILES ---
    const DEFAULT_PROFILES = [
      { id: 'personal', name: 'Keuangan Pribadi', icon: '👤', desc: 'Arus kas harian & tabungan' },
      { id: 'business', name: 'Bisnis Sampingan', icon: '💼', desc: 'Modal usaha, omzet & piutang' }
    ];

    // --- DEFAULT ACCOUNTS / WADAH ---
    const DEFAULT_ACCOUNTS = {
      personal: [
        { id: 'acc-cash', name: 'Dompet Tunai (Cash)', type: 'cash', balance: 750000, color: 'emerald', icon: 'cash', notes: 'Uang fisik di dompet' },
        { id: 'acc-bca', name: 'Bank BCA', type: 'bank', balance: 5200000, color: 'blue', icon: 'bank', notes: 'Rekening operasional harian' },
        { id: 'acc-gopay', name: 'GoPay / E-Wallet', type: 'ewallet', balance: 320000, color: 'cyan', icon: 'ewallet', notes: 'Untuk jajan & transportasi' }
      ],
      business: [
        { id: 'acc-biz-bank', name: 'Rekening Bisnis (Mandiri)', type: 'bank', balance: 12500000, color: 'indigo', icon: 'bank', notes: 'Arus kas penjualan' },
        { id: 'acc-biz-cash', name: 'Kas Kecil (Petty Cash)', type: 'cash', balance: 1500000, color: 'emerald', icon: 'cash', notes: 'Operasional toko / kantor' }
      ]
    };

    // --- DEFAULT CATEGORIES ---
    const DEFAULT_CATEGORIES = {
      income: ['Gaji', 'Freelance & Bisnis', 'Investasi', 'Hadiah / Bonus', 'Penjualan', 'Lain-lain'],
      expense: ['Makanan & Minuman', 'Transportasi', 'Tagihan & Utilitas', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Modal Bisnis', 'Lain-lain']
    };

    // --- DEFAULT GOALS SAMPLE ---
    const DEFAULT_GOALS = {
      personal: [
        {
          id: 'goal-1',
          name: 'Dana Darurat 6 Bulan',
          targetAmount: 20000000,
          currentAmount: 8500000,
          deadline: '2026-12-31',
          category: 'Keamanan',
          color: 'emerald',
          notes: 'Disimpan di instrumen likuid'
        },
        {
          id: 'goal-2',
          name: 'Liburan Akhir Tahun',
          targetAmount: 7000000,
          currentAmount: 3200000,
          deadline: '2026-11-20',
          category: 'Lifestyle',
          color: 'cyan',
          notes: 'Tiket & akomodasi keluarga'
        }
      ],
      business: [
        {
          id: 'goal-biz-1',
          name: 'Ekspansi Stok Lebaran',
          targetAmount: 15000000,
          currentAmount: 6000000,
          deadline: '2026-11-30',
          category: 'Ekspansi',
          color: 'indigo',
          notes: 'Persiapan stok produk laris'
        }
      ]
    };

    // --- DEFAULT DEBTS & RECEIVABLES SAMPLE ---
    const DEFAULT_DEBTS = {
      personal: [
        {
          id: 'debt-1',
          type: 'receivable', // piutang (orang lain pinjam ke kita)
          personName: 'Rian Pratama (Teman)',
          totalAmount: 1500000,
          paidAmount: 500000,
          dueDate: '2026-10-15',
          startDate: '2026-09-01',
          status: 'partial',
          notes: 'Pinjaman modal usaha servis HP',
          payments: [
            { id: 'pay-1', date: '2026-09-20', amount: 500000, accountId: 'acc-bca', notes: 'Cicilan transfer termin 1' }
          ]
        },
        {
          id: 'debt-2',
          type: 'debt', // utang (kita pinjam ke orang lain / pihak lain)
          personName: 'Budi Santoso',
          totalAmount: 1000000,
          paidAmount: 0,
          dueDate: '2026-10-05',
          startDate: '2026-09-10',
          status: 'unpaid',
          notes: 'Talangan beli perkakas renovasi',
          payments: []
        }
      ],
      business: [
        {
          id: 'debt-biz-1',
          type: 'receivable',
          personName: 'CV Maju Jaya (Klien)',
          totalAmount: 4800000,
          paidAmount: 2400000,
          dueDate: '2026-10-10',
          startDate: '2026-09-05',
          status: 'partial',
          notes: 'Invoice Term 2 Proyek Desain',
          payments: [
            { id: 'pay-b1', date: '2026-09-15', amount: 2400000, accountId: 'acc-biz-bank', notes: 'DP 50%' }
          ]
        }
      ]
    };

    const DEFAULT_PAYMENT_METHODS = [
      'Dompet Tunai (Cash)',
      'Transfer Bank',
      'E-Wallet (GoPay/OVO/Dana)',
      'Kartu Kredit'
    ];

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
