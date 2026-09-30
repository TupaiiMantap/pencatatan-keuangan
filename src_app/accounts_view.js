    // --- COMPONENT: MANAJEMEN WADAH & AKUN (ASET, TRANSFER, REKONSILIASI) ---
    function AccountsView({
      accounts,
      onAddAccount,
      onEditAccount,
      onDeleteAccount,
      onTransfer,
      onReconcile,
      transactions
    }) {
      const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
      const [editingAccount, setEditingAccount] = useState(null);
      const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
      const [transferFromId, setTransferFromId] = useState(null);
      const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
      const [reconcileAccount, setReconcileAccount] = useState(null);

      // Total Net Worth across all accounts
      const totalNetWorth = useMemo(() => {
        return accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
      }, [accounts]);

      const getAccountTypeIcon = (type) => {
        switch (type) {
          case 'bank': return <IconBuildingBank className="w-5 h-5" />;
          case 'ewallet': return <IconQrCode className="w-5 h-5" />;
          case 'credit': return <IconCreditCard className="w-5 h-5" />;
          default: return <IconWallet className="w-5 h-5" />;
        }
      };

      const getAccountTypeLabel = (type) => {
        switch (type) {
          case 'bank': return 'Bank Rekening';
          case 'ewallet': return 'E-Wallet / Dompet Digital';
          case 'credit': return 'Kartu Kredit / Paylater';
          case 'investment': return 'Investasi / Tabungan Berjangka';
          default: return 'Uang Tunai (Cash)';
        }
      };

      return (
        <div className="space-y-6">
          
          {/* Header & Net Worth Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Total Kekayaan Bersih (Seluruh Wadah)
                </span>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                  {formatIDR(totalNetWorth)}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Tersebar di {accounts.length} wadah keuangan aktif (Cash, Bank, E-Wallet)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md rounded-xl border border-white/15 transition-all"
                >
                  <IconArrowRightLeft className="w-4 h-4 text-emerald-400" />
                  <span>Transfer Antar-Akun</span>
                </button>
                <button
                  onClick={() => { setEditingAccount(null); setIsAddEditModalOpen(true); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <IconPlus className="w-4 h-4" />
                  <span>Tambah Wadah Baru</span>
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {/* Accounts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc) => {
              const proportion = totalNetWorth > 0 ? Math.round((acc.balance / totalNetWorth) * 100) : 0;
              return (
                <div
                  key={acc.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Type & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${
                          acc.type === 'bank' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' :
                          acc.type === 'ewallet' ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400' :
                          'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}>
                          {getAccountTypeIcon(acc.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{acc.name}</h3>
                          <span className="text-[11px] text-slate-400">{getAccountTypeLabel(acc.type)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingAccount(acc); setIsAddEditModalOpen(true); }}
                          title="Edit Akun"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <IconEdit className="w-3.5 h-3.5" />
                        </button>
                        {accounts.length > 1 && (
                          <button
                            onClick={() => onDeleteAccount(acc.id)}
                            title="Hapus Akun"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Saldo Nominal */}
                    <div className="mt-4">
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                        {formatIDR(acc.balance)}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Porsi terhadap total aset:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{proportion}%</span>
                      </div>
                    </div>

                    {/* Progress Bar of Proportion */}
                    <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(proportion, 100)}%` }}
                      ></div>
                    </div>

                    {acc.notes && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                        "{acc.notes}"
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setTransferFromId(acc.id);
                        setIsTransferModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <IconArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transfer</span>
                    </button>
                    <span className="text-slate-200 dark:text-slate-700">|</span>
                    <button
                      onClick={() => {
                        setReconcileAccount(acc);
                        setIsReconcileModalOpen(true);
                      }}
                      title="Cocokkan saldo catatan dengan uang riil fisik"
                      className="flex-1 py-1.5 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <IconScale className="w-3.5 h-3.5" />
                      <span>Rekonsiliasi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MODAL TAMBAH / EDIT AKUN */}
          {isAddEditModalOpen && (
            <AddEditAccountModal
              editingAccount={editingAccount}
              onClose={() => { setIsAddEditModalOpen(false); setEditingAccount(null); }}
              onSave={(accountData) => {
                if (editingAccount) {
                  onEditAccount(editingAccount.id, accountData);
                } else {
                  onAddAccount(accountData);
                }
                setIsAddEditModalOpen(false);
                setEditingAccount(null);
              }}
            />
          )}

          {/* MODAL TRANSFER ANTAR-AKUN */}
          {isTransferModalOpen && (
            <TransferModal
              accounts={accounts}
              initialFromId={transferFromId}
              onClose={() => { setIsTransferModalOpen(false); setTransferFromId(null); }}
              onSaveTransfer={(transferData) => {
                onTransfer(transferData);
                setIsTransferModalOpen(false);
                setTransferFromId(null);
              }}
            />
          )}

          {/* MODAL REKONSILIASI SALDO */}
          {isReconcileModalOpen && reconcileAccount && (
            <ReconciliationModal
              account={reconcileAccount}
              onClose={() => { setIsReconcileModalOpen(false); setReconcileAccount(null); }}
              onSaveReconciliation={(reconcileData) => {
                onReconcile(reconcileData);
                setIsReconcileModalOpen(false);
                setReconcileAccount(null);
              }}
            />
          )}

        </div>
      );
    }

    // --- SUB-COMPONENT: MODAL TAMBAH / EDIT AKUN ---
    function AddEditAccountModal({ editingAccount, onClose, onSave }) {
      const [name, setName] = useState(editingAccount ? editingAccount.name : '');
      const [type, setType] = useState(editingAccount ? editingAccount.type : 'bank');
      const [balance, setBalance] = useState(editingAccount ? editingAccount.balance.toString() : '0');
      const [notes, setNotes] = useState(editingAccount ? editingAccount.notes : '');

      const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
          alert('Mohon masukkan nama wadah / akun!');
          return;
        }
        onSave({
          name: name.trim(),
          type,
          balance: Number(balance) || 0,
          notes: notes.trim()
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                {editingAccount ? 'Edit Wadah Keuangan' : 'Tambah Wadah / Akun Baru'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Akun / Wadah *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank BCA, GoPay, Dompet Tunai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Wadah
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Uang Tunai (Cash / Dompet)</option>
                  <option value="bank">Rekening Bank (BCA, Mandiri, BRI, dll)</option>
                  <option value="ewallet">E-Wallet (GoPay, OVO, Dana, ShopeePay)</option>
                  <option value="credit">Kartu Kredit / Paylater</option>
                  <option value="investment">Investasi / Tabungan Khusus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {editingAccount ? 'Saldo Saat Ini (IDR)' : 'Saldo Awal (IDR)'}
                </label>
                <input
                  type="text"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 text-sm font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 font-semibold">{formatIDR(balance)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Nomor Rekening (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: No. Rek: 1234567890 a.n Anda"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // --- SUB-COMPONENT: MODAL TRANSFER ANTAR-AKUN ---
    function TransferModal({ accounts, initialFromId, onClose, onSaveTransfer }) {
      const [fromAccountId, setFromAccountId] = useState(initialFromId || (accounts[0] ? accounts[0].id : ''));
      const [toAccountId, setToAccountId] = useState(
        accounts.find(a => a.id !== (initialFromId || accounts[0]?.id))?.id || accounts[1]?.id || ''
      );
      const [amount, setAmount] = useState('');
      const [adminFee, setAdminFee] = useState('0');
      const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
      const [notes, setNotes] = useState('');

      const sourceAccount = accounts.find(a => a.id === fromAccountId);
      const destAccount = accounts.find(a => a.id === toAccountId);

      const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = Number(amount) || 0;
        const numFee = Number(adminFee) || 0;

        if (numAmount <= 0) {
          alert('Mohon masukkan nominal transfer yang valid!');
          return;
        }

        if (fromAccountId === toAccountId) {
          alert('Akun pengirim dan tujuan tidak boleh sama!');
          return;
        }

        if (sourceAccount && sourceAccount.balance < (numAmount + numFee)) {
          if (!window.confirm(`Peringatan: Saldo ${sourceAccount.name} (${formatIDR(sourceAccount.balance)}) kurang dari nominal transfer + biaya (${formatIDR(numAmount + numFee)}). Lanjutkan transfer?`)) {
            return;
          }
        }

        onSaveTransfer({
          fromAccountId,
          toAccountId,
          amount: numAmount,
          adminFee: numFee,
          date,
          notes: notes || `Transfer dari ${sourceAccount?.name} ke ${destAccount?.name}`
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <IconArrowRightLeft className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  Transfer Antar-Wadah
                </h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pindahkan saldo antar akun tanpa mencatatnya sebagai pengeluaran atau pemasukan baru.
              </p>

              {/* Source & Destination Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Dari Akun (Pengirim)
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatIDR(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Ke Akun (Penerima)
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                        {acc.name} ({formatIDR(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Admin Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Transfer (IDR) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 500000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 text-sm font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {amount > 0 && <span className="text-[11px] text-emerald-600 font-semibold">{formatIDR(amount)}</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Biaya Admin (Jika Ada)
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={adminFee}
                    onChange={(e) => setAdminFee(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {Number(adminFee) > 0 && <span className="text-[11px] text-rose-500 font-semibold">{formatIDR(adminFee)}</span>}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Transfer
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Memo
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Top-up e-wallet untuk belanja mingguan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md"
                >
                  Eksekusi Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // --- SUB-COMPONENT: MODAL REKONSILIASI SALDO (PENYESUAIAN SALDO RIIL) ---
    function ReconciliationModal({ account, onClose, onSaveReconciliation }) {
      const [realBalance, setRealBalance] = useState(account.balance.toString());
      const [reason, setReason] = useState('');

      const recordedBalance = Number(account.balance) || 0;
      const physicalBalance = Number(realBalance) || 0;
      const difference = physicalBalance - recordedBalance;

      const handleSubmit = (e) => {
        e.preventDefault();
        if (difference === 0) {
          alert('Saldo riil sama persis dengan saldo tercatat di aplikasi. Tidak diperlukan penyesuaian.');
          return;
        }

        onSaveReconciliation({
          accountId: account.id,
          recordedBalance,
          physicalBalance,
          difference,
          reason: reason || (difference > 0 ? 'Penyesuaian saldo riil lebih' : 'Penyesuaian saldo riil kurang'),
          date: new Date().toISOString().split('T')[0]
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <IconScale className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  Rekonsiliasi Saldo: {account.name}
                </h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cocokkan saldo catatan di aplikasi dengan jumlah uang fisik/riil sebenarnya (misalnya uang tunai di dompet atau mutasi bank).
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo Tercatat di Aplikasi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatIDR(recordedBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selisih Penyesuaian:</span>
                  <span className={`font-bold ${difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {difference > 0 ? `+${formatIDR(difference)} (Kelebihan)` : difference < 0 ? `-${formatIDR(Math.abs(difference))} (Kekurangan)` : 'Rp 0 (Sesuai)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Saldo Riil Sebenarnya (IDR) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan jumlah saldo fisik nyata"
                  value={realBalance}
                  onChange={(e) => setRealBalance(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 text-base font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 font-semibold">{formatIDR(realBalance)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan / Keterangan Penyesuaian
                </label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Uang parkir & tip yang lupa dicatat, biaya admin bank, dll..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md"
                >
                  Simpan Penyesuaian Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
