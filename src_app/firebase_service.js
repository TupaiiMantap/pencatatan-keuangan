    // --- FIREBASE CONFIGURATION & CLOUD SERVICES ---
    const firebaseConfig = {
      apiKey: "AIzaSyBdeJ97ljgiKW3nLvvaCysMxgDVoSzAX58",
      authDomain: "finansialku-pro.firebaseapp.com",
      projectId: "finansialku-pro",
      storageBucket: "finansialku-pro.firebasestorage.app",
      messagingSenderId: "1087652448577",
      appId: "1:1087652448577:web:3676cad79d3ce96e8179c0"
    };

    // Initialize Firebase Services with Safe Fallback
    let firebaseApp = null;
    let firebaseAuth = null;
    let firebaseDb = null;

    try {
      if (typeof firebase !== 'undefined' && firebase.apps) {
        if (!firebase.apps.length) {
          firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
          firebaseApp = firebase.app();
        }
        firebaseAuth = firebase.auth();
        firebaseDb = firebase.firestore();

        // Enable offline persistence in Firestore if available
        try {
          firebaseDb.enablePersistence({ synchronizeTabs: true }).catch((err) => {
            if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
              // Persistence could not be enabled in multiple tabs
            }
          });
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Firebase initialization warning:", err);
    }

    // --- AUTHENTICATION SERVICE ---
    const authService = {
      isAvailable: () => !!firebaseAuth,
      
      onAuthStateChanged: (callback) => {
        if (!firebaseAuth) return () => {};
        return firebaseAuth.onAuthStateChanged(callback);
      },

      loginWithGoogle: async () => {
        if (!firebaseAuth) throw new Error("Firebase Auth belum tersedia");
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        return await firebaseAuth.signInWithPopup(provider);
      },

      loginWithEmail: async (email, password) => {
        if (!firebaseAuth) throw new Error("Firebase Auth belum tersedia");
        return await firebaseAuth.signInWithEmailAndPassword(email, password);
      },

      registerWithEmail: async (email, password, displayName) => {
        if (!firebaseAuth) throw new Error("Firebase Auth belum tersedia");
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        if (displayName && userCredential.user) {
          await userCredential.user.updateProfile({ displayName });
        }
        return userCredential;
      },

      loginAsGuest: async () => {
        if (!firebaseAuth) throw new Error("Firebase Auth belum tersedia");
        return await firebaseAuth.signInAnonymously();
      },

      logout: async () => {
        if (!firebaseAuth) return;
        return await firebaseAuth.signOut();
      },

      sendPasswordReset: async (email) => {
        if (!firebaseAuth) throw new Error("Firebase Auth belum tersedia");
        return await firebaseAuth.sendPasswordResetEmail(email);
      }
    };

    // --- FIRESTORE CLOUD SYNC SERVICE ---
    const cloudSyncService = {
      isAvailable: () => !!firebaseDb,

      // Save complete app data to user's Firestore document
      saveUserData: async (userId, payload) => {
        if (!firebaseDb || !userId) return false;
        try {
          const docRef = firebaseDb.collection('users').doc(userId);
          await docRef.set({
            ...payload,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSyncDevice: navigator.userAgent
          }, { merge: true });
          return true;
        } catch (err) {
          console.error("Cloud save error:", err);
          return false;
        }
      },

      // Fetch user data from Firestore
      fetchUserData: async (userId) => {
        if (!firebaseDb || !userId) return null;
        try {
          const docRef = firebaseDb.collection('users').doc(userId);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            return docSnap.data();
          }
          return null;
        } catch (err) {
          console.error("Cloud fetch error:", err);
          return null;
        }
      },

      // Subscribe to real-time changes
      subscribeUserData: (userId, onDataUpdate) => {
        if (!firebaseDb || !userId) return () => {};
        const docRef = firebaseDb.collection('users').doc(userId);
        return docRef.onSnapshot((doc) => {
          if (doc.exists) {
            onDataUpdate(doc.data());
          }
        }, (err) => {
          console.error("Real-time sync snapshot error:", err);
        });
      }
    };

    // --- COMPONENT: AUTH & CLOUD SYNC MODAL ---
    function FirebaseAuthModal({ isOpen, onClose, onAuthSuccess, currentUser }) {
      const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [displayName, setDisplayName] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [errorMsg, setErrorMsg] = useState('');
      const [successMsg, setSuccessMsg] = useState('');

      if (!isOpen) return null;

      const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
          const res = await authService.loginWithGoogle();
          onAuthSuccess(res.user);
          onClose();
        } catch (err) {
          setErrorMsg(err.message || 'Gagal masuk dengan akun Google.');
        } finally {
          setIsLoading(false);
        }
      };

      const handleEmailAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
          if (authMode === 'login') {
            const res = await authService.loginWithEmail(email, password);
            onAuthSuccess(res.user);
            onClose();
          } else if (authMode === 'register') {
            if (password.length < 6) {
              setErrorMsg('Kata sandi minimal 6 karakter!');
              setIsLoading(false);
              return;
            }
            const res = await authService.registerWithEmail(email, password, displayName);
            onAuthSuccess(res.user);
            onClose();
          } else if (authMode === 'forgot') {
            await authService.sendPasswordReset(email);
            setSuccessMsg('Email instruksi reset kata sandi telah dikirim!');
          }
        } catch (err) {
          let msg = err.message;
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            msg = 'Email atau kata sandi tidak cocok.';
          } else if (err.code === 'auth/email-already-in-use') {
            msg = 'Email ini sudah terdaftar. Silakan gunakan menu Masuk.';
          } else if (err.code === 'auth/invalid-email') {
            msg = 'Format alamat email tidak valid.';
          }
          setErrorMsg(msg);
        } finally {
          setIsLoading(false);
        }
      };

      const handleGuestLogin = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
          const res = await authService.loginAsGuest();
          onAuthSuccess(res.user);
          onClose();
        } catch (err) {
          setErrorMsg(err.message || 'Gagal masuk sebagai tamu.');
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header with Cloud Logo */}
            <div className="relative p-6 text-center border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/20 mb-3">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
                </svg>
              </div>

              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                {authMode === 'login' ? 'Masuk ke FinansialKu Cloud' : authMode === 'register' ? 'Daftar Akun Baru' : 'Reset Kata Sandi'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sinkronisasi data multi-perangkat real-time dengan Firebase Cloud Database
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              
              {/* Error or Success Alert */}
              {errorMsg && (
                <div className="p-3 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-300">
                  {successMsg}
                </div>
              )}

              {/* 1-Click Google Sign In */}
              {authMode !== 'forgot' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Lanjutkan dengan Google</span>
                  </button>

                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">atau dengan email</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                </div>
              )}

              {/* Form Email / Password */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {authMode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Kata Sandi
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgot')}
                          className="text-[10px] font-bold text-emerald-600 hover:underline"
                        >
                          Lupa kata sandi?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading && <span className="animate-spin">⌛</span>}
                  <span>
                    {authMode === 'login' ? 'Masuk ke Akun' : authMode === 'register' ? 'Daftarkan Akun Baru' : 'Kirim Link Reset'}
                  </span>
                </button>
              </form>

              {/* Mode Switcher Links */}
              <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                {authMode === 'login' && (
                  <p>
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="font-bold text-emerald-600 hover:underline"
                    >
                      Daftar Gratis
                    </button>
                  </p>
                )}

                {authMode === 'register' && (
                  <p>
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="font-bold text-emerald-600 hover:underline"
                    >
                      Masuk di sini
                    </button>
                  </p>
                )}

                {authMode === 'forgot' && (
                  <p>
                    Kembali ke{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="font-bold text-emerald-600 hover:underline"
                    >
                      Halaman Masuk
                    </button>
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Atau masuk sebagai Tamu (Anonymous Cloud)
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      );
    }
