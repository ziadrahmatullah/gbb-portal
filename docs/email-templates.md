# Email Templates — Portal GBB

Spesifikasi semua email transaksional & broadcast portal. **Tech**: Resend + React Email (JSX) — lihat `implementation_plan.md` → Email Notification & Reminder System. Semua copy **Bahasa Indonesia**, nada hangat-profesional (brand: *Impactful Benevolence*).

---

## 1. Pengirim & Reply-To

| Audience | From | Reply-To |
|----------|------|----------|
| **Beswan** (program) | `GBB Portal <portal@baikberdampak.org>` | `program@baikberdampak.org` |
| **Donatur** (AnC) | `GBB Portal <portal@baikberdampak.org>` | `alumnicollaboration@baikberdampak.org` |
| **Internal alert** | `GBB Portal <portal@baikberdampak.org>` | `digital@baikberdampak.org` |

> Domain `baikberdampak.org` harus diverifikasi di Resend (SPF + DKIM + DMARC) agar tidak masuk spam. `portal@` = alamat transaksional khusus (bukan inbox personal).

---

## 2. Design Tokens (email-safe)

Email client tidak selalu support font kustom & CSS modern → gunakan **inline style + table layout** (otomatis dari React Email) dan **font fallback**.

| Token | Value |
|-------|-------|
| Lebar konten | `600px` (mobile: fluid 100%) |
| Background luar | `#f1f1f4` (surface-container) |
| Kartu konten | `#ffffff`, radius `16px`, border `1px #e1e2ec` |
| Primary (CTA) | `#f56a1f` teks `#ffffff` |
| Secondary (link) | `#0675ee` |
| Teks utama | `#1a1c1e` · Teks sekunder | `#44474e` |
| Footer (dark) | bg `#101415`, teks `#f1f0f4` |
| Font stack | `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` |
| Tombol | pill (`border-radius: 9999px`), padding `12px 28px`, bold |

> Sertakan `<link>` Google Fonts Plus Jakarta Sans di `<head>` (terbaca di Apple Mail dll); klien lain otomatis pakai fallback.

---

## 3. Logo & Aset

| Pemakaian | File sumber | Di-deploy ke | URL |
|-----------|-------------|--------------|-----|
| Header (di atas putih) | `docs/Logo GBB/Salinan Warna_Text Bawah.png` | `client/public/email/logo-color.png` | `https://portal.baikberdampak.org/email/logo-color.png` |
| Footer (di atas dark) | `docs/Logo GBB/Salinan Putih_Text Bawah.png` | `client/public/email/logo-white.png` | `https://portal.baikberdampak.org/email/logo-white.png` |

- Gambar email **wajib di-hosting** (bukan inline base64 yang besar) + selalu pakai `alt="Gerakan Baik Berdampak"`.
- Logo header lebar **140px**, center.

---

## 4. Base Layout (skeleton)

Semua template memakai komponen `<EmailLayout>` yang sama: **header logo → kartu konten → footer**. Hanya bagian `{KONTEN}` & `{CTA}` yang berbeda per template.

```html
<!-- React Email: Html > Head > Preview > Body -->
<body style="margin:0;background:#f1f1f4;font-family:'Plus Jakarta Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <!-- preheader tersembunyi (preview text inbox) -->
  <span style="display:none;max-height:0;overflow:hidden;">{PREHEADER}</span>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:24px 16px;">

      <!-- HEADER -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding:16px 0 8px;">
          <img src="https://portal.baikberdampak.org/email/logo-color.png"
               alt="Gerakan Baik Berdampak" width="140" style="display:block;border:0;" />
        </td></tr>
      </table>

      <!-- KARTU KONTEN -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e1e2ec;border-radius:16px;">
        <tr><td style="padding:32px;color:#1a1c1e;font-size:16px;line-height:24px;">

          {KONTEN}

          <!-- CTA (opsional) -->
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 4px;"><tr>
            <td bgcolor="#f56a1f" style="border-radius:9999px;">
              <a href="{CTA_URL}" style="display:inline-block;padding:12px 28px;color:#ffffff;
                 font-weight:700;text-decoration:none;font-size:16px;">{CTA_LABEL}</a>
            </td>
          </tr></table>

        </td></tr>
      </table>

      <!-- FOOTER -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:#101415;border-radius:16px;margin-top:16px;">
        <tr><td style="padding:24px 32px;color:#c4c6cf;font-size:12px;line-height:18px;" align="center">
          <img src="https://portal.baikberdampak.org/email/logo-white.png" alt="GBB" width="96" style="display:block;margin:0 auto 12px;border:0;" />
          <strong style="color:#f1f0f4;">Yayasan Gerakan Baik Berdampak</strong><br/>
          AHU-0010854.AH.01.04.Tahun 2024 · Universitas Diponegoro, Semarang<br/>
          <a href="https://baikberdampak.org" style="color:#a2c9ff;text-decoration:none;">baikberdampak.org</a> ·
          <a href="https://instagram.com/baikberdampak" style="color:#a2c9ff;text-decoration:none;">@baikberdampak</a>
          {FOOTER_EXTRA}
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
```

**Varian footer:**
- **Transaksional** (welcome, tugas, reset, dll): `{FOOTER_EXTRA}` kosong.
- **Broadcast** (Monthly Highlight): `{FOOTER_EXTRA}` = `<br/><br/>Kamu menerima email ini sebagai donatur GBB. <a href="{unsubscribe_url}">Berhenti berlangganan</a>.`

> Sertakan **plain-text version** (React Email auto-generate) untuk deliverability.

---

## 5. Katalog Template

| # | ID | Audience | Subject | Trigger |
|---|----|----------|---------|---------|
| B1 | `beswan-welcome` | Beswan | Selamat datang di Portal Beswan GBB 🎓 | Akun dibuat |
| B2 | `beswan-tugas-baru` | Beswan | 📝 Tugas baru: {judul} — deadline {tanggal} | Penugasan publish |
| B3 | `beswan-tugas-deadline` | Beswan | ⏰ Besok deadline: {judul} | Cron H-1, belum submit |
| B4 | `beswan-tugas-dinilai` | Beswan | ✅ Tugasmu sudah dinilai: {judul} | PCM submit nilai |
| B5 | `beswan-refleksi-reminder` | Beswan | 📔 Jangan lupa isi Refleksi {bulan} | Cron tgl 25, belum isi |
| B6 | `beswan-prestasi-reminder` | Beswan | 🏆 Yuk update prestasimu kuartal ini | Cron akhir kuartal |
| B7 | `beswan-event-reminder` | Beswan | 📅 Besok ada {nama_event}! | Cron H-1 event |
| B8 | `beswan-ipk-reminder` | Beswan | 🎓 Update IP & IPK semester ini | Cron awal semester |
| B9 | `beswan-reset-password` | Beswan | 🔑 Reset password Portal GBB | Request lupa password |
| D1 | `donatur-welcome` | Donatur | Terima kasih telah bergabung sebagai Donatur GBB 💚 | Akun di-link |
| D2 | `donatur-laporan` | Donatur | 📄 Laporan baru GBB: {judul} | Laporan is_public di-upload |
| D3 | `donatur-monthly-highlight` | Donatur | ✨ Kabar baik dari GBB bulan {bulan} | Cron awal bulan |
| D4 | `donatur-mentor-terdaftar` | Donatur | 🎓 Pendaftaran mentor kamu kami terima! | Submit form mentor |
| I1 | `internal-ai-gagal` | Internal | ⚠️ [Portal GBB] Layanan AI gagal — perlu dicek | AI error/kuota habis |
| I2 | `internal-donatur-belum-klasifikasi` | Internal (AnC) | 📌 [Portal GBB] {n} donatur belum diklasifikasi | Cron awal semester |

---

## 6. Isi per Template

> Format tiap entri: **Subject · Preheader · Konten · CTA · Variabel**. `{var}` = placeholder.

### B1 · `beswan-welcome`
- **Subject**: Selamat datang di Portal Beswan GBB 🎓
- **Preheader**: Akun kamu sudah aktif — ini detail login pertamamu.
- **Konten**:
  > Halo **{nama}**, selamat bergabung di Beasiswa Baik Berdampak! 🎉
  > Portal Beswan adalah tempatmu mengikuti event, mengumpulkan tugas, mengisi refleksi bulanan, dan memantau progress pembinaan.
  >
  > **Detail login:**
  > Email: **{email}** · Password sementara: **{password}**
  > Demi keamanan, **ganti password** setelah login pertama, dan lengkapi profil (HP wajib + IPK semester berjalan).
- **CTA**: `Masuk ke Portal` → `{login_url}`
- **Variabel**: `nama, email, password, login_url`

### B2 · `beswan-tugas-baru`
- **Subject**: 📝 Tugas baru: {judul} — deadline {tanggal}
- **Preheader**: Ada penugasan baru dari tim Program GBB.
- **Konten**:
  > Halo **{nama}**, ada tugas baru: **{judul}**.
  > {deskripsi_singkat}
  > 🗓 Deadline: **{deadline}** · Nilai maksimum: {nilai_maks}{baris_event}
- **CTA**: `Lihat & Kerjakan` → `{tugas_url}`
- **Variabel**: `nama, judul, deskripsi_singkat, deadline, nilai_maks, baris_event (mis. "· Dari event: {nama_event}"), tugas_url`

### B3 · `beswan-tugas-deadline`
- **Subject**: ⏰ Besok deadline: {judul}
- **Preheader**: Tugasmu belum dikumpulkan — jangan sampai terlewat.
- **Konten**:
  > Halo **{nama}**, pengingat: tugas **{judul}** jatuh tempo **besok ({deadline})** dan kamu **belum mengumpulkan**.
  > Kamu masih bisa mengunggah & mengganti jawaban sampai deadline.
- **CTA**: `Kumpulkan Sekarang` → `{tugas_url}`
- **Variabel**: `nama, judul, deadline, tugas_url`

### B4 · `beswan-tugas-dinilai`
- **Subject**: ✅ Tugasmu sudah dinilai: {judul}
- **Preheader**: Nilai & feedback dari tim Program sudah tersedia.
- **Konten**:
  > Halo **{nama}**, tugas **{judul}** sudah dinilai.
  > 🎯 Nilai: **{nilai}/{nilai_maks}**
  > 💬 Feedback: "{feedback}"
- **CTA**: `Lihat Detail` → `{tugas_url}`
- **Variabel**: `nama, judul, nilai, nilai_maks, feedback, tugas_url`

### B5 · `beswan-refleksi-reminder`
- **Subject**: 📔 Jangan lupa isi Refleksi {bulan}
- **Preheader**: Refleksi bulanan wajib diisi sebelum akhir bulan.
- **Konten**:
  > Halo **{nama}**, kamu **belum mengisi Refleksi Bulanan untuk {bulan}**.
  > Refleksi membantu tim memahami progress & kebutuhanmu — jangan sampai terlewat ya. Sekalian unggah dokumentasi kegiatan bulan ini.
- **CTA**: `Isi Refleksi` → `{refleksi_url}`
- **Variabel**: `nama, bulan, refleksi_url`

### B6 · `beswan-prestasi-reminder`
- **Subject**: 🏆 Yuk update prestasimu kuartal ini
- **Preheader**: Catat pencapaianmu 3 bulan terakhir.
- **Konten**:
  > Halo **{nama}**, sudah masuk akhir kuartal **{kuartal}**. Punya prestasi atau pencapaian baru (studi/organisasi/luar kampus)? Catat di portal dan unggah sertifikat/fotonya.
- **CTA**: `Tambah Prestasi` → `{prestasi_url}`
- **Variabel**: `nama, kuartal, prestasi_url`

### B7 · `beswan-event-reminder`
- **Subject**: 📅 Besok ada {nama_event}!
- **Preheader**: Jangan lewatkan event pembinaan besok.
- **Konten**:
  > Halo **{nama}**, besok ada **{nama_event}**.
  > 🗓 {tanggal}, {jam} · 📍 {lokasi}
  > Sampai jumpa di sana! Kehadiranmu dicatat untuk rapor.
- **CTA**: `Lihat Detail Event` → `{event_url}`
- **Variabel**: `nama, nama_event, tanggal, jam, lokasi, event_url`

### B8 · `beswan-ipk-reminder`
- **Subject**: 🎓 Update IP & IPK semester ini
- **Preheader**: Perbarui data akademikmu di profil.
- **Konten**:
  > Halo **{nama}**, semester baru sudah dimulai. Mohon perbarui **IP semester berjalan + IPK kumulatif** dan unggah **transkrip** di halaman Profil. Data ini wajib diperbarui tiap semester.
- **CTA**: `Update IPK` → `{profil_url}`
- **Variabel**: `nama, profil_url`

### B9 · `beswan-reset-password`
- **Subject**: 🔑 Reset password Portal GBB
- **Preheader**: Link ini berlaku 1 jam.
- **Konten**:
  > Halo **{nama}**, kami menerima permintaan reset password untuk akunmu.
  > Klik tombol di bawah untuk membuat password baru. **Link berlaku 1 jam.**
  > Jika kamu tidak meminta ini, abaikan email ini — password lamamu tetap aman.
- **CTA**: `Reset Password` → `{reset_url}`
- **Variabel**: `nama, reset_url`

### D1 · `donatur-welcome`
- **Subject**: Terima kasih telah bergabung sebagai Donatur GBB 💚
- **Preheader**: Akun kamu sudah terhubung — pantau dampak kontribusimu.
- **Konten**:
  > Halo **{nama}**, terima kasih telah menjadi bagian dari #10AlumniBantuSatu! 💚
  > Lewat Portal Donatur, kamu bisa memantau **transparansi keuangan**, progress beswan yang kamu dukung, dan laporan GBB.
  > 💡 Pastikan email Gmail yang kamu pakai login sama dengan email saat mengisi form pendaftaran. Jika berbeda, hubungi Tim AnC.
- **CTA**: `Buka Portal Donatur` → `{login_url}`
- **Variabel**: `nama, login_url`

### D2 · `donatur-laporan`
- **Subject**: 📄 Laporan baru GBB: {judul}
- **Preheader**: Dokumen transparansi terbaru sudah tersedia.
- **Konten**:
  > Halo **{nama}**, ada dokumen baru yang bisa kamu akses: **{judul}** ({tipe}).
  > Sebagai bentuk transparansi, kami membagikan ini kepada para donatur GBB.
- **CTA**: `Lihat Laporan` → `{laporan_url}`
- **Variabel**: `nama, judul, tipe, laporan_url`

### D3 · `donatur-monthly-highlight`
- **Subject**: ✨ Kabar baik dari GBB bulan {bulan}
- **Preheader**: Ringkasan dampak & kegiatan bulan ini.
- **Konten**:
  > Halo **{nama}**, ini ringkasan perjalanan GBB bulan **{bulan}**:
  > • 🎤 {jumlah_event} event terlaksana
  > • 👥 {jumlah_beswan} beswan aktif dibina
  > • 🏆 {jumlah_prestasi} prestasi baru beswan
  > {narasi_singkat}
  > Terima kasih sudah menjadi bagian dari setiap langkah ini. 💚
- **CTA**: `Lihat Dashboard` → `{dashboard_url}`
- **Variabel**: `nama, bulan, jumlah_event, jumlah_beswan, jumlah_prestasi, narasi_singkat, dashboard_url, unsubscribe_url`
- **Footer**: varian **broadcast** (ada unsubscribe)

### D4 · `donatur-mentor-terdaftar`
- **Subject**: 🎓 Pendaftaran mentor kamu kami terima!
- **Preheader**: Tim GBB akan meninjau & menghubungimu.
- **Konten**:
  > Halo **{nama}**, terima kasih sudah mendaftar sebagai **mentor GBB**! 🙌
  > Pendaftaranmu (bidang: {bidang}) sedang **ditinjau** tim Program. Kami akan menghubungimu untuk langkah berikutnya. Ada merchandise menarik menanti mentor terdaftar! 🎁
- **CTA**: _(opsional)_ `Lihat Program Mentoring` → `{mentor_url}`
- **Variabel**: `nama, bidang, mentor_url`

### I1 · `internal-ai-gagal`
- **Subject**: ⚠️ [Portal GBB] Layanan AI gagal — perlu dicek
- **Preheader**: Fitur AI fallback aktif; segera periksa konfigurasi.
- **Penerima**: semua `INTERNAL_ALERT_EMAILS`
- **Konten**:
  > **Peringatan sistem.** Layanan AI ({fitur}) gagal pada {waktu}.
  > Penyebab: **{error}** (mis. kuota/API key habis, timeout).
  > **Dampak**: {dampak} — mis. ringkasan refleksi donatur kini tampil apa adanya (verbatim) / materi Library tersimpan tanpa ringkasan.
  > Mohon periksa **Settings → Konfigurasi AI** (saldo/API key/provider aktif).
- **CTA**: `Buka Konfigurasi AI` → `{settings_ai_url}`
- **Variabel**: `fitur, waktu, error, dampak, settings_ai_url`
- **Catatan**: idempoten — 1 email per insiden/window (jangan spam).

### I2 · `internal-donatur-belum-klasifikasi`
- **Subject**: 📌 [Portal GBB] {n} donatur belum diklasifikasi
- **Preheader**: Saatnya update keikutsertaan donatur periode baru.
- **Penerima**: AnC (`alumnicollaboration@baikberdampak.org`)
- **Konten**:
  > Awal semester **{periode}** sudah dimulai. Saat ini ada **{n} donatur** yang belum di-assign ke periode manapun.
  > Mohon update keikutsertaan donatur (siapa yang lanjut/berhenti/baru) di Database Donatur.
- **CTA**: `Buka Database Donatur` → `{db_donatur_url}`
- **Variabel**: `n, periode, db_donatur_url`

---

## 7. Implementasi (catatan engineer)

- 1 komponen `EmailLayout` + 1 file per template di `server/src/email/templates/` (lihat struktur folder `implementation_plan.md`).
- Semua placeholder = props bertipe (TypeScript) — jangan string-concat manual.
- **Alt text** wajib di semua `<img>`; sertakan **plain-text fallback**.
- Subject & preheader tidak boleh kosong (preheader memengaruhi open rate).
- Email reminder/broadcast lewat **cron yang idempoten** (lihat Cron Schedule) — jangan kirim dobel.
- Uji render lintas klien (Gmail, Outlook, Apple Mail, mobile) sebelum rilis.
