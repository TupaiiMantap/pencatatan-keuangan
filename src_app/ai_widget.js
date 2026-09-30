    // --- COMPONENT: AI INSIGHT & REKOMENDASI PINTAR WIDGET ---
    function AIInsightWidget({
      metrics,
      periodFilteredTransactions,
      categorySpending,
      goals,
      debts,
      filterPeriod
    }) {
      const [isRefreshing, setIsRefreshing] = useState(false);
      const [randomTipIndex, setRandomTipIndex] = useState(0);

      // Financial intelligence calculations
      const insights = useMemo(() => {
        const totalInc = metrics.totalIncome || 0;
        const totalExp = metrics.totalExpense || 0;
        const net = totalInc - totalExp;

        // Savings Rate
        const savingsRate = totalInc > 0 ? Math.max(0, Math.round(((totalInc - totalExp) / totalInc) * 100)) : 0;

        // Top Category
        let topCategory = null;
        let topCategoryAmount = 0;
        Object.entries(categorySpending).forEach(([cat, amt]) => {
          if (amt > topCategoryAmount) {
            topCategory = cat;
            topCategoryAmount = amt;
          }
        });
        const topCatPercent = totalExp > 0 ? Math.round((topCategoryAmount / totalExp) * 100) : 0;

        // Daily Burn rate
        const daysInPeriod = filterPeriod === 'monthly' ? 30 : filterPeriod === 'yearly' ? 365 : 7;
        const dailyBurnRate = Math.round(totalExp / (daysInPeriod || 1));

        // Debts status
        const urgentDebts = debts.filter(d => {
          const rem = Math.max(0, Number(d.totalAmount) - (Number(d.paidAmount) || 0));
          const days = getDaysDiff(d.dueDate);
          return rem > 0 && d.type === 'debt' && days <= 7;
        });

        // Recommendations List
        const recommendations = [];

        // 1. Advice on Top Category
        if (topCategory && topCatPercent >= 30) {
          recommendations.push({
            type: 'warning',
            title: `Efisiensi Pos "${topCategory}"`,
            text: `Kategori ini menyerap ${topCatPercent}% (${formatIDR(topCategoryAmount)}) dari total belanja Anda. Disarankan pangkas pos sekunder hingga 10-15% untuk cadangan darurat.`
          });
        }

        // 2. Advice on Cashflow Surplus / Deficit
        if (net > 0) {
          const topGoal = goals.find(g => (Number(g.currentAmount) || 0) < (Number(g.targetAmount) || 0));
          if (topGoal) {
            const suggestedAlloc = Math.round(net * 0.4);
            recommendations.push({
              type: 'opportunity',
              title: `Peluang Akselerasi Goal: "${topGoal.name}"`,
              text: `Surplus arus kas periode ini mencapai ${formatIDR(net)}. Pertimbangkan untuk mengalokasikan ${formatIDR(suggestedAlloc)} langsung ke tabungan impian Anda!`
            });
          } else {
            recommendations.push({
              type: 'opportunity',
              title: 'Arus Kas Surplus Optimal',
              text: `Pertahankan tingkat rasio tabungan ${savingsRate}%. Dana mengendap dapat dialokasikan ke instrumen pasar uang atau deposito berbunga.`
            });
          }
        } else if (net < 0) {
          recommendations.push({
            type: 'alert',
            title: 'Arus Kas Defisit (Perlu Pengetatan)',
            text: `Pengeluaran melampaui pemasukan sebesar ${formatIDR(Math.abs(net))}. Tunda pengeluaran non-primer dan prioritaskan hanya kebutuhan pokok.`
          });
        }

        // 3. Advice on Debts Due Soon
        if (urgentDebts.length > 0) {
          recommendations.push({
            type: 'alert',
            title: 'Pengingat Pembayaran Utang',
            text: `Ada ${urgentDebts.length} kewajiban utang mendekati jatuh tempo dalam 7 hari. Amankan likuiditas di rekening utama Anda untuk menghindari denda!`
          });
        }

        // 4. Rule of Thumb Benchmark
        if (savingsRate >= 30) {
          recommendations.push({
            type: 'success',
            title: 'Pilar 50/30/20 Sangat Prima',
            text: `Tingkat tabungan Anda berada di angka ${savingsRate}%, melebihi rekomendasi umum 20%. Anda berada di jalur aman menuju kebebasan finansial.`
          });
        } else if (savingsRate < 10 && totalInc > 0) {
          recommendations.push({
            type: 'warning',
            title: 'Tingkatkan Rasio Menabung',
            text: `Rasio tabungan saat ini masih di bawah 10%. Usahakan prinsip "Bayar Diri Sendiri Dulu" (sisihkan di awal gajian, bukan dari sisa akhir bulan).`
          });
        }

        return {
          savingsRate,
          dailyBurnRate,
          topCategory,
          topCategoryAmount,
          topCatPercent,
          recommendations
        };
      }, [metrics, categorySpending, goals, debts, filterPeriod]);

      const handleRefreshAI = () => {
        setIsRefreshing(true);
        setTimeout(() => {
          setIsRefreshing(false);
          setRandomTipIndex(prev => (prev + 1) % 4);
        }, 500);
      };

      const extraQuotes = [
        "Tips FinAI: Konsistensi pencatatan kecil setiap hari adalah kunci utama kesehatan finansial jangka panjang.",
        "Tips FinAI: Pisahkan wadah operasional belanja harian dengan rekening penampung dana darurat.",
        "Tips FinAI: Buat anggaran realistis. Lebih baik anggaran fleksibel yang dipatuhi daripada anggaran ketat yang dilanggar.",
        "Tips FinAI: Prioritaskan pelunasan utang berbunga tinggi sebelum menambah alokasi instrumen investasi agresif."
      ];

      return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-indigo-900/60 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-indigo-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <IconSparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight text-white">
                    FinAI Financial Intelligence
                  </h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live Analyzer
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Analisis tren otomatis & rekomendasi optimasi pengeluaran Anda
                </p>
              </div>
            </div>

            <button
              onClick={handleRefreshAI}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-indigo-200 transition-all border border-white/10"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>✨</span>
              <span>{isRefreshing ? 'Menganalisis...' : 'Perbarui Analisis'}</span>
            </button>
          </div>

          {/* Key Metric Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                Rasio Tabungan (Savings Rate)
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {insights.savingsRate}%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Target sehat finansial: min 20%
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Burn Rate Rata-Rata Harian
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {formatIDR(insights.dailyBurnRate)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pengeluaran rata-rata per hari
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Pos Belanja Terbesar
              </span>
              <div className="text-base font-extrabold text-white mt-1 truncate">
                {insights.topCategory || '-'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {insights.topCategory ? `${formatIDR(insights.topCategoryAmount)} (${insights.topCatPercent}%)` : 'Belum ada data'}
              </p>
            </div>

          </div>

          {/* Actionable Recommendations List */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rekomendasi Cerdas untuk Anda:
            </span>

            {insights.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-3.5 transition-colors flex items-start gap-3 text-xs"
              >
                <div className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                  rec.type === 'opportunity' ? 'bg-teal-500/20 text-teal-300' :
                  rec.type === 'alert' ? 'bg-rose-500/20 text-rose-300' :
                  rec.type === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  <IconSparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{rec.title}</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{rec.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer quote */}
          <div className="mt-4 pt-3 border-t border-indigo-900/40 text-[11px] text-indigo-300 italic flex items-center justify-between">
            <span>💡 {extraQuotes[randomTipIndex]}</span>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      );
    }
