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

export async function changeMyPassword(oldPassword: string, newPassword: string) {
  const res = await apiClient.put("/donatur/account/change-password", {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return res.message;
}
