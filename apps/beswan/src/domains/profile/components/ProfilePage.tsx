import { useMemo, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import {
  CalendarSync,
  Check,
  Copy,
  FileText,
  GraduationCap,
  KeyRound,
  Save,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FileDropzone,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gbb/ui";
import { assetUrl } from "@/domains/beranda/services";
import { useMyDashboard } from "@/domains/beranda/hooks/useBeranda";
import {
  useCreateCalendarFeed,
  useMyIPK,
  useMyProfile,
  useUpdateProfile,
  useUpsertIPK,
} from "../hooks/useProfile";
import type { MyIPK } from "../services";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-2">
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
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
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
            <div className="grid gap-2">
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
          <div className="grid gap-2">
            <Label htmlFor="ipk-transkrip">Transkrip (PDF)</Label>
            <FileDropzone
              id="ipk-transkrip"
              accept="application/pdf"
              value={transkrip}
              onChange={(f: File | null) => setTranskrip(f ?? undefined)}
            />
            {existing?.transkip_url && !transkrip && (
              <p className="text-xs text-muted-foreground">
                Sudah ada transkrip — upload baru akan menggantikannya.
              </p>
            )}
          </div>
          <DialogFooter>
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

// Halaman "Tambahkan dari URL" di Google Calendar
const GCAL_ADD_BY_URL = "https://calendar.google.com/calendar/u/0/r/settings/addbyurl";

// Langganan kalender ICS (masukan PCM Sep 2026, FEpromt29 §3): sekali tempel
// di Google Calendar, event & deadline penugasan masuk otomatis. URL hanya
// tampil SEKALI setelah dibuat — backend menyimpan hash token saja, dan
// membuat ulang mematikan tautan lama. `aktif` = kalender_aktif dari profil
// (FEpromt30): beswan sudah pernah membuat tautan.
function CalendarSyncCard({ aktif }: { aktif: boolean }) {
  const create = useCreateCalendarFeed();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = () =>
    create.mutate(undefined, {
      onSuccess: (u) => {
        setUrl(u);
        setCopied(false);
      },
    });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      toast.error("Gagal menyalin — salin manual dari kotak tautan");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CalendarSync className="size-5 text-primary" />
          Sinkron ke Google Calendar
        </CardTitle>
        <CardDescription>
          Tempel tautan langganan ini sekali di Google Calendar, maka jadwal event dan deadline
          penugasanmu masuk otomatis sebagai pengingat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {url ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Input
                readOnly
                value={url}
                onFocus={(e: FocusEvent<HTMLInputElement>) => e.currentTarget.select()}
                className="min-w-0 flex-1 font-mono text-xs"
                aria-label="Tautan langganan kalender"
              />
              <Button type="button" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                Buka{" "}
                <a
                  href={GCAL_ADD_BY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Calendar › Tambahkan dari URL
                </a>
                .
              </li>
              <li>
                Tempel tautan di atas, lalu klik{" "}
                <span className="font-medium text-foreground">Tambahkan kalender</span>.
              </li>
              <li>Selesai — Google memperbarui kalender ini sendiri tiap ±12–24 jam.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Tautan ini hanya ditampilkan sekali. Membuat tautan baru mematikan tautan lama.
            </p>
          </>
        ) : aktif ? (
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Langganan aktif
            </Badge>
            <span>
              Tautan langganan sudah pernah dibuat. Membuat tautan baru mematikan yang lama —
              perbarui langganan di Google Calendar-mu setelahnya.
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Tautan bersifat pribadi (berisi token akunmu) dan hanya ditampilkan sekali saat
            dibuat — simpan di tempat aman.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          variant={url || aktif ? "outline" : "default"}
          onClick={handleCreate}
          disabled={create.isPending}
        >
          <CalendarSync className="size-4" />
          {create.isPending
            ? "Membuat…"
            : url || aktif
              ? "Buat tautan baru"
              : "Buat tautan langganan"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { data: dashboard } = useMyDashboard();
  const { data: ipkList = [], isLoading: ipkLoading } = useMyIPK();
  const update = useUpdateProfile();

  const [hp, setHp] = useState<string | null>(null); // null = belum diedit, pakai nilai server
  const [jurusan, setJurusan] = useState<string | null>(null);
  const [tahunMasuk, setTahunMasuk] = useState<string | null>(null);
  const [emailPemulihan, setEmailPemulihan] = useState<string | null>(null);
  const [pwdOpen, setPwdOpen] = useState(false);
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
  const jurusanValue = jurusan ?? profile?.jurusan ?? "";
  const tahunValue = tahunMasuk ?? (profile?.tahun_masuk ? String(profile.tahun_masuk) : "");
  // Field email pemulihan tampil hanya bila backend sudah mengirim key-nya
  // (FEpromt29) — sebelum itu input akan tersimpan ke mana-mana, jadi disembunyikan
  const emailPemulihanSupported = !!profile && "email_pemulihan" in profile;
  const emailPemulihanValue = emailPemulihan ?? profile?.email_pemulihan ?? "";
  const dirty =
    hp !== null ||
    jurusan !== null ||
    tahunMasuk !== null ||
    emailPemulihan !== null ||
    foto !== undefined ||
    cv !== undefined;

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    update.mutate(
      {
        hp: hpValue,
        // Kirim hanya yang disentuh; tahun kosong → 0 = dikosongkan di BE
        jurusan: jurusan ?? undefined,
        tahun_masuk: tahunMasuk !== null ? (tahunMasuk ? Number(tahunMasuk) : 0) : undefined,
        email_pemulihan: emailPemulihan ?? undefined,
        foto,
        cv,
      },
      {
        onSuccess: () => {
          setHp(null);
          setJurusan(null);
          setTahunMasuk(null);
          setEmailPemulihan(null);
          setFoto(undefined);
          setCv(undefined);
        },
      }
    );
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full max-w-3xl rounded-xl" />;
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="mb-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <UserRound className="size-6 text-primary" />
          Profile
        </h1>
      </div>

      {/* ── Identitas ── */}
      <form onSubmit={handleSave}>
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border">
                {profile?.foto_url && <AvatarImage src={assetUrl(profile.foto_url)} alt="Foto profil" />}
                <AvatarFallback className="text-xl font-semibold">
                  {profile?.nama_lengkap?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{profile?.nama_lengkap}</div>
                <div className="text-sm text-muted-foreground">
                  {profile?.batch ? `Batch ${profile.batch}` : profile?.status ?? ""}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Nama Lengkap" value={profile?.nama_lengkap} />
              <ReadOnlyField label="NIM" value={profile?.nim} />
              <ReadOnlyField label="Email" value={profile?.email} />
              <div className="grid gap-2">
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

            {/* Email pemulihan/alternatif (masukan PCM Sep 2026) — untuk
                memulihkan akun & salinan notifikasi bila email utama bermasalah */}
            {emailPemulihanSupported && (
              <div className="grid gap-2">
                <Label htmlFor="pf-email-pemulihan">Email Pemulihan / Alternatif</Label>
                <Input
                  id="pf-email-pemulihan"
                  type="email"
                  value={emailPemulihanValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmailPemulihan(e.target.value)}
                  placeholder="email pribadi, mis. kamu@gmail.com"
                  className="sm:max-w-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Dipakai untuk memulihkan akun dan menerima salinan notifikasi bila email
                  utama (kampus) bermasalah.
                </p>
              </div>
            )}

            {/* Profil akademik — dipakai Tim Program untuk membaca analitik per
                jurusan & tingkat. Isi tahun masuk; semester dihitung otomatis. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="pf-jurusan">Jurusan / Program Studi</Label>
                <Input
                  id="pf-jurusan"
                  value={jurusanValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setJurusan(e.target.value)}
                  placeholder="mis. Teknik Informatika"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf-tahun">
                  Tahun Masuk Kuliah
                  {profile?.semester ? (
                    <span className="ml-1 font-normal text-muted-foreground">
                      (sekarang semester {profile.semester})
                    </span>
                  ) : null}
                </Label>
                <Input
                  id="pf-tahun"
                  type="number"
                  min={2000}
                  max={new Date().getFullYear() + 1}
                  value={tahunValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTahunMasuk(e.target.value)}
                  placeholder="2022"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="pf-foto">Foto Profil</Label>
                <FileDropzone
                  id="pf-foto"
                  accept="image/jpeg,image/png"
                  value={foto}
                  onChange={(f: File | null) => setFoto(f ?? undefined)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf-cv">CV (PDF)</Label>
                <FileDropzone
                  id="pf-cv"
                  accept="application/pdf"
                  value={cv}
                  onChange={(f: File | null) => setCv(f ?? undefined)}
                />
                {profile?.cv_url && (
                  <a
                    href={assetUrl(profile.cv_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <FileText className="size-3" />
                    Lihat CV saat ini
                  </a>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <Button type="submit" disabled={update.isPending || !dirty || !hpValue.trim()}>
              <Save className="size-4" />
              {update.isPending ? "Menyimpan…" : "Simpan Perubahan"}
            </Button>
            {/* Ganti password juga dari halaman Profile (masukan PCM Sep 2026),
                selain dari dropdown user di topbar */}
            <Button type="button" variant="outline" onClick={() => setPwdOpen(true)}>
              <KeyRound className="size-4" />
              Ganti Password
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* ── Akademik ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <GraduationCap className="size-5 text-primary" />
            Data Akademik (IPK)
          </CardTitle>
          <CardAction>
            <Button size="sm" onClick={() => setIpkDialog({ existing: null })}>
              Isi / Update IPK
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingActive.map((p) => (
            <div
              key={p.periode_id}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
              🎓 Kamu belum mengisi IPK untuk periode aktif {p.periode_nama}.{" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => setIpkDialog({ existing: null, presetPeriodeId: p.periode_id })}
              >
                Isi sekarang
              </button>
            </div>
          ))}

          {ipkLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : ipkList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <GraduationCap className="size-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">Belum ada data IPK</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>IP Semester</TableHead>
                    <TableHead>IPK Kumulatif</TableHead>
                    <TableHead>Transkrip</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipkList.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{periodeNama(row.periode_id)}</TableCell>
                      <TableCell>{row.ip_semester ?? "—"}</TableCell>
                      <TableCell className="font-medium">{row.ipk}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIpkDialog({ existing: row })}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Sinkron kalender (masukan PCM Sep 2026) ── */}
      <CalendarSyncCard aktif={!!profile?.kalender_aktif} />

      {pwdOpen && <ChangePasswordDialog onClose={() => setPwdOpen(false)} />}

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
