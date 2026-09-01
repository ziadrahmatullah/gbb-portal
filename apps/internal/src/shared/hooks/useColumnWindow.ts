import { useState } from "react";

/**
 * Jendela geser untuk kolom tabel yang jumlahnya tumbuh terus (matriks periode
 * di Db Donatur, matriks bulan di Monitoring). Menampilkan sepotong kolom lalu
 * digeser dengan panah, supaya kolom identitas dan aksi tidak terdorong keluar
 * layar.
 *
 * Dua hal yang perlu diketahui pemakai:
 *
 * - Panah HANYA muncul kalau `total > size`. Jangan set `size` sebesar jumlah
 *   kolom yang ada sekarang, atau slidernya tidak akan pernah tampil.
 * - Path kolom yang dirender jangan saling jadi prefix kalau dipakai untuk
 *   nav/route; ini murni soal indeks, tapi kesalahan itu pernah terjadi.
 *
 * Sebelum digeser manual, jendelanya menempel ke UJUNG KANAN — periode/bulan
 * terbaru yang paling sering dilihat. Offset ikut ter-clamp sendiri saat jumlah
 * kolom berubah (mis. ganti filter periode), jadi tidak perlu useEffect.
 */
export function useColumnWindow(total: number, size: number) {
  const [manualOffset, setManualOffset] = useState<number | null>(null);

  const maxOffset = Math.max(0, total - size);
  const offset = Math.min(manualOffset ?? maxOffset, maxOffset);

  return {
    offset,
    maxOffset,
    /** Rentang [offset, offset + size) untuk di-slice ke array kolom */
    size,
    showArrows: total > size,
    canPrev: offset > 0,
    canNext: offset < maxOffset,
    prev: () => setManualOffset(Math.max(0, offset - 1)),
    next: () => setManualOffset(Math.min(maxOffset, offset + 1)),
    /** Potong array kolom apa pun sesuai jendela saat ini */
    slice: <T>(columns: T[]) => columns.slice(offset, offset + size),
  };
}
