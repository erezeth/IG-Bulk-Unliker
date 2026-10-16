# IG Bulk Unliker

Extension Chrome/Brave (Manifest V3) untuk **batal suka (unlike) banyak postingan Instagram sekaligus** lewat halaman *Aktivitas Anda → Suka*. Dilengkapi UI mengambang, kontrol batch, deteksi pembatasan Instagram, dan fallback **trusted click** via Chrome DevTools Protocol ketika klik biasa tidak berpengaruh.

> ⚠️ **Disclaimer:** Tool ini untuk keperluan pribadi (membersihkan riwayat suka sendiri). Gunakan dengan risiko sendiri. Instagram dapat membatasi akun jika aksi dilakukan terlalu agresif. Penulis tidak bertanggung jawab atas segala konsekuensi penggunaan.

---

## ✨ Fitur

- 🔁 **Batch otomatis** — pilih N postingan, klik Batal suka, konfirmasi dialog, ulangi sampai target tercapai.
- 🖱️ **Multi-strategi klik** — sintetis event, `.click()`, keyboard Enter, dan **trusted click** (debugger) sebagai cadangan.
- 🧠 **Auto-deteksi strategi** yang berhasil agar batch berikutnya lebih cepat.
- 🌐 **Dukungan multi-bahasa** label tombol (Inggris + Indonesia). Mudah ditambah di `content.js`.
- 🎚️ **UI mengambang** (Shadow DOM) — tidak mengganggu halaman Instagram, bisa diminimalkan.
- 🛑 **Deteksi pembatasan** Instagram ("Try again later", "Action blocked", dll.) dan berhenti otomatis.
- 🔍 **Diagnosa & salin log** untuk troubleshooting.
- ⏱️ **Jeda acak** antar batch untuk mengurangi risiko deteksi.

---

## 📦 Instalasi

### 1. Unduh / Clone Repo

```bash
git clone https://github.com/USERNAME/ig-bulk-unliker.git
```

Atau ekstrak file `ig-unliker.zip` jika kamu menerima versi rilis.

### 2. Muat di Browser (Chrome / Brave / Edge)

1. Buka `chrome://extensions` atau `brave://extensions`.
2. Aktifkan **Developer mode** di sudut kanan atas.
3. Klik **Load unpacked**, lalu pilih folder `ig-unliker`.
   - Jika sudah pernah terpasang, cukup klik ikon **Reload** ⟳.
4. **Refresh (F5)** halaman Instagram yang sedang dibuka.

---

## 🚀 Cara Pakai

1. Buka halaman [Instagram Activity → Likes](https://www.instagram.com/your_activity/interactions/likes/), atau klik tombol **Buka halaman Suka** pada panel extension.
2. Panel **IG Bulk Unliker** akan muncul di kanan bawah.
   - **Ukuran batch** — jumlah postingan per siklus (1–300, default 25).
   - **Target total** — batas total unlike (0 = semua).
3. Klik **▶ Mulai**.
4. Proses akan:
   - Masuk ke mode **Pilih**.
   - Memilih postingan sesuai batch.
   - Menekan tombol **Batal suka / Unlike / Delete**.
   - Mengonfirmasi dialog jika diperlukan.
   - Menunggu selama 5–10 detik, lalu mengulangi proses.
5. Klik **■ Stop** kapan saja untuk menghentikan proses.

### Tombol Bantu

| Tombol | Fungsi |
|:---|:---|
| 🔍 **Diagnosa** | Menampilkan informasi DOM (checkbox, tombol, tile, dialog) ke log. |
| 📋 **Salin log** | Menyalin seluruh log ke clipboard untuk pelaporan bug. |
| **–** (minimize) | Mengecilkan panel menjadi tombol bulat `❤ Unliker`. |

---

## 🔐 Izin (Permissions)

| Permission | Alasan |
|:---|:---|
| `debugger` | Mengirim event `Input.dispatchMouseEvent` melalui Chrome DevTools Protocol sehingga klik dapat diperlakukan sebagai **trusted input** oleh browser. Digunakan sebagai fallback ketika klik sintetis gagal. |
| `content_scripts` pada `https://www.instagram.com/*` | Menyuntikkan UI dan logika otomasi ke halaman Instagram. |

> **Catatan:** Saat fitur *trusted click* digunakan, Brave/Chrome menampilkan bar **"sedang men-debug browser"** di bagian atas. Ini normal dan akan hilang setelah proses selesai atau dihentikan.

---

## 🧩 Struktur Proyek

```text
ig-unliker/
├── manifest.json      # Manifest V3
├── background.js      # Service worker: trusted click via CDP
├── content.js         # UI dan logika otomasi
└── README.md
```

### Cara Kerja Singkat

```text
┌─────────────────────┐   trustedClick   ┌────────────────────┐
│  content.js (page)  │ ───────────────► │   background.js    │
│  - Cari tombol      │                  │   chrome.debugger  │
│  - Coba klik        │ ◄─────────────── │   Input.dispatch...│
└─────────────────────┘   { ok: true }   └────────────────────┘
```

`content.js` mencoba 5 strategi klik secara berurutan:

1. Klik sintetis (`PointerEvent` + `MouseEvent` lengkap).
2. `element.click()`.
3. Event langsung ke elemen.
4. Simulasi keyboard Enter.
5. **Trusted click** melalui debugger.

Strategi yang berhasil disimpan dalam variabel `best`, sehingga siklus berikutnya dapat langsung menggunakan metode tersebut.

---

## 🌍 Menambah Bahasa Lain

Edit objek `T` di `content.js`:

```js
const T = {
  select: [
    'select',
    'pilih',
    'auswählen',
    'sélectionner'
  ],

  unlike: [
    'unlike',
    'batal suka',
    'gefällt mir nicht mehr',
    'ne plus aimer'
  ],

  cancel: [
    'cancel',
    'batal',
    'abbrechen',
    'annuler'
  ]
};
```

Tambahkan kata kunci tombol sesuai bahasa antarmuka Instagram yang digunakan. Gunakan huruf kecil agar konsisten dengan proses pencocokan teks di extension.

---

## 🐞 Troubleshooting

| Masalah | Solusi |
|:---|:---|
| Panel tidak muncul | Refresh halaman Instagram setelah memuat atau me-reload extension. |
| "Tombol Select/Pilih tidak ditemukan" | Pastikan berada di `/your_activity/interactions/likes/`. Jalankan **Diagnosa** dan periksa teks tombol di log. |
| Semua cara klik gagal | Struktur UI Instagram mungkin telah berubah. Jalankan diagnosa dan periksa log untuk menemukan penyebabnya. |
| "Instagram membatasi aksi" | Hentikan proses dan jangan langsung menjalankannya kembali. |
| Bar "sedang men-debug" tidak hilang | Klik **Stop** atau tutup tab Instagram untuk memutus sesi debugger. |
| Error `Cannot access a chrome:// URL` | Reload extension di `chrome://extensions`, lalu refresh halaman Instagram. |

---

## 🛠️ Pengembangan

1. Edit file yang diperlukan.
2. Buka `chrome://extensions`.
3. Klik **Reload** pada extension.
4. Refresh halaman Instagram.
5. Buka **DevTools → Console** untuk melihat log dengan prefix `[IG Unliker]`.

Semua log juga ditampilkan di panel UI. Gunakan tombol **📋 Salin log** untuk menyalin log ketika melakukan troubleshooting.

---

## ⚠️ Batasan

- Dirancang untuk bekerja pada halaman *Aktivitas Anda → Suka*.
- Bergantung pada struktur DOM Instagram yang dapat berubah sewaktu-waktu.
- Tidak ada jaminan bebas dari pembatasan akun.
- Penggunaan otomasi tetap dapat memicu pembatasan Instagram, meskipun proses menggunakan jeda antarbatch.
- Permission `debugger` memberikan akses yang sensitif dan dapat memunculkan peringatan browser. Gunakan hanya jika memahami implikasinya.

---

## 📄 Lisensi

**MIT License** — bebas digunakan dan dimodifikasi sesuai ketentuan lisensi. Sertakan atribusi dan salinan lisensi saat mendistribusikan ulang.

---

## 🙏 Kontribusi

Pull request dan issue sangat diterima, terutama untuk:

- Penambahan label tombol dalam bahasa lain.
- Perbaikan selector DOM jika Instagram mengubah UI.
- Peningkatan heuristik deteksi pembatasan.
- Perbaikan stabilitas dan penanganan error.

**Selamat membersihkan riwayat suka!** 💔 → ❤️
