// Penyingkatan nominal rupiah untuk sel tabel yang sempit.
//
// PENTING soal satuan: dalam bahasa Indonesia "M" berarti MILIAR (10^9),
// bukan million. "Rp 5 M" dibaca lima miliar — konvensi ini dipakai luas di
// iklan properti, berita, dan perbankan. Memakai "M" untuk juta akan salah
// dibaca 1000x lipat. "B" (billion) tidak dipakai dalam bahasa Indonesia.
//
// Tangga yang benar:
//   ribu    10^3  -> "k"   (alternatif Indonesia: "rb")
//   juta    10^6  -> "jt"
//   miliar  10^9  -> "M"
//   triliun 10^12 -> "T"
const TANGGA = [
  { batas: 1_000_000_000_000, suffix: "T" },
  { batas: 1_000_000_000, suffix: "M" },
  { batas: 1_000_000, suffix: "jt" },
  { batas: 1_000, suffix: "k" },
] as const;

/**
 * 850 -> "850" · 100_000 -> "100k" · 1_500_000 -> "1,5jt"
 * 2_000_000_000 -> "2M" · 1_200_000_000_000 -> "1,2T"
 *
 * Maksimal satu angka di belakang koma, dan ",0" dibuang. Pemisah desimalnya
 * koma mengikuti kaidah Indonesia.
 */
export function singkatNominal(v: number): string {
  const negatif = v < 0;
  const n = Math.abs(v);
  let hasil: string;

  const unit = TANGGA.find((t) => n >= t.batas);
  if (!unit) {
    hasil = String(Math.round(n));
  } else {
    const angka = n / unit.batas;
    // Pembulatan bisa mendorong nilai ke satuan berikutnya (999.999 -> 1000k),
    // jadi naikkan tangganya alih-alih menampilkan angka empat digit
    const dibulatkan = Math.round(angka * 10) / 10;
    if (dibulatkan >= 1000) {
      const naik = TANGGA[TANGGA.indexOf(unit) - 1];
      hasil = naik ? `1${naik.suffix}` : `${dibulatkan}${unit.suffix}`;
    } else {
      hasil = `${String(dibulatkan).replace(".", ",")}${unit.suffix}`;
    }
  }
  return negatif ? `-${hasil}` : hasil;
}

/** Versi lengkap dengan pemisah ribuan: 1500000 -> "1.500.000" */
export const formatNominal = (v: number) => new Intl.NumberFormat("id-ID").format(v);
