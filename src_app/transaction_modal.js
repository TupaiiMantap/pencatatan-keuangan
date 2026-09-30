    // --- COMPONENT: MODAL FORM TRANSAKSI LENGKAP (DENGAN AKUN & OCR SHORTCUT) ---
    function TransactionModal({
      editingTx,
      accounts,
      categories,
      paymentMethods,
      onClose,
      onSave,
      onAddCategory,
      onOpenOCR
    }) {
      const [type, setType] = useState(editingTx ? editingTx.type : 'expense');
      const [accountId, setAccountId] = useState(editingTx?.accountId || (accounts[0] ? accounts[0].id : ''));
      const [amount, setAmount] = useState(editingTx ? editingTx.amount.toString() : '');
      const [displayAmount, setDisplayAmount] = useState(editingTx ? formatIDR(editingTx.amount) : '');
      const [date, setDate] = useState(editingTx ? editingTx.date : new Date().toISOString().split('T')[0]);
      const [time, setTime] = useState(editingTx ? editingTx.time : new Date().toTimeString().slice(0, 5));
      const [category, setCategory] = useState(
        editingTx ? editingTx.category : (type === 'income' ? categories.income[0] : categories.expense[0])
      );
      const [paymentMethod, setPaymentMethod] = useState(editingTx ? editingTx.paymentMethod : paymentMethods[0]);
      const [cycle, setCycle] = useState(editingTx ? editingTx.cycle : 'Sekali Jalan');
      const [notes, setNotes] = useState(editingTx ? editingTx.notes : '');

      const [isAddingNewCat, setIsAddingNewCat] = useState(false);
      const [newCatName, setNewCatName] = useState('');

      const handleTypeChange = (newType) => {
        setType(newType);
        if (!editingTx) {
          setCategory(newType === 'income' ? categories.income[0] : categories.expense[0]);
        }
      };

      const handleAmountChange = (raw) => {
        const cleanNumber = raw.replace(/[^0-9]/g, '');
        setAmount(cleanNumber);
        setDisplayAmount(cleanNumber ? formatIDR(cleanNumber) : '');
      };

      const handleQuickAddAmount = (addValue) => {
        const current = Number(amount) || 0;
        const total = current + addValue;
        setAmount(total.toString());
        setDisplayAmount(formatIDR(total));
      };

      const handleCreateCategory = (e) => {
        e.preventDefault();
        if (newCatName.trim()) {
          onAddCategory(type, newCatName.trim());
          setCategory(newCatName.trim());
          setNewCatName('');
          setIsAddingNewCat(false);
        }
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) {
          alert('Mohon masukkan jumlah nominal yang valid!');
          return;
        }

        onSave({
          type,
          accountId,
          amount: Number(amount),
          date,
          time,
          category,
          paymentMethod,
          cycle,
          notes
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {editingTx ? 'Edit Catatan Transaksi' : 'Tambah Transaksi Baru'}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                {!editingTx && (
                  <button
                    type="button"
                    onClick={onOpenOCR}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                  >
                    <IconCameraScan className="w-3.5 h-3.5" />
                    <span>Scan Struk (OCR)</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Type Switcher: Pemasukan vs Pengeluaran */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'expense'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Wadah / Akun Keuangan *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: {formatIDR(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input with Rupiah Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal (IDR) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 150000"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 text-base font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {displayAmount && (
                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Format: {displayAmount}
                  </p>
                )}

                {/* Quick Add Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 mr-1">Pintasan:</span>
                  {[
                    { label: '+50rb', val: 50000 },
                    { label: '+100rb', val: 100000 },
                    { label: '+500rb', val: 500000 },
                    { label: '+1jt', val: 1000000 },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickAddAmount(btn.val)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category with Add New feature */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kategori *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {isAddingNewCat ? 'Batal Tambah' : '+ Tambah Kategori Baru'}
                  </button>
                </div>

                {isAddingNewCat ? (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nama kategori baru..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-3 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {(type === 'income' ? categories.income : categories.expense).map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Payment Method & Cycle Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {paymentMethods.map((pm, idx) => (
                      <option key={idx} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Siklus Transaksi
                  </label>
                  <select
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Sekali Jalan">Sekali Jalan</option>
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows="2"
                  placeholder="Catatan tambahan (contoh: Makan siang di resto A bersama tim)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {editingTx ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </button>
              </div>

            </form>
          </div>
        </div>
      );
    }
