import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from "@gbb/ui";
import { useMyProfile } from "../hooks/useProfile";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

// Wireframe donatur §6: "Profile" bukan menu sidebar — muncul sebagai section
// read-only di bagian bawah halaman. Identitas (nama/email/kode/batch) dikelola
// admin; satu-satunya self-service di sini adalah ganti password.
export function ProfileFooter() {
  const { data: profile, isLoading } = useMyProfile();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  if (isLoading || !profile) return null;

  return (
    <Card className="mt-8 gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Profil Donatur
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 text-sm">
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
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
      </CardContent>
      <CardFooter className="px-4">
        <Button size="sm" variant="outline" onClick={() => setChangePasswordOpen(true)}>
          <KeyRound className="size-4" />
          Ganti Password
        </Button>
      </CardFooter>

      {changePasswordOpen && <ChangePasswordDialog onClose={() => setChangePasswordOpen(false)} />}
    </Card>
  );
}
