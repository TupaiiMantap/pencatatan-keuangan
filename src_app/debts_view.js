    // --- COMPONENT: MODUL UTANG & PIUTANG TERPISAH (CICILAN & JATUH TEMPO) ---
    function DebtsView({
      debts,
      accounts,
      onAddDebt,
      onRecordPayment,
      onDeleteDebt
    }) {
      const [filterType, setFilterType] = useState('all'); // all, receivable, debt, unpaid, paid
      const [isAddModalOpen, setIsAddModalOpen] = useState(false);
      const [payingDebt, setPayingDebt] = useState(null);

      // Aggregations
      const metrics = useMemo(() => {
        let totalReceivable = 0; // piutang kita (uang di luar)
        let totalDebt = 0; // utang kita (kewajiban)
        let totalReceivableRemaining = 0;
        let totalDebtRemaining = 0;
        let upcomingCount = 0;

        debts.forEach(d => {
          const remaining = Math.max(0, Number(d.totalAmount) - (Number(d.paidAmount) || 0));
          const days = getDaysDiff(d.dueDate);

          if (d.type === 'receivable') {
            totalReceivable += Number(d.totalAmount);
            totalReceivableRemaining += remaining;
          } else {
            totalDebt += Number(d.totalAmount);
            totalDebtRemaining += remaining;
          }

          if (remaining > 0 && days <= 7) {
            upcomingCount++;
          }
        });

        return {
          totalReceivable,
          totalDebt,
          totalReceivableRemaining,
          totalDebtRemaining,
          upcomingCount
        };
      }, [debts]);

      // Filtered debts
      const filteredDebts = useMemo(() => {
        return debts.filter(d => {
          const remaining = Math.max(0, Number(d.totalAmount) - (Number(d.paidAmount) || 0));
          const isSettled = remaining <= 0;

          if (filterType === 'receivable') return d.type === 'receivable';
          if (filterType === 'debt') return d.type === 'debt';
          if (filterType === 'unpaid') return !isSettled;
          if (filterType === 'paid') return isSettled;
          return true;
        });
      }, [debts, filterType]);

      return (
        <div className="space-y-6">
          
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Piutang */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Total Piutang Saya (Aset Tertagih)
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <IconTrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {formatIDR(metrics.totalReceivableRemaining)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Uang Anda yang dipinjam pihak lain (Sisa yang belum tertagih)
                </p>
              </div>
            </div>

            {/* Card 2: Utang */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Total Utang Saya (Kewajiban)
                </span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <IconTrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {formatIDR(metrics.totalDebtRemaining)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Sisa kewajiban yang wajib Anda bayarkan
                </p>
              </div>
            </div>

            {/* Card 3: Jatuh Tempo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Pengingat Jatuh Tempo
                </span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <IconAlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {metrics.upcomingCount} Transaksi
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Jatuh tempo dalam kurun waktu 7 hari ke depan atau sudah lewat
                </p>
              </div>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'receivable', label: 'Piutang (Uang di Luar)' },
                { id: 'debt', label: 'Utang (Kewajiban)' },
                { id: 'unpaid', label: 'Belum Lunas' },
                { id: 'paid', label: 'Sudah Lunas' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    filterType === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all whitespace-nowrap"
            >
              <IconPlus className="w-4 h-4" />
              <span>Catat Utang / Piutang</span>
            </button>
          </div>

          {/* Debts List */}
          {filteredDebts.length === 0 ? (
            <div className="py-14 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
              <IconHandshake className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm">Tidak ada catatan utang/piutang pada kriteria ini.</p>
              <p className="text-xs text-slate-400 mt-0.5">Gunakan tombol "Catat Utang / Piutang" untuk membuat catatan baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredDebts.map(item => {
                const total = Number(item.totalAmount) || 0;
                const paid = Number(item.paidAmount) || 0;
                const remaining = Math.max(0, total - paid);
                const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
                const isPaid = remaining <= 0;
                const isReceivable = item.type === 'receivable';
                const daysDiff = getDaysDiff(item.dueDate);

                let dueBadge = null;
                if (isPaid) {
                  dueBadge = <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Lunas</span>;
                } else if (daysDiff < 0) {
                  dueBadge = <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Lewat {Math.abs(daysDiff)} Hari!</span>;
                } else if (daysDiff === 0) {
                  dueBadge = <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Jatuh Tempo Hari Ini</span>;
                } else if (daysDiff <= 7) {
                  dueBadge = <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200">{daysDiff} Hari Lagi</span>;
                } else {
                  dueBadge = <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{daysDiff} Hari Lagi</span>;
                }

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg ${
                            isReceivable
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {isReceivable ? 'Piutang (Uang di Luar)' : 'Utang Saya'}
                          </span>
                          {dueBadge}
                        </div>

                        <button
                          onClick={() => onDeleteDebt(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Name & Notes */}
                      <div className="mt-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{item.personName}</h3>
                        {item.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">"{item.notes}"</p>}
                      </div>

                      {/* Nominal Box */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Pokok:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{formatIDR(total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Telah Dibayar:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatIDR(paid)} ({percent}%)</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-slate-700 dark:text-slate-300">Sisa Nominal:</span>
                          <span className={isReceivable ? 'text-emerald-600' : 'text-rose-600'}>
                            {formatIDR(remaining)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isPaid ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Pinjam: {formatDateID(item.startDate || item.date)}</span>
                        <span>Jatuh Tempo: <strong className="text-slate-700 dark:text-slate-300">{formatDateID(item.dueDate)}</strong></span>
                      </div>
                    </div>

                    {/* Bottom Actions & Payment History */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {!isPaid && (
                        <button
                          onClick={() => setPayingDebt(item)}
                          className="w-full py-2 px-3 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <IconCreditCard className="w-4 h-4" />
                          <span>{isReceivable ? 'Terima Cicilan / Pelunasan' : 'Bayar Cicilan / Lunasi'}</span>
                        </button>
                      )}

                      {item.payments && item.payments.length > 0 && (
                        <details className="text-[11px] text-slate-500 pt-1">
                          <summary className="cursor-pointer font-semibold hover:text-slate-800 dark:hover:text-slate-200">
                            Riwayat Cicilan ({item.payments.length} transaksi)
                          </summary>
                          <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                            {item.payments.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDateID(p.date)}: </span>
                                  <span>{p.notes || 'Cicilan'}</span>
                                </div>
                                <span className="font-bold text-emerald-600">{formatIDR(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODAL TAMBAH UTANG / PIUTANG */}
          {isAddModalOpen && (
            <AddDebtModal
              onClose={() => setIsAddModalOpen(false)}
              onSave={(data) => {
                onAddDebt(data);
                setIsAddModalOpen(false);
              }}
            />
          )}

          {/* MODAL CATAT PEMBAYARAN CICILAN */}
          {payingDebt && (
            <DebtPaymentModal
              debt={payingDebt}
              accounts={accounts}
              onClose={() => setPayingDebt(null)}
              onSavePayment={(paymentData) => {
                onRecordPayment(payingDebt.id, paymentData);
                setPayingDebt(null);
              }}
            />
          )}

        </div>
      );
    }

    // --- SUB-COMPONENT: MODAL TAMBAH UTANG / PIUTANG ---
    function AddDebtModal({ onClose, onSave }) {
      const [type, setType] = useState('receivable'); // 'receivable' | 'debt'
      const [personName, setPersonName] = useState('');
      const [totalAmount, setTotalAmount] = useState('');
      const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
      const [dueDate, setDueDate] = useState('');
      const [notes, setNotes] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        const amt = Number(totalAmount) || 0;
        if (!personName.trim() || amt <= 0 || !dueDate) {
          alert('Mohon lengkapi nama pihak, nominal, dan tanggal jatuh tempo!');
          return;
        }

        onSave({
          type,
          personName: personName.trim(),
          totalAmount: amt,
          paidAmount: 0,
          startDate,
          dueDate,
          notes: notes.trim(),
          status: 'unpaid',
          payments: []
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Catat Utang / Piutang Baru
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('receivable')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'receivable'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Piutang (Uang Saya Dipinjam)
                </button>
                <button
                  type="button"
                  onClick={() => setType('debt')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'debt'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Utang (Saya Berutang)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pihak / Peminjam *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Pratama, Budi Santoso, Toko Makmur"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Nominal Pokok (IDR) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1500000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 text-sm font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {totalAmount > 0 && <span className="text-[11px] text-emerald-600 font-semibold">{formatIDR(totalAmount)}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pinjam
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jatuh Tempo *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows="2"
                  placeholder="Catatan tambahan perjanjian, bunga 0%, dll..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // --- SUB-COMPONENT: MODAL BAYAR / CICIL UTANG PIUTANG ---
    function DebtPaymentModal({ debt, accounts, onClose, onSavePayment }) {
      const remaining = Math.max(0, Number(debt.totalAmount) - (Number(debt.paidAmount) || 0));
      const [paymentAmount, setPaymentAmount] = useState(remaining.toString());
      const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
      const [selectedAccountId, setSelectedAccountId] = useState(accounts[0] ? accounts[0].id : '');
      const [paymentNotes, setPaymentNotes] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        const amt = Number(paymentAmount) || 0;
        if (amt <= 0) {
          alert('Mohon masukkan nominal cicilan yang valid!');
          return;
        }
        if (amt > remaining) {
          alert(`Nominal pembayaran (${formatIDR(amt)}) melebihi sisa utang/piutang (${formatIDR(remaining)})!`);
          return;
        }

        onSavePayment({
          amount: amt,
          date: paymentDate,
          accountId: selectedAccountId,
          notes: paymentNotes || (debt.type === 'receivable' ? 'Penerimaan cicilan piutang' : 'Pembayaran cicilan utang')
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                {debt.type === 'receivable' ? 'Terima Pembayaran Piutang' : 'Bayar Cicilan Utang'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">{debt.personName}</div>
                <div className="flex justify-between text-slate-500">
                  <span>Sisa yang harus diselesaikan:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(remaining)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Pembayaran (IDR) *
                </label>
                <input
                  type="text"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 text-base font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {paymentAmount > 0 && <span className="text-[11px] text-slate-400 font-semibold">{formatIDR(paymentAmount)}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {debt.type === 'receivable' ? 'Setor Uang Masuk ke Akun:' : 'Bayar dari Akun:'}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatIDR(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Pembayaran
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pembayaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Cicilan termin 2 via transfer"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
