import { apiClient } from "@/shared/lib/apiClient";

export async function getMentorStats() {
  // Handler StatsDonatur balikin gin.H{"mentor_aktif": n} langsung di `data`
  const res = await apiClient.get<{ mentor_aktif: number }>("/donatur/mentor/stats");
  return res.data;
}

// Mirror kontrak balasan BE FEpromt25 §2 — satu baris mentor_pendaftaran
// milik donatur yang login. Status `ditolak` tidak pernah dikembalikan.
export type PendaftaranStatus = "menunggu" | "perlu_info" | "terdaftar";

export interface MentorPendaftaran {
  id: number;
  status: PendaftaranStatus;
  nama: string;
  bidang_keahlian: string;
  cv_url?: string | null;
  linkedin_url?: string | null;
  is_internal: boolean;
  catatan?: string | null; // alasan "perlu info" dari verifikator
  created_at: string;
  updated_at: string;
  kontak_admin_wa: string; // dari config BE, mis. "6281991710763"
}

// 200 dengan data null = belum pernah submit (sengaja bukan 404 — interceptor
// men-toast semua non-2xx).
export async function getMyPendaftaran() {
  const res = await apiClient.get<MentorPendaftaran | null>("/donatur/mentor/pendaftaran");
  return res.data ?? null;
}

export interface DaftarMentorInput {
  nama: string;
  bidang_keahlian: string;
  cv?: File; // wajib saat daftar pertama; saat kirim ulang CV lama dipertahankan bila kosong
  linkedin_url?: string;
  is_internal?: boolean; // deklarasi alumni UNDIP
}

// 201 { data: objek pendaftaran }. Upsert di BE: submit ulang saat status
// menunggu/perlu_info memperbarui baris yang sama (catatan verifikator dikosongkan).
export async function daftarMentor(input: DaftarMentorInput) {
  const fd = new FormData();
  fd.append("nama", input.nama);
  fd.append("bidang_keahlian", input.bidang_keahlian);
  if (input.cv) fd.append("cv", input.cv);
  if (input.linkedin_url) fd.append("linkedin_url", input.linkedin_url);
  fd.append("is_internal", String(!!input.is_internal));
  const res = await apiClient.post<MentorPendaftaran>("/donatur/mentor/daftar", fd);
  return res.data;
}
