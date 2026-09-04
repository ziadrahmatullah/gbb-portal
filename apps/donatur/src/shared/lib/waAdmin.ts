import type { DonaturProfile } from "@/domains/auth/store/useAuthStore";

// Nomor WA Admin GBB ("Minbe") untuk tombol Hubungi Admin — dari deck masukan
// tim (Sep 2026): +62 819-9171-0763. Bisa dioverride lewat env supaya ganti
// nomor tidak butuh perubahan kode.
export const WA_ADMIN: string = import.meta.env.VITE_WA_ADMIN || "6281991710763";

// Pesan pre-filled. Nama + kode donatur disertakan supaya AnC langsung tahu
// siapa yang menghubungi tanpa harus bertanya balik.
export function waAdminText(profile: DonaturProfile | null | undefined, maksud?: string) {
  const identitas = profile
    ? ` (${profile.nama}${profile.kode_donatur ? ` · ${profile.kode_donatur}` : ""})`
    : "";
  const isi = maksud ?? "ingin bertanya mengenai akun donatur saya";
  return `Halo Minbe, saya ${isi}${identitas}`;
}
