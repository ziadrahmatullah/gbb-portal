import { useState } from "react";
import { KeyRound } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Skeleton,
} from "@gbb/ui";
import { useMyProfile } from "../hooks/useProfile";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

function initials(name: string | null | undefined): string {
  return (
    (name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "D"
  );
}

// Halaman Profile donatur — identitas (nama/email/kode/batch) dikelola admin;
// satu-satunya self-service di sini adalah ganti password.
export function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Data akun donatur — hubungi admin untuk perubahan identitas.</p>
      </div>

      {isLoading || !profile ? (
        <Skeleton className="h-48 w-full max-w-xl rounded-xl" />
      ) : (
        <Card className="max-w-xl py-4">
          <CardContent className="px-4">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {initials(profile.nama)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-48 flex-1 space-y-1">
                <h2 className="text-lg font-semibold">{profile.nama}</h2>
                <div className="text-sm text-muted-foreground">{profile.email}</div>
                <div className="text-sm text-muted-foreground">
                  Kode Donatur: <span className="font-mono font-medium text-foreground">{profile.kode_donatur}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {profile.batch.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Belum terdaftar batch</span>
                  ) : (
                    profile.batch.map((b) => (
                      <Badge key={b} variant="outline" className="font-normal">
                        {b}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-4">
            <Button size="sm" variant="outline" onClick={() => setChangePasswordOpen(true)}>
              <KeyRound className="size-4" />
              Ganti Password
            </Button>
          </CardFooter>
        </Card>
      )}

      {changePasswordOpen && <ChangePasswordDialog onClose={() => setChangePasswordOpen(false)} />}
    </div>
  );
}
