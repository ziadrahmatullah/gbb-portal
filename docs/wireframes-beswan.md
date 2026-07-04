# ASCII Wireframes — Portal Beswan GBB
> Desain: Notion-style (sidebar kiri + konten kanan)

## Global Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🟢 GBB Beswan Portal                            🔔  👤 Ahmad ▼     │
├────────────┬─────────────────────────────────────────────────────────┤
│            │                                                         │
│  SIDEBAR   │                    CONTENT AREA                         │
│            │                                                         │
│  🏠 Beranda     │                                                    │
│  📚 Library     │                                                    │
│  🎓 Mentor      │                                                    │
│  📝 Refleksi    │                                                    │
│  👤 Profile     │                                                    │
│            │                                                         │
│  ───────────    │                                                    │
│  Batch: BBB4    │                                                    │
│  Status: Aktif  │                                                    │
└────────────┴─────────────────────────────────────────────────────────┘
```

---

## 1. Beranda

```
┌─────────────────────────────────────────────────────────────────┐
│  👋 Selamat pagi, Ahmad! Hari ini adalah kesempatan baru       │
│     untuk bertumbuh. Semangat!                                  │
│                                                                 │
│  ┌─── 🔔 Notifikasi ──────────────────────────────────────────┐│
│  │ • Tugas baru: Essay Public Speaking (deadline 30 Sep)       ││
│  │ • Tugas "Refleksi CV" sudah dinilai → Nilai: 85            ││
│  │ • ⚠ Refleksi bulan September belum diisi!                  ││
│  │ • ⚠ IPK semester ini belum diupdate — lengkapi di Profile  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ═══ Progress Saya ═══════════════════════════════════════════  │
│                                                                 │
│  Periode: [BBB4 (Jan–Jun 2026) ▼]   (kalau >1 batch)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 📊 83%   │ │ 📝 85    │ │ 📅 4/5   │ │ 🎓 3.45  │           │
│  │ Kehadiran│ │ Avg Nilai│ │ Refleksi │ │ IPK      │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌─────────────────────────┐ ┌─────────────────────────────────┐│
│  │ Tren bulan ini vs lalu  │ │ IPK per semester (kumulatif)    ││
│  │ (line: hadir & nilai)   │ │ (line lintas periode)           ││
│  └─────────────────────────┘ └─────────────────────────────────┘│
│                                                                 │
│  ═══ My Events ═══════════════════════════════════════════════  │
│                                                                 │
│  ┌────────────────────┐ ┌────────────────────┐ ┌─────────────┐ │
│  │ 🎤 CV Writing      │ │ 🎤 Public Speaking │ │ 🎤 Interview│ │
│  │ 15 Sep 2025        │ │ 22 Sep 2025        │ │ 10 Okt 2025 │ │
│  │ ✅ Hadir           │ │ ✅ Hadir           │ │ 📅 Upcoming │ │
│  │ [▶ Video] [📄 Slide]│ │ [▶ Video] [📄 Slide]│ │ [░░░░] [░░░]│ │
│  └────────────────────┘ └────────────────────┘ └─────────────┘ │
│                                                                 │
│  ═══ My Tasks ════════════════════════════════════════════════  │
│                                                                 │
│  ┌──────────────────┬─────────────┬───────────────┬──────────┐ │
│  │ Judul            │ Deadline    │ Status        │ Aksi     │ │
│  ├──────────────────┼─────────────┼───────────────┼──────────┤ │
│  │ Refleksi CV      │ 20/09 17:00 │ ✅ 85/100     │ [Buka]   │ │
│  │ Essay Speaking   │ 30/09 17:00 │ 📤 terkumpul  │ [Buka]   │ │
│  │ Portfolio        │ 15/10 17:00 │ ⏳ belum (H-1)│ [Buka]   │ │
│  └──────────────────┴─────────────┴───────────────┴──────────┘ │
│  ⏳ belum · 📤 terkumpul · ⏰ terlambat · ✅ dinilai (nilai)    │
│                                                                 │
│  ═══ Prestasiku ══════════════════════════════════════════════  │
│                                                                 │
│  ┌──────────────────────┬──────────┬──────────────────────────┐ │
│  │ Judul                │ Kategori │ Tanggal                  │ │
│  │ Juara 2 Lomba Essay  │ 🏫 Studi │ 10 Sep 2025             │ │
│  │ Volunteer AIESEC     │ 🌐 Luar  │ 15 Agt 2025             │ │
│  └──────────────────────┴──────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1a. Detail Tugas & Submit (Modal — dari My Tasks "Buka")

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Kembali     Essay Speaking · TGS-BBB4-02            [✕]     │
│  Dari event: Public Speaking (EVT-02) · Deadline: 30/09 17:00  │
│                                                                 │
│  ── Soal ────────────────────────────────────────────────────  │
│  Tulis essay 500 kata tentang pengalaman public speaking…       │
│  Lampiran soal: 📎 brief-essay.pdf  [Download]                  │
│                                                                 │
│  ── Jawaban Saya ────────────────────────────────────────────  │
│  ┌─────────────────────────────────┐                            │
│  │ 📎 Upload file (PDF/DOCX, ≤10MB)│  essay-ahmad.pdf ✕         │
│  └─────────────────────────────────┘                            │
│  ✎ Bisa ganti file selama belum lewat deadline; lewat→terkunci. │
│                                          [Submit Jawaban]       │
│                                                                 │
│  ── Setelah dinilai (read-only) ─────────────────────────────  │
│  Nilai: 85/100   Status: ✅ Dinilai                             │
│  Feedback PCM: "Struktur argumen bagus, tambah data…"           │
└─────────────────────────────────────────────────────────────────┘
```
> Jika submit lewat deadline → tetap diterima, ditandai **⏰ Terlambat**.
> Reminder **H-1 deadline** muncul di notifikasi Beranda + email.

---

## 2. Library Materi

```
┌─────────────────────────────────────────────────────────────────┐
│  Library Materi                            [📩 Usul Topik]      │
│                                                                 │
│  ┌──────────┐ ┌──────────┐                                     │
│  │ 📚 24    │ │ 🏷 8     │                                     │
│  │ Total    │ │ Topik    │                                     │
│  │ Materi   │ │ Tag      │                                     │
│  └──────────┘ └──────────┘                                     │
│                                                                 │
│  🔍 Cari materi...  [Semua Tag ▼]                               │
│                                                                 │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────┐ │
│  │ 📄 CV Writing 101  │ │ 📄 Public Speaking │ │ 📄 AI Basics │ │
│  │ #career #cv        │ │ #softskill         │ │ #tech #ai    │ │
│  │ "Materi tentang    │ │ "Tips presentasi   │ │ "Pengenalan  │ │
│  │  cara membuat..."  │ │  yang efektif..."  │ │  artificial."│ │
│  │ 📎 Download  ▶ YT  │ │ 📎 Download  ▶ YT  │ │ 📎 Download  │ │
│  └────────────────────┘ └────────────────────┘ └──────────────┘ │
│                                                                 │
│  ── Usul Topik Materi (Modal) ────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Topik yang ingin dipelajari:                             │   │
│  │ ┌──────────────────────────────────────────────────────┐ │   │
│  │ │ [contoh: Data Analysis, Design Thinking, dll]        │ │   │
│  │ └──────────────────────────────────────────────────────┘ │   │
│  │                                        [Kirim Usulan]    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Mentor

```
┌─────────────────────────────────────────────────────────────────┐
│  Database Mentor                          [🙋 Request 1-on-1]   │
│                                                                 │
│  ℹ Bila membutuhkan kontak mentor, hubungi Tim Program GBB      │
│                                                                 │
│  🔍 Cari mentor...  [Semua Bidang ▼]                            │
│                                                                 │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────┐ │
│  │ 🎓 Dr. Rini        │ │ 🎓 Farhat          │ │ 🎓 Ahmad     │ │
│  │ Public Speaking     │ │ Project Management │ │ Data Science │ │
│  │                     │ │ 🏠 Tim GBB         │ │              │ │
│  │ Event: 3x          │ │ Event: 2x          │ │ Event: 1x    │ │
│  │ [Request 1-on-1]   │ │ [Request 1-on-1]   │ │ [Request]    │ │
│  └────────────────────┘ └────────────────────┘ └──────────────┘ │
│                                                                 │
│  ── Request 1-on-1 (Modal) ───────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ○ Saya sudah tahu mentornya → [Pilih Mentor ▼]          │   │
│  │ ○ Saya belum tahu, tapi butuh bantuan soal:             │   │
│  │   ┌────────────────────────────────────────────────────┐ │   │
│  │   │ Ceritakan kebutuhanmu...                           │ │   │
│  │   │ (contoh: "Saya butuh bimbingan soal skripsi,       │ │   │
│  │   │  topik saya tentang machine learning tapi bingung  │ │   │
│  │   │  mulai dari mana...")                               │ │   │
│  │   └────────────────────────────────────────────────────┘ │   │
│  │                                     [Kirim Request]      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Refleksi Bulanan

> Form **dinamis** dari template `refleksi_pertanyaan` (17 pertanyaan seed, editable admin) — termasuk pertanyaan bersyarat & skala 1–10. Seed: `docs/seeds/refleksi_pertanyaan.seed.json`.

```
┌─────────────────────────────────────────────────────────────────┐
│  Refleksi Bulanan                                               │
│                                                                 │
│  ⚠ Kamu belum mengisi refleksi bulan September!                 │
│                                                                 │
│  Bulan: [September 2025 ▼]    Periode: BBB4                    │
│                                                                 │
│  ┌─── Form Refleksi (17 pertanyaan, dinamis dari template) ──┐   │
│  │                                                           │   │
│  │ § Identitas Dasar                                         │   │
│  │  1. Nama lengkap *           [Ahmad Fauzi] (auto-isi)     │   │
│  │  2. Periode laporan bulan *  [September ▼]                │   │
│  │                                                           │   │
│  │ § Aktivitas Bulanan                                       │   │
│  │  3. Kegiatan apa saja bulan ini? *      [textarea]        │   │
│  │  4. Ikut lomba/kompetisi/seminar? * ( ) Ya  ( ) Tidak     │   │
│  │  5. ↳ Nama lomba/kegiatan   (muncul jika Q4 = Ya)         │   │
│  │  6. Prestasi/pencapaian bulan ini?      [__________]      │   │
│  │  7. Ada organisasi/proker/volunteer/bisnis? *             │   │
│  │       ( ) Ada   ( ) Tidak ada                             │   │
│  │  8. ↳ Jelaskan kontribusimu  (muncul jika Q7 = Ada)       │   │
│  │                                                           │   │
│  │ § Refleksi & Evaluasi                                     │   │
│  │  9. Capaian target bulan lalu? *  [dropdown 5 opsi]       │   │
│  │ 10. Alasan di balik jawaban di atas?    [textarea]        │   │
│  │ 11. Insight personal bulan ini? *       [textarea]        │   │
│  │ 12. Aktivitas paling berkesan & kenapa? [textarea]        │   │
│  │ 13. Skor kepuasan produktivitas * ◯─◯─◯─●─◯ (1–10)       │   │
│  │ 14. Kendala bulan ini?                  [textarea]        │   │
│  │ 15. Target/rencana bulan depan? *       [textarea]        │   │
│  │                                                           │   │
│  │ § Rencana & Masukan                                       │   │
│  │ 16. Masukan/saran untuk program Beswan  [textarea]        │   │
│  │                                                           │   │
│  │ § Dokumentasi                                             │   │
│  │ 17. Upload dokumentasi kegiatan * (multi-file foto/PDF)   │   │
│  │ ┌─────────────────────────────────┐ foto1.jpg ✕          │   │
│  │ │ 📎 Drag & drop / klik upload    │ kegiatan.pdf ✕        │   │
│  │ │    (jpg/png/pdf, ≤5MB/file)     │                       │   │
│  │ └─────────────────────────────────┘                       │   │
│  │ ℹ Transkrip nilai TIDAK di sini → di Profile (per sem.)   │   │
│  │                                                           │   │
│  │ * = wajib                          [Simpan Refleksi]      │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══ Prestasiku ══════════════════════════════  [+ Tambah]      │
│                                                                 │
│  ⚠ Belum ada update prestasi kuartal ini (Q4 2025)              │
│                                                                 │
│  ┌───┬──────────────────┬──────────┬────────┬──────┬──────────┐ │
│  │ # │ Judul            │ Kategori │Tanggal │ File │ Aksi     │ │
│  ├───┼──────────────────┼──────────┼────────┼──────┼──────────┤ │
│  │ 1 │ Juara 2 Essay    │ 🏫 Studi │ 10/09  │ 2 📎 │ 👁 ✏    │ │
│  │ 2 │ Volunteer AIESEC │ 🌐 Luar  │ 15/08  │ 1 📎 │ 👁 ✏    │ │
│  └───┴──────────────────┴──────────┴────────┴──────┴──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Profile

```
┌─────────────────────────────────────────────────────────────────┐
│  Profile                                           [Simpan]     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📷 [Upload Foto]                                        │   │
│  │                                                           │   │
│  │  Nama Lengkap *                                           │   │
│  │  ┌──────────────────────────────────────┐                 │   │
│  │  │ Ahmad Fauzi                          │                 │   │
│  │  └──────────────────────────────────────┘                 │   │
│  │                                                           │   │
│  │  NIM *                     Email *                        │   │
│  │  ┌────────────────┐        ┌────────────────────────┐     │   │
│  │  │ 21050111       │        │ ahmad@mail.undip.ac.id │     │   │
│  │  └────────────────┘        └────────────────────────┘     │   │
│  │                                                           │   │
│  │  No. HP *                                                 │   │
│  │  ┌──────────────────────────────────────┐                 │   │
│  │  │ 081234567890                         │                 │   │
│  │  └──────────────────────────────────────┘                 │   │
│  │                                                           │   │
│  │  CV                                                       │   │
│  │  ┌─────────────────────────────────┐                      │   │
│  │  │  📎 Upload CV (.pdf)            │  cv_ahmad.pdf ✕      │   │
│  │  └─────────────────────────────────┘                      │   │
│  │                                                           │   │
│  │  ── Akademik (wajib diupdate tiap semester) ───────────── │   │
│  │  ⚠ IPK semester BBB4 (Jan–Jun 2026) belum diupdate        │   │
│  │                                                           │   │
│  │  IP Semester Ini          IPK Kumulatif *                 │   │
│  │  ┌──────────┐             ┌──────────┐                    │   │
│  │  │ 3.60     │             │ 3.45     │                    │   │
│  │  └──────────┘             └──────────┘                    │   │
│  │                                                           │   │
│  │  Transkrip *  ┌──────────────────────────┐ transkrip.pdf✕│   │
│  │               │ 📎 Upload (pdf/jpg/png)  │               │   │
│  │               └──────────────────────────┘               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```
