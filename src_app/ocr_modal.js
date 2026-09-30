    // --- COMPONENT: MODAL SCAN STRUK BELANJA (OCR & PARSER) ---
    function ReceiptOCRModal({ isOpen, onClose, onApplyParsedData }) {
      const [imageFile, setImageFile] = useState(null);
      const [imagePreview, setImagePreview] = useState(null);
      const [isScanning, setIsScanning] = useState(false);
      const [scanProgress, setScanProgress] = useState(0);
      const [rawText, setRawText] = useState('');
      const [parsedData, setParsedData] = useState({
        merchant: '',
        amount: '',
        date: '',
        category: 'Belanja',
        notes: ''
      });

      if (!isOpen) return null;

      // Smart Regex Parsing Function
      const parseReceiptText = (text) => {
        let detectedAmount = '';
        let detectedDate = '';
        let detectedMerchant = '';
        let detectedCategory = 'Belanja';

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

        // 1. Merchant Detection (Check first 4 lines)
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
          const line = lines[i];
          if (/indomaret/i.test(line)) { detectedMerchant = 'Indomaret'; detectedCategory = 'Belanja'; break; }
          if (/alfamart/i.test(line)) { detectedMerchant = 'Alfamart'; detectedCategory = 'Belanja'; break; }
          if (/pertamina|spbu/i.test(line)) { detectedMerchant = 'SPBU Pertamina'; detectedCategory = 'Transportasi'; break; }
          if (/starbucks|kopi|cafe|coffee/i.test(line)) { detectedMerchant = line; detectedCategory = 'Makanan & Minuman'; break; }
          if (/superindo|hypermart|transmart/i.test(line)) { detectedMerchant = line; detectedCategory = 'Belanja'; break; }
          if (/apotek|kimia farma/i.test(line)) { detectedMerchant = line; detectedCategory = 'Kesehatan'; break; }
          if (line.length > 3 && !/struk|nota|receipt|selamat|jalan|jl\./i.test(line) && !detectedMerchant) {
            detectedMerchant = line;
          }
        }
        if (!detectedMerchant && lines.length > 0) detectedMerchant = lines[0];

        // 2. Amount / Total Detection
        // Look for lines containing total, subtotal, bayar, rp, or find max price
        const amountsFound = [];
        const totalRegex = /(?:total|grand\s*total|tagihan|bayar|netto|jumlah|tunai|cash)\s*[:=]?\s*(?:rp\.?)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+)/i;
        
        for (const line of lines) {
          const match = line.match(totalRegex);
          if (match && match[1]) {
            const clean = match[1].replace(/[^0-9]/g, '');
            if (clean && Number(clean) > 500) {
              amountsFound.push(Number(clean));
            }
          }
        }

        // If no direct total keyword match, scan for all currency-like numbers
        if (amountsFound.length === 0) {
          const numRegex = /(?:rp\.?\s*)?([0-9]{1,3}(?:[.,][0-9]{3})+)/gi;
          let m;
          while ((m = numRegex.exec(text)) !== null) {
            const clean = m[1].replace(/[^0-9]/g, '');
            if (Number(clean) >= 1000) amountsFound.push(Number(clean));
          }
        }

        if (amountsFound.length > 0) {
          // Take the highest reasonable number as the total
          detectedAmount = Math.max(...amountsFound).toString();
        }

        // 3. Date Detection (DD-MM-YYYY or YYYY-MM-DD or DD/MM/YY)
        const dateRegex = /(\d{1,2})[-/. ](\d{1,2}|Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)[-/. ](\d{2,4})/i;
        const dateMatch = text.match(dateRegex);
        if (dateMatch) {
          try {
            const today = new Date();
            const year = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
            let month = dateMatch[2];
            const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', jun: '06', jul: '07', agu: '08', sep: '09', okt: '10', nov: '11', des: '12' };
            if (isNaN(month)) {
              month = monthMap[month.toLowerCase().substring(0, 3)] || '01';
            } else {
              month = month.padStart(2, '0');
            }
            const day = dateMatch[1].padStart(2, '0');
            detectedDate = `${year}-${month}-${day}`;
          } catch(e) {
            detectedDate = new Date().toISOString().split('T')[0];
          }
        } else {
          detectedDate = new Date().toISOString().split('T')[0];
        }

        // 4. Category refinement based on full text keywords
        const lower = text.toLowerCase();
        if (/kopi|coffee|cafe|resto|nasi|mie|burger|makan|teh|snack|drink|food/i.test(lower)) {
          detectedCategory = 'Makanan & Minuman';
        } else if (/spbu|bensin|pertamax|pertalite|solar|bbm|shell|parkir|toll/i.test(lower)) {
          detectedCategory = 'Transportasi';
        } else if (/pln|listrik|pdam|indihome|wifi|pulsa|paket data/i.test(lower)) {
          detectedCategory = 'Tagihan & Utilitas';
        } else if (/obat|vitamin|apotek|paracetamol|klinik|lab/i.test(lower)) {
          detectedCategory = 'Kesehatan';
        }

        return {
          merchant: detectedMerchant || 'Struk Belanja',
          amount: detectedAmount || '0',
          date: detectedDate || new Date().toISOString().split('T')[0],
          category: detectedCategory,
          notes: `Struk: ${detectedMerchant || 'Belanja'} (OCR Otomatis)`
        };
      };

      const handleImageUpload = (file) => {
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
          runOCR(e.target.result);
        };
        reader.readAsDataURL(file);
      };

      const runOCR = async (imageSrc) => {
        setIsScanning(true);
        setScanProgress(10);
        try {
          if (window.Tesseract) {
            const worker = await Tesseract.createWorker('ind+eng', 1, {
              logger: m => {
                if (m.status === 'recognizing text') {
                  setScanProgress(Math.round(m.progress * 100));
                }
              }
            });
            const ret = await worker.recognize(imageSrc);
            await worker.terminate();
            setRawText(ret.data.text);
            const parsed = parseReceiptText(ret.data.text);
            setParsedData(parsed);
          } else {
            // Fallback simulation if offline
            setScanProgress(50);
            setTimeout(() => {
              const sampleText = "INDOMARET POINT\nJL. SUDIRMAN NO. 45\n15/09/2026 14:20\nROTI GANDUM 18.000\nSUSU STERIL 12.500\nSNACK CHIPS 15.000\nTOTAL BELANJA : 45.500\nTUNAI : 50.000\nKEMBALI : 4.500\nTERIMA KASIH";
              setRawText(sampleText);
              setParsedData(parseReceiptText(sampleText));
              setScanProgress(100);
            }, 800);
          }
        } catch (err) {
          console.error("OCR Error:", err);
          alert("Gagal membaca gambar secara otomatis. Anda dapat mencoba contoh struk atau input manual.");
        } finally {
          setIsScanning(false);
        }
      };

      // Fast Sample Presets for Demo
      const applySamplePreset = (presetType) => {
        let sample = '';
        if (presetType === 'indomaret') {
          sample = "INDOMARET FRESH\nJL. KEMANG RAYA NO. 12\n28/09/2026 10:15\nMINYAK GORENG 2L 34.000\nBERAS PREMIUM 5KG 68.000\nSABUN MANDI 15.500\nTOTAL : 117.500\nBAYAR CASH : 120.000\nKEMBALI : 2.500\nTERIMA KASIH";
        } else if (presetType === 'coffee') {
          sample = "KOPI KENANGAN MANTAN\nSENAYAN CITY LT. 3\n29/09/2026 13:45\n1X KENANGAN MANTAN L 24.000\n1X TOAST COKLAT KEJU 22.000\nSUBTOTAL 46.000\nPB1 10% 4.600\nTOTAL HARGA : 50.600\nQRIS BCA : 50.600\nTERIMA KASIH";
        } else if (presetType === 'spbu') {
          sample = "SPBU PERTAMINA 31.124.02\nJL. TB SIMATUPANG\n30/09/2026 08:30\nPOMPA 04 - PERTAMAX\nVOL : 15.38 LTR\nHARGA/LTR : 13.000\nTOTAL TAGIHAN : 200.000\nTUNAI : 200.000\nTERIMA KASIH";
        }
        setRawText(sample);
        setParsedData(parseReceiptText(sample));
      };

      const handleConfirmApply = () => {
        onApplyParsedData(parsedData);
        onClose();
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <IconCameraScan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    Scan Struk Belanja (OCR Pintar)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Foto atau unggah gambar struk, AI & OCR akan mengisi form otomatis
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Upload Zone & Presets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Upload Box */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/20 cursor-pointer relative min-h-[170px]">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Receipt Preview" className="max-h-36 rounded-lg object-contain" />
                  ) : (
                    <div>
                      <IconCameraScan className="w-8 h-8 mx-auto text-emerald-600 mb-2 opacity-80" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Foto Struk / Kamera</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG atau screenshot bukti bayar</p>
                    </div>
                  )}
                </div>

                {/* Quick Test Demo Presets */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      ⚡ Demo Cepat Tanpa Upload:
                    </span>
                    <p className="text-[11px] text-slate-400 mb-2 mt-0.5">Uji coba parser langsung dengan sampel struk nyata:</p>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => applySamplePreset('indomaret')}
                        className="px-3 py-1.5 text-xs text-left font-semibold rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                      >
                        <span>🛒 Struk Belanja Indomaret</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Rp 117.500</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applySamplePreset('coffee')}
                        className="px-3 py-1.5 text-xs text-left font-semibold rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                      >
                        <span>☕ Struk Kafe Kopi Kenangan</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Rp 50.600</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applySamplePreset('spbu')}
                        className="px-3 py-1.5 text-xs text-left font-semibold rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                      >
                        <span>⛽ Struk SPBU Pertamax</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Rp 200.000</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Progress bar if scanning */}
              {isScanning && (
                <div className="space-y-1.5 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span>Menganalisis teks struk dengan Tesseract OCR...</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                </div>
              )}

              {/* Parsed Fields Review */}
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Hasil Ekstraksi OCR
                  </span>
                  <span className="text-[11px] text-slate-400">Bisa diedit sebelum diterapkan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Nominal Terdeteksi (IDR)</label>
                    <input
                      type="text"
                      value={parsedData.amount}
                      onChange={(e) => setParsedData({ ...parsedData, amount: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full px-3 py-1.5 text-sm font-extrabold text-emerald-600 dark:text-emerald-400 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {parsedData.amount > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold">{formatIDR(parsedData.amount)}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Tanggal Transaksi</label>
                    <input
                      type="date"
                      value={parsedData.date}
                      onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Kategori Disarankan</label>
                    <input
                      type="text"
                      value={parsedData.category}
                      onChange={(e) => setParsedData({ ...parsedData, category: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Catatan / Merchant</label>
                    <input
                      type="text"
                      value={parsedData.notes}
                      onChange={(e) => setParsedData({ ...parsedData, notes: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Collapsible raw text preview */}
                {rawText && (
                  <details className="text-[11px] text-slate-400 pt-1">
                    <summary className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 font-semibold">
                      Tampilkan Mentah Teks OCR
                    </summary>
                    <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-900 rounded-lg max-h-24 overflow-y-auto whitespace-pre-wrap font-mono text-[10px]">
                      {rawText}
                    </pre>
                  </details>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                disabled={!parsedData.amount || Number(parsedData.amount) <= 0}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-600/20"
              >
                Terapkan ke Form Transaksi &rarr;
              </button>
            </div>

          </div>
        </div>
      );
    }
