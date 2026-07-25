import { apiClient } from "@/shared/lib/apiClient";

export async function getMentorStats() {
  // Handler StatsDonatur balikin gin.H{"mentor_aktif": n} langsung di `data`
  const res = await apiClient.get<{ mentor_aktif: number }>("/donatur/mentor/stats");
  return res.data;
}

export interface DaftarMentorInput {
  nama: string;
  bidang_keahlian: string;
  cv?: File; // wireframe: wajib; backend sebenarnya optional — tetap required di FE
  linkedin_url?: string;
}

// 201, TIDAK ada data balik (bukan objek mentor) — tidak ada riwayat status
// pendaftaran untuk donatur, submit-only sesuai wireframe.
export async function daftarMentor(input: DaftarMentorInput) {
  const fd = new FormData();
  fd.append("nama", input.nama);
  fd.append("bidang_keahlian", input.bidang_keahlian);
  if (input.cv) fd.append("cv", input.cv);
  if (input.linkedin_url) fd.append("linkedin_url", input.linkedin_url);
  const res = await apiClient.post("/donatur/mentor/daftar", fd);
  return res.message;
}
