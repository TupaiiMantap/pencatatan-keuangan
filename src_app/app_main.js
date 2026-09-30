    // --- MAIN APP COMPONENT ---
    function App() {
      // 1. GLOBAL PROFILES & SECURITY STATES
      const [profiles, setProfiles] = useState(() => {
        const saved = localStorage.getItem('finansialku_pro_profiles');
        return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
      });

      const [activeProfileId, setActiveProfileId] = useState(() => {
        const saved = localStorage.getItem('finansialku_pro_active_profile');
        return saved || 'personal';
      });

      const [security, setSecurity] = useState(() => {
        const saved = localStorage.getItem('finansialku_pro_security');
        const defaultSec = { pinEnabled: false, pinCode: '', biometricEnabled: true, isLocked: false };
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultSec, ...parsed, isLocked: parsed.pinEnabled ? true : false };
        }
        return defaultSec;
      });

      const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('finansialku_dark_mode');
        return saved ? JSON.parse(saved) : false;
      });

      // 2. FIREBASE AUTH & CLOUD SYNC STATES
      const [firebaseUser, setFirebaseUser] = useState(null);
      const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
      const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
      const [lastSyncedAt, setLastSyncedAt] = useState(null);
      const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

      // 3. MULTI-PROFILE DATA STORE (MIGRATION INCLUDED)
      const [allProfileData, setAllProfileData] = useState(() => {
        const saved = localStorage.getItem('finansialku_pro_data_v1');
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch(e) {
            console.error(e);
          }
        }

        // Migration from legacy v3 if available
        let migratedTransactions = [];
        let migratedBudgets = {};
        try {
          const legacyTx = localStorage.getItem('finansialku_transactions_v3');
          if (legacyTx) migratedTransactions = JSON.parse(legacyTx);
          const legacyBudgets = localStorage.getItem('finansialku_budgets_v3');
          if (legacyBudgets) migratedBudgets = JSON.parse(legacyBudgets);
        } catch(e) {}

        const initialPersonalAccounts = DEFAULT_ACCOUNTS.personal.map((acc, idx) => {
          if (idx === 0 && migratedTransactions.length > 0) {
            return { ...acc, notes: 'Akun utama catatan sebelumnya' };
          }
          return acc;
        });

        const initialData = {
          personal: {
            accounts: initialPersonalAccounts,
            transactions: migratedTransactions.map(t => ({
              ...t,
              accountId: t.accountId || 'acc-cash'
            })),
            budgets: migratedBudgets,
            categories: DEFAULT_CATEGORIES,
            goals: DEFAULT_GOALS.personal,
            debts: DEFAULT_DEBTS.personal
          },
          business: {
            accounts: DEFAULT_ACCOUNTS.business,
            transactions: [],
            budgets: {},
            categories: DEFAULT_CATEGORIES,
            goals: DEFAULT_GOALS.business,
            debts: DEFAULT_DEBTS.business
          }
        };

        localStorage.setItem('finansialku_pro_data_v1', JSON.stringify(initialData));
        return initialData;
      });

      // Navigation & Filter States
      const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'accounts' | 'transactions' | 'budgets_goals' | 'debts'
      const today = new Date();
      const [filterPeriod, setFilterPeriod] = useState('monthly'); // 'all' | 'daily' | 'monthly' | 'yearly'
      const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
      const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
      const [selectedYear, setSelectedYear] = useState(today.getFullYear());

      // Search & Table Filters
      const [searchQuery, setSearchQuery] = useState('');
      const [typeFilter, setTypeFilter] = useState('all');
      const [categoryFilter, setCategoryFilter] = useState('all');
      const [accountFilter, setAccountFilter] = useState('all');
      const [sortBy, setSortBy] = useState('date-desc');

      // Modals
      const [isTxModalOpen, setIsTxModalOpen] = useState(false);
      const [editingTx, setEditingTx] = useState(null);
      const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
      const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
      const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
      const [newProfileName, setNewProfileName] = useState('');
      const [newProfileIcon, setNewProfileIcon] = useState('💼');
      const [toastMsg, setToastMsg] = useState(null);

      // Active Profile Data references
      const currentData = allProfileData[activeProfileId] || {
        accounts: DEFAULT_ACCOUNTS.personal,
        transactions: [],
        budgets: {},
        categories: DEFAULT_CATEGORIES,
        goals: [],
        debts: []
      };

      const accounts = currentData.accounts || [];
      const transactions = currentData.transactions || [];
      const budgets = currentData.budgets || {};
      const categories = currentData.categories || DEFAULT_CATEGORIES;
      const goals = currentData.goals || [];
      const debts = currentData.debts || [];

      const showToast = (message, type = 'success') => {
        setToastMsg({ message, type });
        setTimeout(() => setToastMsg(null), 3500);
      };

      // 4. FIREBASE AUTH STATE LISTENER & REALTIME SYNC
      useEffect(() => {
        let unsubscribeSnapshot = () => {};

        const unsubscribeAuth = authService.onAuthStateChanged((user) => {
          setFirebaseUser(user);
          if (user) {
            setCloudSyncStatus('syncing');
            // Listen to real-time changes from Firestore
            unsubscribeSnapshot = cloudSyncService.subscribeUserData(user.uid, (cloudData) => {
              if (cloudData && cloudData.data) {
                setAllProfileData(cloudData.data);
                if (cloudData.profiles) setProfiles(cloudData.profiles);
                if (cloudData.security) setSecurity(cloudData.security);
                setCloudSyncStatus('synced');
                setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
              } else {
                // Initial upload of existing local data to cloud
                handleManualCloudSave(user.uid);
              }
            });
          } else {
            setCloudSyncStatus('offline');
          }
        });

        return () => {
          unsubscribeAuth();
          unsubscribeSnapshot();
        };
      }, []);

      // Auto-save to cloud on local changes if logged in (debounced)
      useEffect(() => {
        if (!firebaseUser) return;
        const timer = setTimeout(() => {
          handleManualCloudSave(firebaseUser.uid);
        }, 1200);

        return () => clearTimeout(timer);
      }, [allProfileData, profiles, security, firebaseUser]);

      const handleManualCloudSave = async (userId = firebaseUser?.uid) => {
        if (!userId) return;
        setCloudSyncStatus('syncing');
        const success = await cloudSyncService.saveUserData(userId, {
          profiles,
          activeProfileId,
          security,
          data: allProfileData
        });
        if (success) {
          setCloudSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setCloudSyncStatus('error');
        }
      };

      // Local storage synchronization
      useEffect(() => {
        localStorage.setItem('finansialku_pro_profiles', JSON.stringify(profiles));
      }, [profiles]);

      useEffect(() => {
        localStorage.setItem('finansialku_pro_active_profile', activeProfileId);
      }, [activeProfileId]);

      useEffect(() => {
        localStorage.setItem('finansialku_pro_security', JSON.stringify(security));
      }, [security]);

      useEffect(() => {
        localStorage.setItem('finansialku_pro_data_v1', JSON.stringify(allProfileData));
      }, [allProfileData]);

      useEffect(() => {
        if (darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('finansialku_dark_mode', JSON.stringify(darkMode));
      }, [darkMode]);

      // Helper to update active profile data state
      const updateCurrentProfileData = (updater) => {
        setAllProfileData(prev => {
          const current = prev[activeProfileId] || {};
          const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
          return {
            ...prev,
            [activeProfileId]: updated
          };
        });
      };

      // Period Filtered Transactions
      const periodFilteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
          if (!tx.date) return false;
          const [y, m] = tx.date.split('-').map(Number);
          if (filterPeriod === 'daily') return tx.date === selectedDate;
          if (filterPeriod === 'monthly') return y === Number(selectedYear) && (m - 1) === Number(selectedMonth);
          if (filterPeriod === 'yearly') return y === Number(selectedYear);
          return true;
        });
      }, [transactions, filterPeriod, selectedDate, selectedMonth, selectedYear]);

      // Financial Metrics
      const metrics = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;

        periodFilteredTransactions.forEach(tx => {
          if (tx.type === 'transfer' || tx.type === 'adjustment') return;
          const amt = Number(tx.amount) || 0;
          if (tx.type === 'income') totalIncome += amt;
          else if (tx.type === 'expense') totalExpense += amt;
        });

        const netBalance = totalIncome - totalExpense;
        const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 0);

        let healthStatus = 'Sangat Sehat';
        let healthBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        let healthAdvice = 'Arus kas Anda prima. Pertahankan konsistensi menabung dan investasi!';

        if (totalIncome === 0 && totalExpense > 0) {
          healthStatus = 'Defisit (Tanpa Pemasukan)';
          healthBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
          healthAdvice = 'Perhatian: Ada pengeluaran tanpa pemasukan tercatat pada periode ini.';
        } else if (expenseRatio > 100) {
          healthStatus = 'Defisit (Bahaya)';
          healthBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
          healthAdvice = `Pengeluaran melebihi pemasukan sebesar ${formatIDR(Math.abs(netBalance))}. Pangkas pos belanja sekunder!`;
        } else if (expenseRatio >= 80) {
          healthStatus = 'Waspada / Kritis';
          healthBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
          healthAdvice = 'Pengeluaran mendekati 80%+ dari pemasukan. Batasi pengeluaran hiburan dan konsumtif.';
        } else if (expenseRatio >= 50) {
          healthStatus = 'Aman & Seimbang';
          healthBadge = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
          healthAdvice = 'Kondisi finansial Anda seimbang. Alokasikan sisa saldo ke tabungan impian Anda!';
        }

        return {
          totalIncome,
          totalExpense,
          netBalance,
          expenseRatio: Math.min(Math.round(expenseRatio), 100),
          actualRatio: Math.round(expenseRatio * 10) / 10,
          healthStatus,
          healthBadge,
          healthAdvice
        };
      }, [periodFilteredTransactions]);

      // Category spending for current period
      const categorySpending = useMemo(() => {
        const spending = {};
        periodFilteredTransactions
          .filter(tx => tx.type === 'expense')
          .forEach(tx => {
            const cat = tx.category || 'Lain-lain';
            spending[cat] = (spending[cat] || 0) + Number(tx.amount);
          });
        return spending;
      }, [periodFilteredTransactions]);

      // Search & Table filtered transactions
      const tableTransactions = useMemo(() => {
        let list = [...periodFilteredTransactions];

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(tx =>
            (tx.notes && tx.notes.toLowerCase().includes(q)) ||
            (tx.category && tx.category.toLowerCase().includes(q)) ||
            (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(q)) ||
            tx.amount.toString().includes(q)
          );
        }

        if (typeFilter !== 'all') {
          list = list.filter(tx => tx.type === typeFilter);
        }

        if (categoryFilter !== 'all') {
          list = list.filter(tx => tx.category === categoryFilter);
        }

        if (accountFilter !== 'all') {
          list = list.filter(tx => tx.accountId === accountFilter || tx.toAccountId === accountFilter);
        }

        list.sort((a, b) => {
          if (sortBy === 'date-desc') {
            return new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00'));
          } else if (sortBy === 'date-asc') {
            return new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00'));
          } else if (sortBy === 'amount-desc') {
            return Number(b.amount) - Number(a.amount);
          } else if (sortBy === 'amount-asc') {
            return Number(a.amount) - Number(b.amount);
          }
          return 0;
        });

        return list;
      }, [periodFilteredTransactions, searchQuery, typeFilter, categoryFilter, accountFilter, sortBy]);

      // --- TRANSACTION MANAGEMENT ---
      const handleSaveTransaction = (formData) => {
        const amt = Number(formData.amount) || 0;
        const targetAccountId = formData.accountId || accounts[0]?.id;

        updateCurrentProfileData(prev => {
          let updatedAccounts = [...prev.accounts];
          let updatedTxs = [...prev.transactions];

          if (editingTx) {
            // Revert old account balance
            updatedAccounts = updatedAccounts.map(acc => {
              if (acc.id === editingTx.accountId) {
                const oldAmt = Number(editingTx.amount) || 0;
                const reverted = editingTx.type === 'income' ? acc.balance - oldAmt : acc.balance + oldAmt;
                return { ...acc, balance: reverted };
              }
              return acc;
            });

            // Apply new balance
            updatedAccounts = updatedAccounts.map(acc => {
              if (acc.id === targetAccountId) {
                const newBal = formData.type === 'income' ? acc.balance + amt : acc.balance - amt;
                return { ...acc, balance: newBal };
              }
              return acc;
            });

            updatedTxs = updatedTxs.map(t => t.id === editingTx.id ? { ...formData, id: editingTx.id } : t);
            showToast('Transaksi berhasil diperbarui');
          } else {
            // New transaction
            updatedAccounts = updatedAccounts.map(acc => {
              if (acc.id === targetAccountId) {
                const newBal = formData.type === 'income' ? acc.balance + amt : acc.balance - amt;
                return { ...acc, balance: newBal };
              }
              return acc;
            });

            const newTx = {
              ...formData,
              id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
            };
            updatedTxs = [newTx, ...updatedTxs];
            showToast('Transaksi baru berhasil dicatat');
          }

          return {
            ...prev,
            accounts: updatedAccounts,
            transactions: updatedTxs
          };
        });

        setIsTxModalOpen(false);
        setEditingTx(null);
      };

      const handleDeleteTransaction = (id) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
          updateCurrentProfileData(prev => {
            let updatedAccounts = [...prev.accounts];
            const amt = Number(tx.amount) || 0;

            if (tx.type === 'income') {
              updatedAccounts = updatedAccounts.map(a => a.id === tx.accountId ? { ...a, balance: a.balance - amt } : a);
            } else if (tx.type === 'expense') {
              updatedAccounts = updatedAccounts.map(a => a.id === tx.accountId ? { ...a, balance: a.balance + amt } : a);
            } else if (tx.type === 'transfer') {
              const fee = Number(tx.adminFee) || 0;
              updatedAccounts = updatedAccounts.map(a => {
                if (a.id === tx.fromAccountId) return { ...a, balance: a.balance + amt + fee };
                if (a.id === tx.toAccountId) return { ...a, balance: a.balance - amt };
                return a;
              });
            }

            return {
              ...prev,
              accounts: updatedAccounts,
              transactions: prev.transactions.filter(t => t.id !== id)
            };
          });
          showToast('Transaksi telah dihapus', 'error');
        }
      };

      // --- TRANSFER ANTAR-AKUN ---
      const handleTransfer = ({ fromAccountId, toAccountId, amount, adminFee, date, notes }) => {
        updateCurrentProfileData(prev => {
          const updatedAccounts = prev.accounts.map(acc => {
            if (acc.id === fromAccountId) {
              return { ...acc, balance: acc.balance - (amount + adminFee) };
            }
            if (acc.id === toAccountId) {
              return { ...acc, balance: acc.balance + amount };
            }
            return acc;
          });

          const transferTx = {
            id: 'trf-' + Date.now(),
            type: 'transfer',
            fromAccountId,
            toAccountId,
            accountId: fromAccountId,
            amount,
            adminFee,
            date,
            time: new Date().toTimeString().slice(0, 5),
            category: 'Transfer Antar-Akun',
            notes: notes || 'Transfer antar wadah'
          };

          return {
            ...prev,
            accounts: updatedAccounts,
            transactions: [transferTx, ...prev.transactions]
          };
        });
        showToast('Transfer antar-wadah berhasil dilakukan!');
      };

      // --- REKONSILIASI SALDO (PENYESUAIAN RIIL) ---
      const handleReconciliation = ({ accountId, physicalBalance, difference, reason, date }) => {
        updateCurrentProfileData(prev => {
          const updatedAccounts = prev.accounts.map(acc => {
            if (acc.id === accountId) {
              return { ...acc, balance: physicalBalance };
            }
            return acc;
          });

          const adjustTx = {
            id: 'adj-' + Date.now(),
            type: 'adjustment',
            accountId,
            amount: Math.abs(difference),
            date,
            time: new Date().toTimeString().slice(0, 5),
            category: 'Penyesuaian Saldo',
            notes: `Rekonsiliasi: ${reason} (${difference > 0 ? '+ Kelebihan' : '- Kekurangan'} ${formatIDR(Math.abs(difference))})`
          };

          return {
            ...prev,
            accounts: updatedAccounts,
            transactions: [adjustTx, ...prev.transactions]
          };
        });
        showToast('Saldo berhasil disesuaikan dengan uang riil!');
      };

      // --- UTANG & PIUTANG HANDLERS ---
      const handleAddDebt = (debtData) => {
        const newDebt = {
          ...debtData,
          id: 'debt-' + Date.now()
        };
        updateCurrentProfileData(prev => ({
          ...prev,
          debts: [newDebt, ...(prev.debts || [])]
        }));
        showToast('Catatan utang/piutang baru berhasil disimpan');
      };

      const handleRecordDebtPayment = (debtId, paymentData) => {
        updateCurrentProfileData(prev => {
          let updatedAccounts = [...prev.accounts];
          const debt = (prev.debts || []).find(d => d.id === debtId);
          if (!debt) return prev;

          const paymentAmt = Number(paymentData.amount) || 0;
          const newPaidTotal = (Number(debt.paidAmount) || 0) + paymentAmt;
          const isNowPaid = newPaidTotal >= Number(debt.totalAmount);

          if (debt.type === 'receivable') {
            updatedAccounts = updatedAccounts.map(acc => acc.id === paymentData.accountId ? { ...acc, balance: acc.balance + paymentAmt } : acc);
          } else {
            updatedAccounts = updatedAccounts.map(acc => acc.id === paymentData.accountId ? { ...acc, balance: acc.balance - paymentAmt } : acc);
          }

          const payId = 'pay-' + Date.now();
          const newPaymentRecord = {
            id: payId,
            date: paymentData.date,
            amount: paymentAmt,
            accountId: paymentData.accountId,
            notes: paymentData.notes
          };

          const debtTx = {
            id: 'tx-debt-' + Date.now(),
            type: debt.type === 'receivable' ? 'income' : 'expense',
            accountId: paymentData.accountId,
            amount: paymentAmt,
            date: paymentData.date,
            time: new Date().toTimeString().slice(0, 5),
            category: debt.type === 'receivable' ? 'Pelunasan Piutang' : 'Pembayaran Utang',
            notes: `${debt.type === 'receivable' ? 'Cicilan piutang dari' : 'Bayar utang ke'} ${debt.personName}`
          };

          const updatedDebts = (prev.debts || []).map(d => {
            if (d.id === debtId) {
              return {
                ...d,
                paidAmount: newPaidTotal,
                status: isNowPaid ? 'paid' : 'partial',
                payments: [...(d.payments || []), newPaymentRecord]
              };
            }
            return d;
          });

          return {
            ...prev,
            accounts: updatedAccounts,
            debts: updatedDebts,
            transactions: [debtTx, ...prev.transactions]
          };
        });

        showToast('Pembayaran cicilan berhasil dicatat');
      };

      const handleDeleteDebt = (id) => {
        if (window.confirm('Hapus catatan utang/piutang ini?')) {
          updateCurrentProfileData(prev => ({
            ...prev,
            debts: (prev.debts || []).filter(d => d.id !== id)
          }));
          showToast('Catatan utang/piutang telah dihapus', 'error');
        }
      };

      // --- FINANCIAL GOALS HANDLERS ---
      const handleAddGoal = (goalData) => {
        const newGoal = {
          ...goalData,
          id: 'goal-' + Date.now()
        };
        updateCurrentProfileData(prev => ({
          ...prev,
          goals: [newGoal, ...(prev.goals || [])]
        }));
        showToast('Target impian baru berhasil ditambahkan!');
      };

      const handleEditGoal = (goalId, goalData) => {
        updateCurrentProfileData(prev => ({
          ...prev,
          goals: (prev.goals || []).map(g => g.id === goalId ? { ...goalData, id: goalId } : g)
        }));
        showToast('Target impian berhasil diperbarui');
      };

      const handleDeleteGoal = (goalId) => {
        if (window.confirm('Hapus target impian ini?')) {
          updateCurrentProfileData(prev => ({
            ...prev,
            goals: (prev.goals || []).filter(g => g.id !== goalId)
          }));
          showToast('Target impian telah dihapus', 'error');
        }
      };

      const handleAllocateGoal = (goalId, { actionType, amount, accountId, date }) => {
        updateCurrentProfileData(prev => {
          let updatedAccounts = [...prev.accounts];
          const goal = (prev.goals || []).find(g => g.id === goalId);
          if (!goal) return prev;

          const numAmt = Number(amount) || 0;
          let newGoalCurrent = Number(goal.currentAmount) || 0;

          if (actionType === 'deposit') {
            updatedAccounts = updatedAccounts.map(acc => acc.id === accountId ? { ...acc, balance: acc.balance - numAmt } : acc);
            newGoalCurrent += numAmt;
          } else {
            updatedAccounts = updatedAccounts.map(acc => acc.id === accountId ? { ...acc, balance: acc.balance + numAmt } : acc);
            newGoalCurrent = Math.max(0, newGoalCurrent - numAmt);
          }

          const allocTx = {
            id: 'alloc-' + Date.now(),
            type: actionType === 'deposit' ? 'expense' : 'income',
            accountId,
            amount: numAmt,
            date,
            time: new Date().toTimeString().slice(0, 5),
            category: 'Tabungan & Goals',
            notes: `${actionType === 'deposit' ? 'Setoran tabungan' : 'Tarik dana'} untuk goal: ${goal.name}`
          };

          const updatedGoals = (prev.goals || []).map(g => g.id === goalId ? { ...g, currentAmount: newGoalCurrent } : g);

          return {
            ...prev,
            accounts: updatedAccounts,
            goals: updatedGoals,
            transactions: [allocTx, ...prev.transactions]
          };
        });

        showToast('Alokasi saldo tabungan berhasil dieksekusi!');
      };

      // --- EXPORT TO EXCEL (.XLSX MULTI-SHEET) ---
      const handleExportExcel = () => {
        if (!window.XLSX) {
          showToast('Modul Excel sedang disiapkan, mengekspor ke CSV...', 'error');
          handleExportCSV();
          return;
        }

        const wb = XLSX.utils.book_new();

        // Sheet 1: Ringkasan & Wadah
        const accountsData = accounts.map(a => ({
          'Nama Wadah': a.name,
          'Tipe': a.type,
          'Saldo (IDR)': a.balance,
          'Catatan': a.notes || '-'
        }));
        const wsAccounts = XLSX.utils.json_to_sheet(accountsData);
        XLSX.utils.book_append_sheet(wb, wsAccounts, 'Wadah & Saldo');

        // Sheet 2: Transaksi
        const txData = transactions.map(t => ({
          'ID': t.id,
          'Tanggal': t.date,
          'Waktu': t.time || '-',
          'Tipe': t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : t.type === 'transfer' ? 'Transfer' : 'Penyesuaian',
          'Kategori': t.category || '-',
          'Nominal (IDR)': t.amount,
          'Wadah / Akun': accounts.find(a => a.id === t.accountId)?.name || '-',
          'Keterangan': t.notes || '-'
        }));
        const wsTx = XLSX.utils.json_to_sheet(txData);
        XLSX.utils.book_append_sheet(wb, wsTx, 'Riwayat Transaksi');

        // Sheet 3: Utang & Piutang
        if (debts.length > 0) {
          const debtData = debts.map(d => ({
            'Pihak': d.personName,
            'Tipe': d.type === 'receivable' ? 'Piutang' : 'Utang',
            'Total Pokok (IDR)': d.totalAmount,
            'Telah Dibayar (IDR)': d.paidAmount,
            'Sisa (IDR)': Math.max(0, d.totalAmount - d.paidAmount),
            'Jatuh Tempo': d.dueDate,
            'Status': d.status === 'paid' ? 'Lunas' : 'Belum Lunas'
          }));
          const wsDebt = XLSX.utils.json_to_sheet(debtData);
          XLSX.utils.book_append_sheet(wb, wsDebt, 'Utang & Piutang');
        }

        // Sheet 4: Goals Impian
        if (goals.length > 0) {
          const goalData = goals.map(g => ({
            'Nama Impian': g.name,
            'Target (IDR)': g.targetAmount,
            'Terkumpul (IDR)': g.currentAmount,
            'Sisa (IDR)': Math.max(0, g.targetAmount - g.currentAmount),
            'Tenggat Waktu': g.deadline
          }));
          const wsGoal = XLSX.utils.json_to_sheet(goalData);
          XLSX.utils.book_append_sheet(wb, wsGoal, 'Goals Impian');
        }

        const activeProfile = profiles.find(p => p.id === activeProfileId);
        XLSX.writeFile(wb, `Laporan_FinansialKu_${activeProfile?.name || 'Keuangan'}_${Date.now()}.xlsx`);
        showToast('Workbook Excel (.xlsx) berhasil diunduh!');
      };

      // Export CSV fallback
      const handleExportCSV = () => {
        if (transactions.length === 0) {
          alert('Tidak ada data transaksi untuk diekspor!');
          return;
        }

        const headers = ['ID', 'Tipe', 'Tanggal', 'Waktu', 'Kategori', 'Nominal (IDR)', 'Wadah', 'Keterangan'];
        const rows = transactions.map(t => [
          t.id,
          t.type,
          t.date,
          t.time || '',
          `"${(t.category || '').replace(/"/g, '""')}"`,
          t.amount,
          `"${(accounts.find(a => a.id === t.accountId)?.name || '').replace(/"/g, '""')}"`,
          `"${(t.notes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `FinansialKu_${activeProfileId}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Data berhasil diekspor ke CSV');
      };

      // Full JSON Backup & Restore
      const handleExportBackupJSON = () => {
        const fullBackup = {
          version: '3.0-pro',
          exportedAt: new Date().toISOString(),
          profiles,
          activeProfileId,
          security,
          data: allProfileData
        };
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
        const dl = document.createElement('a');
        dl.setAttribute('href', dataStr);
        dl.setAttribute('download', `FinansialKu_Backup_Lengkap_${new Date().toISOString().split('T')[0]}.json`);
        dl.click();
        showToast('Cadangan JSON lengkap berhasil diunduh!');
      };

      const handleImportBackupJSON = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            if (parsed.data) {
              setAllProfileData(parsed.data);
              if (parsed.profiles) setProfiles(parsed.profiles);
              if (parsed.security) setSecurity(parsed.security);
              showToast('Seluruh data berhasil dipulihkan dari cadangan!');
            } else if (Array.isArray(parsed.transactions)) {
              updateCurrentProfileData(prev => ({
                ...prev,
                transactions: parsed.transactions,
                budgets: parsed.budgets || prev.budgets
              }));
              showToast('Data transaksi lama berhasil dipulihkan!');
            } else {
              alert('Format file JSON tidak dikenali.');
            }
          } catch(err) {
            alert('Gagal membaca file JSON: ' + err.message);
          }
        };
        reader.readAsText(file);
      };

      // Multi-profile add handler
      const handleCreateNewProfile = (e) => {
        e.preventDefault();
        if (!newProfileName.trim()) return;

        const newId = 'prof-' + Date.now();
        const newProf = {
          id: newId,
          name: newProfileName.trim(),
          icon: newProfileIcon || '💼',
          desc: 'Profil keuangan terpisah'
        };

        setProfiles(prev => [...prev, newProf]);
        setAllProfileData(prev => ({
          ...prev,
          [newId]: {
            accounts: [
              { id: 'acc-' + newId + '-1', name: 'Kas Utama', type: 'cash', balance: 0, color: 'emerald', icon: 'cash' },
              { id: 'acc-' + newId + '-2', name: 'Bank Operasional', type: 'bank', balance: 0, color: 'blue', icon: 'bank' }
            ],
            transactions: [],
            budgets: {},
            categories: DEFAULT_CATEGORIES,
            goals: [],
            debts: []
          }
        }));

        setActiveProfileId(newId);
        setIsNewProfileModalOpen(false);
        setNewProfileName('');
        showToast(`Profil baru "${newProf.name}" berhasil dibuat!`);
      };

      const currentProfileObj = profiles.find(p => p.id === activeProfileId) || profiles[0];

      return (
        <div className="flex flex-col min-h-screen">
          
          {/* TOAST ALERT */}
          {toastMsg && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-bounce">
              <span className={`w-3 h-3 rounded-full ${toastMsg.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{toastMsg.message}</p>
            </div>
          )}

          {/* FULL SCREEN LOCK OVERLAY (IF PIN ENABLED & LOCKED) */}
          <LockScreenOverlay
            security={security}
            onUnlock={() => setSecurity(prev => ({ ...prev, isLocked: false }))}
            onResetPIN={() => {
              if (window.confirm('Reset PIN keamanan? Kunci pengaman aplikasi akan dinonaktifkan.')) {
                setSecurity({ pinEnabled: false, pinCode: '', biometricEnabled: true, isLocked: false });
                showToast('Kunci PIN telah dinonaktifkan');
              }
            }}
          />

          {/* MAIN NAVBAR */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 gap-3">
                
                {/* Brand & Profile Switcher Dropdown */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
                    <IconWallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                        FinansialKu Pro
                      </h1>

                      {/* Profile Switcher Selector */}
                      <div className="relative inline-block">
                        <select
                          value={activeProfileId}
                          onChange={(e) => {
                            if (e.target.value === '__NEW__') {
                              setIsNewProfileModalOpen(true);
                            } else {
                              setActiveProfileId(e.target.value);
                              showToast(`Beralih ke profil: ${profiles.find(p => p.id === e.target.value)?.name}`);
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                          ))}
                          <option value="__NEW__">➕ Tambah Profil Baru...</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                      {currentProfileObj?.name} &bull; Multi-Akun & Cloud Database
                    </p>
                  </div>
                </div>

                {/* Navigation Pills (Desktop) */}
                <nav className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
                  {[
                    { id: 'dashboard', label: 'Dashboard & AI', icon: <IconBarChart className="w-3.5 h-3.5" /> },
                    { id: 'accounts', label: `Akun & Wadah (${accounts.length})`, icon: <IconWallet className="w-3.5 h-3.5" /> },
                    { id: 'transactions', label: `Riwayat Transaksi (${tableTransactions.length})`, icon: <IconCreditCard className="w-3.5 h-3.5" /> },
                    { id: 'budgets_goals', label: `Anggaran & Goals (${goals.length})`, icon: <IconTarget className="w-3.5 h-3.5" /> },
                    { id: 'debts', label: `Utang & Piutang (${debts.length})`, icon: <IconHandshake className="w-3.5 h-3.5" /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentView(tab.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        currentView === tab.id
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Header Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  
                  {/* Cloud Sync Status & Account Button */}
                  {firebaseUser ? (
                    <div className="relative">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all"
                        title={cloudSyncStatus === 'synced' ? `Tersinkronisasi ke Firebase (${lastSyncedAt || 'Baru saja'})` : 'Menghubungkan ke Cloud'}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="hidden md:inline max-w-[100px] truncate">
                          {firebaseUser.displayName || firebaseUser.email || 'Cloud Aktif'}
                        </span>
                        <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                        </svg>
                      </button>

                      {/* User Dropdown */}
                      {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs space-y-1">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{firebaseUser.displayName || 'Pengguna Firebase'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{firebaseUser.email || (firebaseUser.isAnonymous ? 'Mode Tamu Cloud' : 'ID: ' + firebaseUser.uid.slice(0, 8))}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              ☁️ Firestore Realtime Sync
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              handleManualCloudSave();
                              setIsUserMenuOpen(false);
                              showToast('Data berhasil disinkronkan ke Firebase Cloud');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between"
                          >
                            <span>Sinkronkan Sekarang</span>
                            <span>⚡</span>
                          </button>

                          <button
                            onClick={async () => {
                              await authService.logout();
                              setIsUserMenuOpen(false);
                              showToast('Berhasil keluar dari akun');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-bold"
                          >
                            Keluar Akun
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      title="Hubungkan ke Firebase untuk Sinkronisasi Multi-Perangkat"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                      </svg>
                      <span className="hidden sm:inline">Hubungkan Cloud</span>
                    </button>
                  )}

                  {/* Quick OCR Scanner Trigger */}
                  <button
                    onClick={() => setIsOCRModalOpen(true)}
                    title="Scan Struk Belanja dengan OCR"
                    className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5"
                  >
                    <IconCameraScan className="w-4 h-4" />
                    <span className="hidden sm:inline">Scan Struk</span>
                  </button>

                  {/* Add Transaction Button */}
                  <button
                    onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <IconPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Catat Transaksi</span>
                  </button>

                  {/* Lock Screen Button */}
                  <button
                    onClick={() => {
                      if (security.pinEnabled) {
                        setSecurity(prev => ({ ...prev, isLocked: true }));
                      } else {
                        setIsSecurityModalOpen(true);
                      }
                    }}
                    title={security.pinEnabled ? "Kunci Aplikasi Sekarang" : "Atur Kunci PIN Keamanan"}
                    className={`p-2 rounded-xl transition-colors ${
                      security.pinEnabled
                        ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconLock className="w-4 h-4" />
                  </button>

                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    title={darkMode ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap"}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {darkMode ? <IconSun className="w-4 h-4 text-amber-400" /> : <IconMoon className="w-4 h-4" />}
                  </button>
                </div>

              </div>

              {/* Mobile/Tablet Subnav Row */}
              <div className="flex xl:hidden items-center justify-between py-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold overflow-x-auto gap-1">
                {[
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'accounts', label: `Wadah (${accounts.length})` },
                  { id: 'transactions', label: `Riwayat` },
                  { id: 'budgets_goals', label: `Goals (${goals.length})` },
                  { id: 'debts', label: `Utang (${debts.length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id)}
                    className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap ${
                      currentView === tab.id
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

            </div>
          </header>

          {/* MAIN CONTAINER */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
            
            {/* VIEW 1: DASHBOARD & ANALYTICS */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                
                {/* TIME FILTER & EXPORT BAR */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm no-print">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    
                    {/* Period Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
                        Periode:
                      </span>
                      {[
                        { id: 'all', label: 'Semua Waktu' },
                        { id: 'daily', label: 'Harian' },
                        { id: 'monthly', label: 'Bulanan' },
                        { id: 'yearly', label: 'Tahunan' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setFilterPeriod(tab.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                            filterPeriod === tab.id
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Date Pickers */}
                    <div className="flex flex-wrap items-center gap-2">
                      {filterPeriod === 'daily' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => setSelectedDate(today.toISOString().split('T')[0])}
                            className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                          >
                            Hari Ini
                          </button>
                        </div>
                      )}

                      {filterPeriod === 'monthly' && (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                          >
                            {monthNames.map((name, idx) => (
                              <option key={idx} value={idx}>{name}</option>
                            ))}
                          </select>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                          >
                            {[2024, 2025, 2026, 2027].map((yr) => (
                              <option key={yr} value={yr}>{yr}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {filterPeriod === 'yearly' && (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                          >
                            {[2024, 2025, 2026, 2027].map((yr) => (
                              <option key={yr} value={yr}>Tahun {yr}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Export & Backup Buttons */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={handleExportExcel}
                          title="Ekspor seluruh laporan ke Workbook Excel (.xlsx)"
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                        >
                          <IconDownload className="w-3.5 h-3.5" />
                          <span>Excel (.xlsx)</span>
                        </button>
                        <button
                          onClick={handleExportCSV}
                          title="Ekspor ke CSV"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-200"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => window.print()}
                          title="Cetak Laporan / Simpan PDF"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-200"
                        >
                          <IconPrinter className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                          onClick={handleExportBackupJSON}
                          title="Cadangkan seluruh database ke file JSON"
                          className="px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Backup
                        </button>
                        <label
                          title="Pulihkan dari cadangan JSON"
                          className="px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        >
                          Restore
                          <input type="file" accept=".json" onChange={handleImportBackupJSON} className="hidden" />
                        </label>
                      </div>
                    </div>

                  </div>
                </div>

                {/* SUMMARY METRIC CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Card 0: Total Net Worth across all accounts */}
                  <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Total Aset Wadah
                      </span>
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <IconWallet className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                        {formatIDR(accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0))}
                      </div>
                      <button
                        onClick={() => setCurrentView('accounts')}
                        className="mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline block"
                      >
                        Lihat {accounts.length} Wadah Aktif &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Card 1: Pemasukan */}
                  <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Total Pemasukan
                      </span>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                        <IconTrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                        {formatIDR(metrics.totalIncome)}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {periodFilteredTransactions.filter(t => t.type === 'income').length} transaksi masuk
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Pengeluaran */}
                  <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Total Pengeluaran
                      </span>
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                        <IconTrendingDown className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                        {formatIDR(metrics.totalExpense)}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {periodFilteredTransactions.filter(t => t.type === 'expense').length} transaksi keluar
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Arus Kas Bersih */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                        Arus Kas Bersih
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${metrics.netBalance >= 0 ? 'bg-teal-500/20 text-teal-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {metrics.netBalance >= 0 ? 'Surplus' : 'Defisit'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className={`text-2xl font-black tracking-tight ${metrics.netBalance >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
                        {formatIDR(metrics.netBalance)}
                      </div>
                      <p className="mt-1 text-xs text-slate-300">
                        Selisih masuk & keluar
                      </p>
                    </div>
                  </div>

                </div>

                {/* AI INSIGHT WIDGET (PANEL KHUSUS FINAI) */}
                <AIInsightWidget
                  metrics={metrics}
                  periodFilteredTransactions={periodFilteredTransactions}
                  categorySpending={categorySpending}
                  goals={goals}
                  debts={debts}
                  filterPeriod={filterPeriod}
                />

                {/* CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Chart 1: Bar Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Perbandingan Arus Kas
                        </h2>
                        <p className="text-xs text-slate-500">Visualisasi rasio pemasukan vs pengeluaran</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <IconBarChart className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="h-64 relative flex items-center justify-center">
                      <BarChartComponent transactions={periodFilteredTransactions} filterPeriod={filterPeriod} darkMode={darkMode} />
                    </div>
                  </div>

                  {/* Chart 2: Doughnut Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Proporsi Pengeluaran Kategori
                        </h2>
                        <p className="text-xs text-slate-500">Persentase alokasi pengeluaran Anda</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <IconPieChart className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="h-64 relative flex items-center justify-center">
                      <PieChartComponent categorySpending={categorySpending} darkMode={darkMode} />
                    </div>
                  </div>

                </div>

                {/* Chart 3: Tren Tahunan */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Tren Keuangan 12 Bulan ({selectedYear})
                      </h2>
                      <p className="text-xs text-slate-500">Tren kumulatif untuk memantau bulan hemat dan boros</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                      Tahun {selectedYear}
                    </span>
                  </div>
                  <div className="h-72 relative flex items-center justify-center">
                    <YearlyTrendChart transactions={transactions} year={selectedYear} darkMode={darkMode} />
                  </div>
                </div>

                {/* Recent Transactions Preview */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Transaksi Terkini</h2>
                      <p className="text-xs text-slate-500">Catatan terbaru pada filter periode ini</p>
                    </div>
                    <button
                      onClick={() => setCurrentView('transactions')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Lihat Semua ({periodFilteredTransactions.length}) &rarr;
                    </button>
                  </div>

                  <TransactionTable
                    transactions={periodFilteredTransactions.slice(0, 5)}
                    accounts={accounts}
                    onEdit={(t) => { setEditingTx(t); setIsTxModalOpen(true); }}
                    onDelete={handleDeleteTransaction}
                  />
                </div>

              </div>
            )}

            {/* VIEW 2: MANAJEMEN WADAH & AKUN (ASET, TRANSFER, REKONSILIASI) */}
            {currentView === 'accounts' && (
              <AccountsView
                accounts={accounts}
                transactions={transactions}
                onAddAccount={(accData) => {
                  const newAcc = { ...accData, id: 'acc-' + Date.now() };
                  updateCurrentProfileData(prev => ({
                    ...prev,
                    accounts: [...prev.accounts, newAcc]
                  }));
                  showToast('Wadah keuangan baru berhasil ditambahkan');
                }}
                onEditAccount={(accId, accData) => {
                  updateCurrentProfileData(prev => ({
                    ...prev,
                    accounts: prev.accounts.map(a => a.id === accId ? { ...a, ...accData } : a)
                  }));
                  showToast('Data wadah berhasil diperbarui');
                }}
                onDeleteAccount={(accId) => {
                  if (accounts.length <= 1) {
                    alert('Minimal harus ada 1 wadah keuangan aktif!');
                    return;
                  }
                  if (window.confirm('Hapus wadah keuangan ini? Saldo dan riwayat akan terpengaruh.')) {
                    updateCurrentProfileData(prev => ({
                      ...prev,
                      accounts: prev.accounts.filter(a => a.id !== accId)
                    }));
                    showToast('Wadah telah dihapus', 'error');
                  }
                }}
                onTransfer={handleTransfer}
                onReconcile={handleReconciliation}
              />
            )}

            {/* VIEW 3: RIWAYAT TRANSAKSI LENGKAP */}
            {currentView === 'transactions' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                
                {/* Search & Filter Controls */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <IconSearch className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Cari transaksi (keterangan, kategori, nominal)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Type */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Tipe</option>
                      <option value="income">Pemasukan Saja</option>
                      <option value="expense">Pengeluaran Saja</option>
                      <option value="transfer">Transfer Antar-Akun</option>
                      <option value="adjustment">Penyesuaian Saldo</option>
                    </select>

                    {/* Filter Account */}
                    <select
                      value={accountFilter}
                      onChange={(e) => setAccountFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Wadah</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>

                    {/* Filter Category */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Kategori</option>
                      {[...new Set([...categories.income, ...categories.expense])].map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="date-desc">Tanggal Terbaru</option>
                      <option value="date-asc">Tanggal Terlama</option>
                      <option value="amount-desc">Nominal Tertinggi</option>
                      <option value="amount-asc">Nominal Terendah</option>
                    </select>
                  </div>
                </div>

                {/* Table Content */}
                <TransactionTable
                  transactions={tableTransactions}
                  accounts={accounts}
                  onEdit={(t) => { setEditingTx(t); setIsTxModalOpen(true); }}
                  onDelete={handleDeleteTransaction}
                />

                {/* Footer Count */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-2">
                  <span>Menampilkan {tableTransactions.length} dari total {transactions.length} transaksi</span>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => {
                        if (window.confirm('Reset transaksi periode ini?')) {
                          updateCurrentProfileData(prev => ({ ...prev, transactions: [] }));
                          showToast('Data transaksi telah direset', 'error');
                        }
                      }}
                      className="text-rose-500 hover:underline font-semibold"
                    >
                      Kosongkan Riwayat Transaksi
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 4: GOALS & ANGGARAN (BUDGET) */}
            {currentView === 'budgets_goals' && (
              <GoalsAndBudgetView
                goals={goals}
                budgets={budgets}
                categories={categories}
                categorySpending={categorySpending}
                accounts={accounts}
                onAddGoal={handleAddGoal}
                onEditGoal={handleEditGoal}
                onDeleteGoal={handleDeleteGoal}
                onAllocateGoal={handleAllocateGoal}
                onSaveBudgets={(newBudgets) => {
                  updateCurrentProfileData(prev => ({ ...prev, budgets: newBudgets }));
                  showToast('Target anggaran bulanan berhasil diperbarui!');
                }}
              />
            )}

            {/* VIEW 5: UTANG & PIUTANG TERPISAH */}
            {currentView === 'debts' && (
              <DebtsView
                debts={debts}
                accounts={accounts}
                onAddDebt={handleAddDebt}
                onRecordPayment={handleRecordDebtPayment}
                onDeleteDebt={handleDeleteDebt}
              />
            )}

          </main>

          {/* FOOTER */}
          <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p><strong>FinansialKu Pro</strong> &copy; 2026 &mdash; Aplikasi Manajemen Aset, Keuangan Cerdas & Firebase Cloud Sync</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                >
                  <IconLock className="w-3.5 h-3.5" />
                  <span>Pengaturan PIN Keamanan</span>
                </button>
                <span>&bull;</span>
                <p>Firebase Project: finansialku-pro</p>
              </div>
            </div>
          </footer>

          {/* MODAL TRANSAKSI (TAMBAH / EDIT) */}
          {isTxModalOpen && (
            <TransactionModal
              editingTx={editingTx}
              accounts={accounts}
              categories={categories}
              paymentMethods={DEFAULT_PAYMENT_METHODS}
              onClose={() => { setIsTxModalOpen(false); setEditingTx(null); }}
              onSave={handleSaveTransaction}
              onAddCategory={(type, newCat) => {
                updateCurrentProfileData(prev => ({
                  ...prev,
                  categories: {
                    ...prev.categories,
                    [type]: [...prev.categories[type], newCat]
                  }
                }));
              }}
              onOpenOCR={() => {
                setIsTxModalOpen(false);
                setIsOCRModalOpen(true);
              }}
            />
          )}

          {/* MODAL SCAN STRUK BELANJA (OCR) */}
          <ReceiptOCRModal
            isOpen={isOCRModalOpen}
            onClose={() => setIsOCRModalOpen(false)}
            onApplyParsedData={(parsedData) => {
              setEditingTx({
                type: 'expense',
                accountId: accounts[0]?.id || '',
                amount: parsedData.amount,
                date: parsedData.date,
                time: new Date().toTimeString().slice(0, 5),
                category: parsedData.category,
                paymentMethod: 'Dompet Tunai (Cash)',
                cycle: 'Sekali Jalan',
                notes: parsedData.notes
              });
              setIsOCRModalOpen(false);
              setIsTxModalOpen(true);
              showToast('Data struk berhasil diekstrak!');
            }}
          />

          {/* MODAL PENGATURAN KEAMANAN (PIN & BIOMETRIC) */}
          {isSecurityModalOpen && (
            <SecuritySettingsModal
              security={security}
              onClose={() => setIsSecurityModalOpen(false)}
              onSaveSecurity={(newSec) => {
                setSecurity(newSec);
                setIsSecurityModalOpen(false);
                showToast(newSec.pinEnabled ? 'Kunci PIN keamanan berhasil diaktifkan!' : 'Kunci PIN dinonaktifkan.');
              }}
            />
          )}

          {/* MODAL FIREBASE AUTH & CLOUD SYNC */}
          <FirebaseAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUser={firebaseUser}
            onAuthSuccess={(user) => {
              setFirebaseUser(user);
              showToast(`Selamat datang, ${user.displayName || user.email || 'Pengguna Cloud'}!`);
            }}
          />

          {/* MODAL BUAT PROFIL BARU */}
          {isNewProfileModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Buat Profil Keuangan Baru</h3>
                  <button onClick={() => setIsNewProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
                </div>

                <form onSubmit={handleCreateNewProfile} className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Pisahkan keuangan pribadi, bisnis sampingan, atau proyek dengan profil terpisah.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Profil *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bisnis Laundry, Toko Online, Rumah Tangga"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ikon Profil</label>
                    <div className="flex items-center gap-2">
                      {['👤', '💼', '🛒', '👨‍👩‍👧', '📈', '🏠'].map(ico => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => setNewProfileIcon(ico)}
                          className={`w-9 h-9 text-lg rounded-xl border flex items-center justify-center ${newProfileIcon === ico ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsNewProfileModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                    >
                      Buat Profil
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      );
    }

    // Mount React App
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
