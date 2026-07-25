import { CircleUserRound } from "lucide-react";
import { useMyProfile } from "../hooks/useProfile";

// Wireframe donatur §6: "Profile" bukan menu sidebar — muncul sebagai section
// read-only di bagian bawah halaman. Read-only penuh, tidak ada endpoint edit
// (identitas donatur dikelola lewat Google + admin, bukan self-service).
export function ProfileFooter() {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading || !profile) return null;

  return (
    <section className="mt-8 rounded-xl border bg-card p-5 space-y-2 text-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Profil Donatur
      </h2>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
        <div>
          <span className="text-muted-foreground">Nama: </span>
          <span className="font-medium">{profile.nama}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Email: </span>
          <span className="font-medium">{profile.email}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Kode Donatur: </span>
          <span className="font-medium">{profile.kode_donatur}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Batch: </span>
          <span className="font-medium">{profile.batch.join(", ") || "—"}</span>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
        <CircleUserRound className="h-3.5 w-3.5" />
        Login via Google (tanpa password) — dikelola di akun Google
      </p>
    </section>
  );
}
