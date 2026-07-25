import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FileText, GraduationCap, Save, UserRound } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gbb/ui";
import { assetUrl } from "@/domains/beranda/services";
import { useMyDashboard } from "@/domains/beranda/hooks/useBeranda";
import { useMyIPK, useMyProfile, useUpdateProfile, useUpsertIPK } from "../hooks/useProfile";
import type { MyIPK } from "../services";

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <Input value={value ?? ""} readOnly disabled className="bg-muted/50" />
    </div>
  );
}

function IPKDialog({
  periodes,
  existing,
  presetPeriodeId,
  onClose,
}: {
  periodes: { periode_id: number; periode_nama: string }[];
  existing: MyIPK | null;
  presetPeriodeId?: number;
  onClose: () => void;
}) {
  const upsert = useUpsertIPK();
  const [periodeId, setPeriodeId] = useState(
    existing ? String(existing.periode_id) : presetPeriodeId ? String(presetPeriodeId) : ""
  );
  const [ipSemester, setIpSemester] = useState(
    existing?.ip_semester != null ? String(existing.ip_semester) : ""
  );
  const [ipk, setIpk] = useState(existing ? String(existing.ipk) : "");
  const [transkrip, setTranskrip] = useState<File | undefined>();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    upsert.mutate(
      {
        periode_id: Number(periodeId),
        ipk: Number(ipk),
        ip_semester: ipSemester !== "" ? Number(ipSemester) : undefined,
        transkrip,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Update Data Akademik" : "Isi Data Akademik"}</DialogTitle>
          <DialogDescription>
            Satu entri per periode — mengisi ulang periode yang sama akan menimpa data lama.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Periode *</Label>
            {/* Pilihan dibatasi periode yang diikuti beswan (dari dashboard), bukan dropdown bebas */}
            <Select value={periodeId} onValueChange={setPeriodeId} disabled={!!existing}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih periode…" />
              </SelectTrigger>
              <SelectContent>
                {periodes.map((p) => (
                  <SelectItem key={p.periode_id} value={String(p.periode_id)}>
                    {p.periode_nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ipk-ips">IP Semester</Label>
              <Input
                id="ipk-ips"
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={ipSemester}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIpSemester(e.target.value)}
                placeholder="opsional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ipk-ipk">IPK Kumulatif *</Label>
              <Input
                id="ipk-ipk"
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={ipk}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIpk(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ipk-transkrip">Transkrip (PDF)</Label>
            <Input
              id="ipk-transkrip"
              type="file"
              accept="application/pdf"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTranskrip(e.target.files?.[0])}
            />
            {existing?.transkip_url && !transkrip && (
              <p className="text-xs text-muted-foreground">
                Sudah ada transkrip — upload baru akan menggantikannya.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={upsert.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={upsert.isPending || !periodeId || ipk === ""}>
              {upsert.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { data: dashboard } = useMyDashboard();
  const { data: ipkList = [], isLoading: ipkLoading } = useMyIPK();
  const update = useUpdateProfile();

  const [hp, setHp] = useState<string | null>(null); // null = belum diedit, pakai nilai server
  const [foto, setFoto] = useState<File | undefined>();
  const [cv, setCv] = useState<File | undefined>();
  const [ipkDialog, setIpkDialog] = useState<{
    existing: MyIPK | null;
    presetPeriodeId?: number;
  } | null>(null);

  const periodes = useMemo(() => dashboard?.periodes ?? [], [dashboard]);
  const periodeNama = (id: number) =>
    periodes.find((p) => p.periode_id === id)?.periode_nama ?? `Periode #${id}`;

  // Banner client-side: periode AKTIF yang belum punya entri IPK
  const missingActive = periodes.filter(
    (p) => p.status === "aktif" && !ipkList.some((r) => r.periode_id === p.periode_id)
  );

  const hpValue = hp ?? profile?.hp ?? "";
  const dirty = hp !== null || foto !== undefined || cv !== undefined;

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    update.mutate(
      { hp: hpValue, foto, cv },
      {
        onSuccess: () => {
          setHp(null);
          setFoto(undefined);
          setCv(undefined);
        },
      }
    );
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <UserRound className="h-6 w-6 text-primary" />
        Profile
      </h1>

      {/* ── Identitas ── */}
      <form onSubmit={handleSave} className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-4">
          {profile?.foto_url ? (
            <img
              src={assetUrl(profile.foto_url)}
              alt="Foto profil"
              className="h-16 w-16 rounded-full object-cover border"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold">
              {profile?.nama_lengkap?.[0] ?? "?"}
            </div>
          )}
          <div>
            <div className="font-semibold">{profile?.nama_lengkap}</div>
            <div className="text-sm text-muted-foreground">
              {profile?.batch ? `Batch ${profile.batch}` : profile?.status ?? ""}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <ReadOnlyField label="Nama Lengkap" value={profile?.nama_lengkap} />
          <ReadOnlyField label="NIM" value={profile?.nim} />
          <ReadOnlyField label="Email" value={profile?.email} />
          <div className="space-y-1.5">
            <Label htmlFor="pf-hp">No. HP *</Label>
            <Input
              id="pf-hp"
              value={hpValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setHp(e.target.value)}
              required
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Nama, NIM, dan email hanya bisa diubah oleh Tim Program GBB.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pf-foto">Foto Profil</Label>
            <Input
              id="pf-foto"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFoto(e.target.files?.[0])}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-cv">CV (PDF)</Label>
            <Input
              id="pf-cv"
              type="file"
              accept="application/pdf"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCv(e.target.files?.[0])}
            />
            {profile?.cv_url && (
              <a
                href={assetUrl(profile.cv_url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                Lihat CV saat ini
              </a>
            )}
          </div>
        </div>

        <Button type="submit" disabled={update.isPending || !dirty || !hpValue.trim()}>
          <Save className="h-4 w-4 mr-2" />
          {update.isPending ? "Menyimpan…" : "Simpan Perubahan"}
        </Button>
      </form>

      {/* ── Akademik ── */}
      <section className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Data Akademik (IPK)
          </h2>
          <Button size="sm" onClick={() => setIpkDialog({ existing: null })}>
            Isi / Update IPK
          </Button>
        </div>

        {missingActive.map((p) => (
          <div
            key={p.periode_id}
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
          >
            🎓 Kamu belum mengisi IPK untuk periode aktif {p.periode_nama}.{" "}
            <button
              type="button"
              className="underline font-medium"
              onClick={() => setIpkDialog({ existing: null, presetPeriodeId: p.periode_id })}
            >
              Isi sekarang
            </button>
          </div>
        ))}

        {ipkLoading ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        ) : ipkList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Belum ada data IPK</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Periode</th>
                  <th className="py-2 pr-3 font-medium">IP Semester</th>
                  <th className="py-2 pr-3 font-medium">IPK Kumulatif</th>
                  <th className="py-2 pr-3 font-medium">Transkrip</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {ipkList.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{periodeNama(row.periode_id)}</td>
                    <td className="py-2 pr-3">{row.ip_semester ?? "—"}</td>
                    <td className="py-2 pr-3 font-medium">{row.ipk}</td>
                    <td className="py-2 pr-3">
                      {row.transkip_url ? (
                        <a
                          href={assetUrl(row.transkip_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Lihat
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIpkDialog({ existing: row })}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ipkDialog && (
        <IPKDialog
          periodes={periodes}
          existing={ipkDialog.existing}
          presetPeriodeId={ipkDialog.presetPeriodeId}
          onClose={() => setIpkDialog(null)}
        />
      )}
    </div>
  );
}
