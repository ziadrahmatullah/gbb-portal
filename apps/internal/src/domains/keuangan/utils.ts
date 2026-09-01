import type { CashflowDraft, CashflowKategori, UpdateCashflowReq } from "./services";
import type { DonaturOption } from "@/domains/donatur/services";

// Satu sumber format rupiah untuk seluruh app — di-reexport agar import
// lama di domain keuangan tidak perlu diubah
export { formatNominal, singkatNominal } from "@/shared/lib/nominal";

// Di wizard upload, baris belum ada di DB — klasifikasi diedit lokal sampai
// user klik Simpan. Efek PUT backend (resolve nama relasi + hitung ulang
// status_klasifikasi) ditiru di sini supaya tampilan draft sama persis dengan
// hasil akhirnya. Aturan status mengikuti backend: kategori wajib, dan untuk
// cash_in donatur harus terisi ATAU ditandai anonim.
export function applyKlasifikasiPatch(
  row: CashflowDraft,
  patch: UpdateCashflowReq,
  kategoris: CashflowKategori[],
  donaturs: DonaturOption[]
): CashflowDraft {
  const next: CashflowDraft = { ...row };

  if (patch.kategori_id !== undefined) {
    const picked = kategoris.find((k) => k.id === patch.kategori_id);
    // Keyword auto-match bisa menunjuk sub-kategori langsung — normalisasi ke
    // {kategori_id: induk, sub_kategori_id: sub} seperti yang dilakukan backend
    if (picked?.parent_id) {
      next.kategori_id = picked.parent_id;
      next.sub_kategori_id = picked.id;
    } else {
      next.kategori_id = patch.kategori_id;
      // ganti kategori induk → sub lama tidak relevan lagi
      if (patch.kategori_id !== row.kategori_id) next.sub_kategori_id = null;
    }
  }
  if (patch.sub_kategori_id !== undefined) next.sub_kategori_id = patch.sub_kategori_id;
  if (patch.clear_sub_kategori) next.sub_kategori_id = null;

  if (patch.donatur_id !== undefined) next.donatur_id = patch.donatur_id;
  if (patch.is_anonymous !== undefined) next.is_anonymous = patch.is_anonymous;
  if (patch.clear_donatur) next.donatur_id = null;
  if (patch.catatan !== undefined) next.catatan = patch.catatan;

  const kategoriById = new Map(kategoris.map((k) => [k.id, k]));
  next.kategori_nama = next.kategori_id ? (kategoriById.get(next.kategori_id)?.nama ?? "") : "";
  next.sub_kategori_nama = next.sub_kategori_id
    ? (kategoriById.get(next.sub_kategori_id)?.nama ?? "")
    : "";
  next.donatur_nama = next.donatur_id
    ? (donaturs.find((d) => d.id === next.donatur_id)?.nama ?? "")
    : "";

  // Badge "✓ auto" hanya berlaku selama baris belum disentuh manual —
  // backend juga me-reset match_source pada setiap update manual
  next.match_source = null;
  next.status_klasifikasi = isKlasifikasiLengkap(next) ? "inputted" : "unknown";
  return next;
}

export function isKlasifikasiLengkap(row: {
  kategori_id?: number | null;
  tipe: string;
  donatur_id?: number | null;
  is_anonymous: boolean;
}) {
  if (!row.kategori_id) return false;
  if (row.tipe === "cash_in") return Boolean(row.donatur_id) || row.is_anonymous;
  return true;
}
