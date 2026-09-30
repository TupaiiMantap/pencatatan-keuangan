    // --- COMPONENT: TRANSACTION TABLE ---
    function TransactionTable({ transactions, accounts, onEdit, onDelete }) {
      if (transactions.length === 0) {
        return (
          <div className="py-12 text-center text-slate-400">
            <IconWallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">Belum ada transaksi pada kriteria ini.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Catat Transaksi" untuk menambahkan catatan baru.</p>
          </div>
        );
      }

      const getAccountName = (accId) => {
        const found = accounts.find(a => a.id === accId);
        return found ? found.name : 'Kas Utama';
      };

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Tanggal & Waktu</th>
                <th className="py-3 px-3">Wadah / Akun</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3">Siklus</th>
                <th className="py-3 px-3 text-right">Nominal (IDR)</th>
                <th className="py-3 px-3 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                const isAdjustment = tx.type === 'adjustment';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{formatDateID(tx.date)}</div>
                      <div className="text-[11px] text-slate-400">{tx.time || '-'}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                        <IconWallet className="w-3 h-3" />
                        <span>{getAccountName(tx.accountId)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-lg font-semibold text-[11px] ${
                        isTransfer ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                        isAdjustment ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {isTransfer ? 'Transfer Antar-Akun' : isAdjustment ? 'Penyesuaian Saldo' : (tx.category || 'Umum')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 dark:text-slate-200 font-medium line-clamp-1">{tx.notes || '-'}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-[11px] text-slate-500">
                        {tx.cycle && tx.cycle !== 'Sekali Jalan' ? `🔁 ${tx.cycle}` : 'Sekali Jalan'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className={`font-black text-sm ${
                        isTransfer ? 'text-purple-600 dark:text-purple-400' :
                        isAdjustment ? 'text-amber-600 dark:text-amber-400' :
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' :
                        'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isTransfer ? '⇄ ' : isAdjustment ? '⚖ ' : isIncome ? '+ ' : '- '}
                        {formatIDR(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-1">
                        {!isTransfer && !isAdjustment && (
                          <button
                            onClick={() => onEdit(tx)}
                            title="Edit Transaksi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(tx.id)}
                          title="Hapus Transaksi"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // --- CHART COMPONENT 1: BAR CHART (PEMASUKAN VS PENGELUARAN) ---
    function BarChartComponent({ transactions, filterPeriod, darkMode }) {
      const canvasRef = useRef(null);
      const chartInstanceRef = useRef(null);

      useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        let labels = [];
        let incomeData = [];
        let expenseData = [];

        if (filterPeriod === 'yearly') {
          labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          incomeData = Array(12).fill(0);
          expenseData = Array(12).fill(0);

          transactions.forEach(t => {
            if (t.type === 'transfer' || t.type === 'adjustment') return;
            const m = new Date(t.date).getMonth();
            if (t.type === 'income') incomeData[m] += Number(t.amount);
            else expenseData[m] += Number(t.amount);
          });
        } else {
          let inc = 0;
          let exp = 0;
          transactions.forEach(t => {
            if (t.type === 'transfer' || t.type === 'adjustment') return;
            if (t.type === 'income') inc += Number(t.amount);
            else exp += Number(t.amount);
          });
          labels = ['Pemasukan', 'Pengeluaran'];
          incomeData = [inc, 0];
          expenseData = [0, exp];
        }

        const textColor = darkMode ? '#94a3b8' : '#64748b';
        const gridColor = darkMode ? '#1e293b' : '#f1f5f9';

        chartInstanceRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: filterPeriod === 'yearly' ? [
              {
                label: 'Pemasukan',
                data: incomeData,
                backgroundColor: '#10b981',
                borderRadius: 6,
              },
              {
                label: 'Pengeluaran',
                data: expenseData,
                backgroundColor: '#f43f5e',
                borderRadius: 6,
              }
            ] : [
              {
                label: 'Nominal (IDR)',
                data: [incomeData[0], expenseData[1]],
                backgroundColor: ['#10b981', '#f43f5e'],
                borderRadius: 8,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: filterPeriod === 'yearly',
                labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label || ctx.label}: ${formatIDR(ctx.raw)}`
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
              },
              y: {
                grid: { color: gridColor },
                ticks: {
                  color: textColor,
                  font: { family: 'Plus Jakarta Sans', size: 10 },
                  callback: (val) => val >= 1000000 ? `${val / 1000000} Jt` : val >= 1000 ? `${val / 1000} Rb` : val
                }
              }
            }
          }
        });

        return () => {
          if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        };
      }, [transactions, filterPeriod, darkMode]);

      return <canvas ref={canvasRef} className="w-full h-full" />;
    }

    // --- CHART COMPONENT 2: DOUGHNUT CHART (KATEGORI PENGELUARAN) ---
    function PieChartComponent({ categorySpending, darkMode }) {
      const canvasRef = useRef(null);
      const chartInstanceRef = useRef(null);

      useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        const labels = Object.keys(categorySpending);
        const data = Object.values(categorySpending);

        if (labels.length === 0 || data.reduce((a, b) => a + b, 0) === 0) {
          labels.push('Belum ada pengeluaran');
          data.push(1);
        }

        const modernPalette = [
          '#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6',
          '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#64748b'
        ];

        const textColor = darkMode ? '#cbd5e1' : '#475569';

        chartInstanceRef.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: labels[0] === 'Belum ada pengeluaran' ? ['#e2e8f0'] : modernPalette.slice(0, labels.length),
              borderWidth: 2,
              borderColor: darkMode ? '#0f172a' : '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: textColor,
                  font: { family: 'Plus Jakarta Sans', size: 10 },
                  boxWidth: 12,
                  padding: 8
                }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${formatIDR(ctx.raw)}`
                }
              }
            }
          }
        });

        return () => {
          if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        };
      }, [categorySpending, darkMode]);

      return <canvas ref={canvasRef} className="w-full h-full" />;
    }

    // --- CHART COMPONENT 3: YEARLY TREND LINE CHART ---
    function YearlyTrendChart({ transactions, year, darkMode }) {
      const canvasRef = useRef(null);
      const chartInstanceRef = useRef(null);

      useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const incomeMonthly = Array(12).fill(0);
        const expenseMonthly = Array(12).fill(0);

        transactions.forEach(t => {
          if (!t.date || t.type === 'transfer' || t.type === 'adjustment') return;
          const [y, m] = t.date.split('-').map(Number);
          if (y === Number(year)) {
            const monthIdx = m - 1;
            if (monthIdx >= 0 && monthIdx < 12) {
              if (t.type === 'income') {
                incomeMonthly[monthIdx] += Number(t.amount);
              } else {
                expenseMonthly[monthIdx] += Number(t.amount);
              }
            }
          }
        });

        const textColor = darkMode ? '#94a3b8' : '#64748b';
        const gridColor = darkMode ? '#1e293b' : '#f1f5f9';

        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: months,
            datasets: [
              {
                label: 'Pemasukan',
                data: incomeMonthly,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.35,
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#10b981'
              },
              {
                label: 'Pengeluaran',
                data: expenseMonthly,
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                fill: true,
                tension: 0.35,
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#f43f5e'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${formatIDR(ctx.raw)}`
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
              },
              y: {
                grid: { color: gridColor },
                ticks: {
                  color: textColor,
                  font: { family: 'Plus Jakarta Sans', size: 10 },
                  callback: (val) => val >= 1000000 ? `${val / 1000000} Jt` : val >= 1000 ? `${val / 1000} Rb` : val
                }
              }
            }
          }
        });

        return () => {
          if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        };
      }, [transactions, year, darkMode]);

      return <canvas ref={canvasRef} className="w-full h-full" />;
    }

    // --- COMPONENT: MODAL ATUR ANGGARAN (BUDGET) ---
    function BudgetModal({ budgets, categories, onClose, onSave }) {
      const [formData, setFormData] = useState({ ...budgets });

      const handleChange = (cat, val) => {
        const clean = val.replace(/[^0-9]/g, '');
        setFormData(prev => ({
          ...prev,
          [cat]: Number(clean) || 0
        }));
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Atur Target Anggaran Bulanan
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Masukkan batas pengeluaran maksimal (Rupiah) untuk setiap kategori di bawah:
              </p>

              <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between gap-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-1/2">
                      {cat}
                    </label>
                    <div className="relative w-1/2">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-semibold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        placeholder="0"
                        value={formData[cat] ? formData[cat].toString() : ''}
                        onChange={(e) => handleChange(cat, e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
