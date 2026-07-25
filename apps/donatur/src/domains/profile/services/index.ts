import { apiClient } from "@/shared/lib/apiClient";

// Mirror gbb-backend dto/donatur_dto.go DonaturProfileRes (GET /donatur/profile)
export interface DonaturProfile {
  nama: string;
  email: string;
  kode_donatur: string;
  batch: string[];
}

export async function getMyProfile() {
  const res = await apiClient.get<DonaturProfile>("/donatur/profile");
  return res.data;
}
