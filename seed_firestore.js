const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBdeJ97ljgiKW3nLvvaCysMxgDVoSzAX58",
  authDomain: "finansialku-pro.firebaseapp.com",
  projectId: "finansialku-pro",
  storageBucket: "finansialku-pro.firebasestorage.app",
  messagingSenderId: "1087652448577",
  appId: "1:1087652448577:web:3676cad79d3ce96e8179c0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("Menghubungkan ke Firestore project 'finansialku-pro'...");
  try {
    const sampleData = {
      appName: "FinansialKu Pro",
      version: "3.0",
      createdAt: new Date().toISOString(),
      profiles: [
        { id: "personal", name: "Keuangan Pribadi", icon: "👤", desc: "Arus kas harian & tabungan" },
        { id: "business", name: "Bisnis Sampingan", icon: "💼", desc: "Modal usaha, omzet & piutang" }
      ],
      accounts: [
        { id: "acc-cash", name: "Dompet Tunai (Cash)", type: "cash", balance: 750000, color: "emerald", notes: "Uang fisik di dompet" },
        { id: "acc-bca", name: "Bank BCA", type: "bank", balance: 5200000, color: "blue", notes: "Rekening operasional harian" },
        { id: "acc-gopay", name: "GoPay / E-Wallet", type: "ewallet", balance: 320000, color: "cyan", notes: "Untuk jajan & transportasi" }
      ],
      categories: {
        income: ["Gaji", "Freelance & Bisnis", "Investasi", "Hadiah / Bonus", "Penjualan", "Lain-lain"],
        expense: ["Makanan & Minuman", "Transportasi", "Tagihan & Utilitas", "Belanja", "Hiburan", "Kesehatan", "Pendidikan", "Modal Bisnis", "Lain-lain"]
      },
      goals: [
        { id: "goal-1", name: "Dana Darurat 6 Bulan", targetAmount: 20000000, currentAmount: 8500000, deadline: "2026-12-31", category: "Keamanan" },
        { id: "goal-2", name: "Liburan Akhir Tahun", targetAmount: 7000000, currentAmount: 3200000, deadline: "2026-11-20", category: "Lifestyle" }
      ],
      debts: [
        { id: "debt-1", type: "receivable", personName: "Rian Pratama (Teman)", totalAmount: 1500000, paidAmount: 500000, dueDate: "2026-10-15", status: "partial" },
        { id: "debt-2", type: "debt", personName: "Budi Santoso", totalAmount: 1000000, paidAmount: 0, dueDate: "2026-10-05", status: "unpaid" }
      ]
    };

    // 1. Write to a demo global document
    console.log("Mencoba menulis ke koleksi 'finansialku_config' / 'initial_setup'...");
    await setDoc(doc(db, "finansialku_config", "initial_setup"), sampleData);
    console.log("✅ BERHASIL: Koleksi 'finansialku_config' berhasil dibuat di Firestore!");

    // 2. Write to demo user document
    console.log("Mencoba menulis ke koleksi 'users' / 'demo_user'...");
    await setDoc(doc(db, "users", "demo_user"), {
      profileName: "Pengguna Demo",
      data: {
        personal: {
          accounts: sampleData.accounts,
          categories: sampleData.categories,
          goals: sampleData.goals,
          debts: sampleData.debts,
          transactions: [
            { id: "tx-1", type: "income", amount: 6500000, category: "Gaji", date: "2026-09-25", notes: "Gaji Bulanan", accountId: "acc-bca" },
            { id: "tx-2", type: "expense", amount: 125000, category: "Makanan & Minuman", date: "2026-09-28", notes: "Makan Siang Resto", accountId: "acc-cash" }
          ]
        }
      },
      updatedAt: new Date().toISOString()
    });
    console.log("✅ BERHASIL: Koleksi 'users' berhasil dibuat di Firestore!");
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR SAAT MENULIS KE FIRESTORE:", err);
    process.exit(1);
  }
}

main();
