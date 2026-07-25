import { apiClient } from "@/shared/lib/apiClient";

// Mirror gbb-backend dto/donatur_dto.go
export interface KonsistensiBulan {
  bulan: number;
  tahun: number;
  donasi: boolean;
}

export interface BatchKonsistensi {
  periode_id: number;
  periode_nama: string;
  aktif: boolean;
  // Panjang array BEDA-BEDA per periode (dari start_date periode s.d. min(end_date, hari
  // ini)) — jangan asumsikan semua baris punya jumlah bulan yang sama.
  bulanan: KonsistensiBulan[];
}

export interface DonaturBeranda {
  total_donasi: number;
  konsistensi_bulan_ini_terpenuhi: number;
  konsistensi_bulan_ini_total: number;
  batch_diikuti: string[];
  history_konsistensi: BatchKonsistensi[];
}

export async function getMyDashboard() {
  const res = await apiClient.get<DonaturBeranda>("/donatur/dashboard");
  return res.data;
}

// Mirror dto/highlight_dto.go HighlightPostRes — hanya yang aktif=true, sudah
// terurut by urutan (backend). Bisa kosong kalau admin belum input (bukan bug).
export interface HighlightPost {
  id: number;
  judul: string;
  link_ig: string;
  gambar_url?: string | null;
  urutan: number;
  aktif: boolean;
}

export async function getHighlight() {
  const res = await apiClient.get<HighlightPost[]>("/donatur/highlight");
  return res.data ?? [];
}
