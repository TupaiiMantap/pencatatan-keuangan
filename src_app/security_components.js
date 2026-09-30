    // --- COMPONENT: SISTEM KEAMANAN & PENGUNCIAN APLIKASI (PIN & MOCK BIOMETRIC) ---

    // 1. FULL-SCREEN LOCK OVERLAY
    function LockScreenOverlay({ security, onUnlock, onResetPIN }) {
      const [inputPin, setInputPin] = useState('');
      const [errorMsg, setErrorMsg] = useState('');
      const [isBiometricScanning, setIsBiometricScanning] = useState(false);
      const [scanSuccess, setScanSuccess] = useState(false);

      if (!security.pinEnabled || !security.isLocked) return null;

      const targetLength = security.pinCode ? security.pinCode.length : 4;

      const handleDigitPress = (digit) => {
        if (inputPin.length < targetLength) {
          const newPin = inputPin + digit;
          setInputPin(newPin);
          setErrorMsg('');

          if (newPin.length === targetLength) {
            if (newPin === security.pinCode) {
              setTimeout(() => {
                onUnlock();
                setInputPin('');
              }, 200);
            } else {
              setTimeout(() => {
                setErrorMsg('PIN yang Anda masukkan salah!');
                setInputPin('');
              }, 300);
            }
          }
        }
      };

      const handleDelete = () => {
        setInputPin(prev => prev.slice(0, -1));
        setErrorMsg('');
      };

      // Mock Biometric Scanner Simulation
      const handleBiometricAuth = () => {
        setIsBiometricScanning(true);
        setErrorMsg('');
        setTimeout(() => {
          setIsBiometricScanning(false);
          setScanSuccess(true);
          setTimeout(() => {
            setScanSuccess(false);
            onUnlock();
            setInputPin('');
          }, 600);
        }, 1100);
      };

      return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
            
            {/* Logo / Lock icon with pulse */}
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30">
                {scanSuccess ? (
                  <IconCheckCircle className="w-10 h-10 text-white animate-bounce" />
                ) : isBiometricScanning ? (
                  <IconFingerprint className="w-10 h-10 text-white animate-pulse" />
                ) : (
                  <IconLock className="w-10 h-10" />
                )}
              </div>
              {isBiometricScanning && (
                <div className="absolute inset-0 rounded-3xl border-2 border-teal-400 animate-ping pointer-events-none"></div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">FinansialKu Terkunci</h2>
              <p className="text-xs text-slate-400 mt-1">
                {isBiometricScanning
                  ? 'Memindai biometrik (Face ID / Sidik Jari)...'
                  : scanSuccess
                  ? 'Biometrik terverifikasi!'
                  : 'Masukkan PIN keamanan untuk membuka aplikasi'}
              </p>
            </div>

            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 my-2">
              {Array.from({ length: targetLength }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    i < inputPin.length
                      ? 'bg-emerald-400 scale-125 shadow-lg shadow-emerald-400/50'
                      : 'border-2 border-slate-700 bg-slate-800'
                  }`}
                ></div>
              ))}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="text-xs font-bold text-rose-400 bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-800">
                {errorMsg}
              </div>
            )}

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 w-64">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitPress(num.toString())}
                  className="w-16 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-90 text-xl font-extrabold text-white border border-slate-800 shadow-md transition-all flex items-center justify-center mx-auto"
                >
                  {num}
                </button>
              ))}

              {/* Biometric Trigger */}
              <button
                type="button"
                onClick={handleBiometricAuth}
                title="Buka dengan Sidik Jari / Face ID"
                className="w-16 h-16 rounded-2xl bg-slate-900/60 hover:bg-slate-800 active:scale-90 text-emerald-400 border border-slate-800 transition-all flex items-center justify-center mx-auto"
              >
                <IconFingerprint className="w-7 h-7" />
              </button>

              {/* Digit 0 */}
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="w-16 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-90 text-xl font-extrabold text-white border border-slate-800 shadow-md transition-all flex items-center justify-center mx-auto"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleDelete}
                className="w-16 h-16 rounded-2xl bg-slate-900/60 hover:bg-slate-800 active:scale-90 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center mx-auto"
              >
                &larr;
              </button>
            </div>

            {/* Biometric text button */}
            <button
              type="button"
              onClick={handleBiometricAuth}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
            >
              <IconFingerprint className="w-4 h-4" />
              <span>Buka dengan Face ID / Sidik Jari</span>
            </button>

            {/* Reset PIN Fallback */}
            <button
              type="button"
              onClick={onResetPIN}
              className="text-[11px] text-slate-500 hover:text-slate-400 underline transition-colors"
            >
              Lupa PIN? Reset Kunci Pengaman
            </button>

          </div>
        </div>
      );
    }

    // 2. SECURITY SETTINGS MODAL
    function SecuritySettingsModal({ security, onClose, onSaveSecurity }) {
      const [pinEnabled, setPinEnabled] = useState(security.pinEnabled || false);
      const [pinCode, setPinCode] = useState(security.pinCode || '');
      const [confirmPin, setConfirmPin] = useState(security.pinCode || '');
      const [biometricEnabled, setBiometricEnabled] = useState(security.biometricEnabled !== false);

      const handleSubmit = (e) => {
        e.preventDefault();
        if (pinEnabled) {
          if (pinCode.length < 4 || pinCode.length > 6) {
            alert('PIN harus terdiri dari 4 sampai 6 angka!');
            return;
          }
          if (pinCode !== confirmPin) {
            alert('Konfirmasi PIN tidak cocok dengan PIN yang dibuat!');
            return;
          }
        }

        onSaveSecurity({
          pinEnabled,
          pinCode: pinEnabled ? pinCode : '',
          biometricEnabled,
          isLocked: false
        });
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <IconLock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  Keamanan & Kunci Aplikasi
                </h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Toggle Enable PIN */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Aktifkan Kunci PIN</h4>
                  <p className="text-[11px] text-slate-500">Kunci aplikasi saat dibuka atau diminimalkan</p>
                </div>
                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={(e) => setPinEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              {pinEnabled && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Buat PIN Baru (4-6 Angka) *
                    </label>
                    <input
                      type="password"
                      maxLength="6"
                      required={pinEnabled}
                      placeholder="Contoh: 1234"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 text-center tracking-widest text-lg font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Konfirmasi PIN *
                    </label>
                    <input
                      type="password"
                      maxLength="6"
                      required={pinEnabled}
                      placeholder="Masukkan ulang PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 text-center tracking-widest text-lg font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Mock Biometric Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <IconFingerprint className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Mock Biometrik Cepat</h4>
                        <p className="text-[11px] text-slate-500">Buka kunci dengan simulasi Face ID / Sidik Jari</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={biometricEnabled}
                      onChange={(e) => setBiometricEnabled(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

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
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
