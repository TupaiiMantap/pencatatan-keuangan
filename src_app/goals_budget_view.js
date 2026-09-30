    // --- COMPONENT: GOALS (TABUNGAN IMPIAN) & ANGGARAN (BUDGETING) ---
    function GoalsAndBudgetView({
      goals,
      budgets,
      categories,
      categorySpending,
      accounts,
      onAddGoal,
      onEditGoal,
      onDeleteGoal,
      onAllocateGoal,
      onSaveBudgets
    }) {
      const [activeSubTab, setActiveSubTab] = useState('goals'); // 'goals' | 'budgets'
      const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
      const [editingGoal, setEditingGoal] = useState(null);
      const [allocatingGoal, setAllocatingGoal] = useState(null);
      const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

      return (
        <div className="space-y-6">
          
          {/* Sub-navigation Pill Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveSubTab('goals')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeSubTab === 'goals'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <IconTarget className="w-4 h-4" />
                <span>Financial Goals & Tabungan Impian ({goals.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('budgets')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeSubTab === 'budgets'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <IconPieChart className="w-4 h-4" />
                <span>Target Anggaran Bulanan</span>
              </button>
            </div>

            {activeSubTab === 'goals' ? (
              <button
                onClick={() => { setEditingGoal(null); setIsAddGoalModalOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all"
              >
                <IconPlus className="w-4 h-4" />
                <span>Buat Target Impian Baru</span>
              </button>
            ) : (
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 rounded-xl transition-all"
              >
                <IconEdit className="w-4 h-4" />
                <span>Set Batas Anggaran</span>
              </button>
            )}
          </div>

          {/* SUB-VIEW 1: GOALS / TABUNGAN IMPIAN */}
          {activeSubTab === 'goals' && (
            <div className="space-y-6">
              {goals.length === 0 ? (
                <div className="py-14 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  <IconTarget className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-sm">Belum ada target tabungan impian.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Wujudkan impian finansial Anda dengan membuat goal baru.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {goals.map((goal) => {
                    const target = Number(goal.targetAmount) || 0;
                    const current = Number(goal.currentAmount) || 0;
                    const remaining = Math.max(0, target - current);
                    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;
                    const daysLeft = getDaysDiff(goal.deadline);
                    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
                    const monthlyRequired = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;
                    const isCompleted = current >= target;

                    return (
                      <div
                        key={goal.id}
                        className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                          isCompleted
                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/15'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div>
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {goal.category || 'Target Tabungan'}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setEditingGoal(goal); setIsAddGoalModalOpen(true); }}
                                className="p-1 text-slate-400 hover:text-emerald-600"
                              >
                                <IconEdit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteGoal(goal.id)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                              >
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-2">
                            {goal.name}
                          </h3>
                          {goal.notes && (
                            <p className="text-xs text-slate-400 italic line-clamp-1">"{goal.notes}"</p>
                          )}

                          {/* Amounts */}
                          <div className="mt-4 space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-slate-500">Terkumpul:</span>
                              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                {formatIDR(current)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Target:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatIDR(target)}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3 w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{percent}% Tercapai</span>
                            <span className="text-slate-400">Sisa {formatIDR(remaining)}</span>
                          </div>

                          {/* Plan Timeline & Monthly Advice */}
                          {!isCompleted && (
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-[11px] space-y-1">
                              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Tenggat Waktu:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formatDateID(goal.deadline)} ({daysLeft > 0 ? `${daysLeft} hari lagi` : 'Sudah lewat'})</span>
                              </div>
                              {daysLeft > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <span>Perlu menabung:</span>
                                  <span>{formatIDR(monthlyRequired)} / bulan</span>
                                </div>
                              )}
                            </div>
                          )}

                          {isCompleted && (
                            <div className="mt-3 p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
                              🎉 Target Impian Telah Terpenuhi 100%!
                            </div>
                          )}
                        </div>

                        {/* Allocate Funds Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <button
                            onClick={() => setAllocatingGoal(goal)}
                            className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <IconPlus className="w-3.5 h-3.5" />
                            <span>Setor / Alokasikan Saldo</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 2: ANGGARAN BULANAN (BUDGETS) */}
          {activeSubTab === 'budgets' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.expense.map((category) => {
                  const limit = budgets[category] || 0;
                  const spent = categorySpending[category] || 0;
                  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                  const isExceeded = limit > 0 && spent > limit;
                  const isWarning = limit > 0 && percent >= 80 && !isExceeded;

                  return (
                    <div
                      key={category}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all ${
                        isExceeded
                          ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/20'
                          : isWarning
                          ? 'border-amber-300 dark:border-amber-900/80 bg-amber-50/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{category}</h3>
                        {limit > 0 ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isExceeded
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                              : isWarning
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                          }`}>
                            {percent}% Terpakai
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum diset</span>
                        )}
                      </div>

                      <div className="mt-4 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Terpakai:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatIDR(spent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Batas Anggaran:</span>
                          <span className="font-medium text-slate-600 dark:text-slate-400">{limit > 0 ? formatIDR(limit) : '-'}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        ></div>
                      </div>

                      {/* Alert Message */}
                      <div className="mt-3 text-xs">
                        {isExceeded && (
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                            <IconAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Overbudget sebesar {formatIDR(spent - limit)}!</span>
                          </div>
                        )}
                        {isWarning && (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <IconAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Waspada! Sisa {formatIDR(limit - spent)}.</span>
                          </div>
                        )}
                        {!isExceeded && !isWarning && limit > 0 && (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <IconCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Sisa aman: {formatIDR(limit - spent)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODAL TAMBAH / EDIT GOAL */}
          {isAddGoalModalOpen && (
            <AddEditGoalModal
              editingGoal={editingGoal}
              onClose={() => { setIsAddGoalModalOpen(false); setEditingGoal(null); }}
              onSave={(data) => {
                if (editingGoal) {
                  onEditGoal(editingGoal.id, data);
                } else {
                  onAddGoal(data);
                }
                setIsAddGoalModalOpen(false);
                setEditingGoal(null);
              }}
            />
          )}

          {/* MODAL SETOR / ALOKASIKAN DANA KE GOAL */}
          {allocatingGoal && (
            <AllocateGoalModal
              goal={allocatingGoal}
              accounts={accounts}
              onClose={() => setAllocatingGoal(null)}
              onSaveAllocation={(data) => {
                onAllocateGoal(allocatingGoal.id, data);
                setAllocatingGoal(null);
              }}
            />
          )}

          {/* MODAL EDIT BUDGET */}
          {isBudgetModalOpen && (
            <BudgetModal
              budgets={budgets}
              categories={categories.expense}
              onClose={() => setIsBudgetModalOpen(false)}
              onSave={(newBudgets) => {
                onSaveBudgets(newBudgets);
                setIsBudgetModalOpen(false);
              }}
            />
          )}

        </div>
      );
    }

    // --- SUB-COMPONENT: MODAL TAMBAH / EDIT GOAL ---
    function AddEditGoalModal({ editingGoal, onClose, onSave }) {
      const [name, setName] = useState(editingGoal ? editingGoal.name : '');
      const [targetAmount, setTargetAmount] = useState(editingGoal ? editingGoal.targetAmount.toString() : '');
      const [currentAmount, setCurrentAmount] = useState(editingGoal ? editingGoal.currentAmount.toString() : '0');
      const [deadline, setDeadline] = useState(editingGoal ? editingGoal.deadline : '');
      const [category, setCategory] = useState(editingGoal ? editingGoal.category : 'Tabungan');
      const [notes, setNotes] = useState(editingGoal ? editingGoal.notes : '');

      const handleSubmit = (e) => {
        e.preventDefault();
        const target = Number(targetAmount) || 0;
        if (!name.trim() || target <= 0 || !deadline) {
          alert('Mohon isi nama impian, target nominal, dan tenggat waktu!');
          return;
        }

        onSave({
          name: name.trim(),
          targetAmount: target,
          currentAmount: Number(currentAmount) || 0,
          deadline,
          category,
          notes: notes.trim()
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                {editingGoal ? 'Edit Target Impian' : 'Buat Target Impian Baru'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Target Impian *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Darurat, Beli Laptop, Liburan Jepang"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Jumlah (IDR) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 15000000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 text-sm font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {targetAmount > 0 && <span className="text-[11px] text-emerald-600 font-semibold">{formatIDR(targetAmount)}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dana Sudah Terkumpul Awal (IDR)
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tenggat Waktu *
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Keamanan">Keamanan / Dana Darurat</option>
                    <option value="Investasi">Investasi Masa Depan</option>
                    <option value="Barang">Barang / Gadget</option>
                    <option value="Kendaraan">Kendaraan / Properti</option>
                    <option value="Lifestyle">Liburan / Lifestyle</option>
                    <option value="Pendidikan">Pendidikan / Kursus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Motivasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Konsisten menabung 500rb per bulan!"
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
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // --- SUB-COMPONENT: MODAL SETOR / ALOKASIKAN DANA DARI AKUN ---
    function AllocateGoalModal({ goal, accounts, onClose, onSaveAllocation }) {
      const remaining = Math.max(0, Number(goal.targetAmount) - (Number(goal.currentAmount) || 0));
      const [amount, setAmount] = useState('');
      const [fromAccountId, setFromAccountId] = useState(accounts[0] ? accounts[0].id : '');
      const [actionType, setActionType] = useState('deposit'); // 'deposit' (setor) | 'withdraw' (tarik)

      const selectedAccount = accounts.find(a => a.id === fromAccountId);

      const handleSubmit = (e) => {
        e.preventDefault();
        const amt = Number(amount) || 0;
        if (amt <= 0) {
          alert('Mohon masukkan nominal yang valid!');
          return;
        }

        if (actionType === 'deposit' && selectedAccount && selectedAccount.balance < amt) {
          if (!window.confirm(`Saldo di ${selectedAccount.name} (${formatIDR(selectedAccount.balance)}) lebih kecil dari nominal setor (${formatIDR(amt)}). Lanjutkan?`)) {
            return;
          }
        }

        onSaveAllocation({
          actionType,
          amount: amt,
          accountId: fromAccountId,
          date: new Date().toISOString().split('T')[0]
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Alokasi Saldo: {goal.name}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Deposit vs Withdraw tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActionType('deposit')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    actionType === 'deposit' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Setor / Tabung Dana
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('withdraw')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    actionType === 'withdraw' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tarik Dana Kembali
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Terkumpul Saat Ini:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(goal.currentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sisa Menuju Target:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatIDR(remaining)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal (IDR) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 text-base font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {amount > 0 && <span className="text-[11px] text-slate-400 font-semibold">{formatIDR(amount)}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {actionType === 'deposit' ? 'Ambil Saldo Dari Wadah:' : 'Kembalikan Saldo Ke Wadah:'}
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatIDR(acc.balance)})
                    </option>
                  ))}
                </select>
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
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md ${
                    actionType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {actionType === 'deposit' ? 'Konfirmasi Setor' : 'Konfirmasi Tarik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
