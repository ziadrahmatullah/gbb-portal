import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { CheckCircle2, Clock, FileText, GraduationCap, MessageCircle, Send } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FileDropzone,
  Input,
  Label,
  Skeleton,
  Switch,
  cn,
  waLink,
} from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { waAdminText } from "@/shared/lib/waAdmin";
import { useDaftarMentor, useMentorStats, useMyPendaftaran } from "../hooks/useMentor";
import type { MentorPendaftaran } from "../services";

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

// Kartu status pendaftaran — mock deck slide 21. Dulu setelah submit hanya ada
// toast sebentar lalu form kosong lagi "seperti tidak terjadi apa-apa".
function StatusCard({ p }: { p: MentorPendaftaran }) {
  const profile = useAuthStore((s) => s.profile);
  const tone =
    p.status === "terdaftar"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : p.status === "perlu_info"
        ? "border-orange-500/40 bg-orange-500/5"
        : "border-border";
  const badge =
    p.status === "terdaftar" ? (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Terdaftar</Badge>
    ) : p.status === "perlu_info" ? (
      <Badge className="bg-orange-500 text-white hover:bg-orange-500">Perlu info tambahan</Badge>
    ) : (
      <Badge variant="outline">Belum verifikasi</Badge>
    );

  return (
    <Card className={cn("py-4", tone)}>
      <CardContent className="space-y-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold">
            {p.status === "terdaftar" ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <Clock className="size-4 text-muted-foreground" />
            )}
            Status pendaftaran mentor
          </div>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">
          {p.status === "terdaftar" && (
            <>
              Kamu resmi terdaftar sebagai mentor GBB. Kami membuka tema mentoring baru di setiap
              awal batch — kamu akan dihubungi kalau ada yang sesuai keahlianmu (
              <strong>{p.bidang_keahlian}</strong>).
            </>
          )}
          {p.status === "menunggu" && (
            <>
              Tim GBB sedang meninjau data kamu (dikirim {formatTanggal(p.updated_at)}). Kamu akan
              dihubungi dalam 3–5 hari kerja.
            </>
          )}
          {p.status === "perlu_info" && (
            <>
              Ada yang perlu dilengkapi sebelum bisa kami proses
              {p.catatan ? (
                <>
                  : <strong className="text-foreground">“{p.catatan}”</strong>
                </>
              ) : (
                "."
              )}{" "}
              Perbaiki lewat form di bawah lalu kirim ulang.
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {p.cv_url && (
            <a href={p.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              <FileText className="size-3.5" /> CV yang kamu kirim
            </a>
          )}
          {p.status !== "terdaftar" && (
            <a
              href={waLink(p.kontak_admin_wa, waAdminText(profile, "ingin bertanya soal pendaftaran mentor saya"))}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <MessageCircle className="size-3.5" /> Hubungi admin
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DaftarForm({ existing }: { existing: MentorPendaftaran | null }) {
  const daftar = useDaftarMentor();
  const resubmit = !!existing; // kirim ulang setelah "perlu info" — prefilled

  const [nama, setNama] = useState(existing?.nama ?? "");
  const [bidang, setBidang] = useState(existing?.bidang_keahlian ?? "");
  const [cv, setCv] = useState<File | undefined>();
  const [linkedin, setLinkedin] = useState(existing?.linkedin_url ?? "");
  const [isInternal, setIsInternal] = useState(existing?.is_internal ?? false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    daftar.mutate({
      nama,
      bidang_keahlian: bidang,
      cv,
      linkedin_url: linkedin || undefined,
      is_internal: isInternal,
    });
  };

  // CV wajib saat pertama daftar; saat kirim ulang boleh kosong (CV lama dipakai BE)
  const cvOk = resubmit ? true : !!cv;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{resubmit ? "Perbaiki & Kirim Ulang" : "Form Pendaftaran Mentor"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mn-nama">Nama Lengkap *</Label>
            <Input
              id="mn-nama"
              value={nama}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)}
              required
              disabled={daftar.isPending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mn-bidang">Bidang Keahlian *</Label>
            <Input
              id="mn-bidang"
              value={bidang}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setBidang(e.target.value)}
              placeholder="mis. Software Engineering, Human Resources"
              required
              disabled={daftar.isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mn-cv">
                Upload CV (.pdf) {resubmit ? "(kosongkan bila tidak diganti)" : "*"}
              </Label>
              <FileDropzone
                id="mn-cv"
                accept="application/pdf"
                value={cv}
                onChange={(f: File | null) => setCv(f ?? undefined)}
                disabled={daftar.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mn-linkedin">LinkedIn URL</Label>
              <Input
                id="mn-linkedin"
                type="url"
                value={linkedin}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                disabled={daftar.isPending}
              />
            </div>
          </div>

          {/* Masukan tim: tim internal tidak tahu pendaftar alumni UNDIP atau bukan —
              minta deklarasi dari pendaftar sendiri (verifikator tetap bisa koreksi) */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Switch checked={isInternal} onCheckedChange={setIsInternal} disabled={daftar.isPending} />
            Saya alumni UNDIP
          </label>

          <div className="flex justify-end">
            <Button type="submit" disabled={daftar.isPending || !nama.trim() || !bidang.trim() || !cvOk}>
              <Send className="size-4" />
              {daftar.isPending ? "Mengirim…" : resubmit ? "Kirim Ulang" : "Daftar Jadi Mentor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function MentorPage() {
  const { data: stats, isLoading: statsLoading } = useMentorStats();
  const { data: pendaftaran, isLoading } = useMyPendaftaran();

  // null → form; menunggu/terdaftar → kartu saja; perlu_info → kartu + form prefilled
  const showForm = !isLoading && (!pendaftaran || pendaftaran.status === "perlu_info");

  return (
    <div className="max-w-2xl space-y-4">
      <div className="mb-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <GraduationCap className="size-6 text-primary" />
          Jadilah Mentor GBB!
        </h1>
        <p className="text-muted-foreground">
          Kami membutuhkan mentor untuk agenda Growth &amp; mentoring beswan. Ada
          merchandise menarik untuk mentor terdaftar! 🎁
        </p>
      </div>

      <div className="max-w-xs">
        <StatCard
          icon={GraduationCap}
          label="Mentor Aktif"
          value={String(stats?.mentor_aktif ?? "—")}
          loading={statsLoading}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : (
        pendaftaran && <StatusCard p={pendaftaran} />
      )}

      {showForm && <DaftarForm key={pendaftaran?.updated_at ?? "new"} existing={pendaftaran ?? null} />}
    </div>
  );
}
