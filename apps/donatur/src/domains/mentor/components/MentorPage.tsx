import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { GraduationCap, Send } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, FileDropzone, Input, Label } from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { useDaftarMentor, useMentorStats } from "../hooks/useMentor";

export function MentorPage() {
  const { data: stats, isLoading: statsLoading } = useMentorStats();
  const daftar = useDaftarMentor();

  const [nama, setNama] = useState("");
  const [bidang, setBidang] = useState("");
  const [cv, setCv] = useState<File | undefined>();
  const [linkedin, setLinkedin] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    daftar.mutate(
      { nama, bidang_keahlian: bidang, cv, linkedin_url: linkedin || undefined },
      {
        onSuccess: () => {
          setNama("");
          setBidang("");
          setCv(undefined);
          setLinkedin("");
          (e.target as HTMLFormElement).reset();
        },
      }
    );
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Form Pendaftaran Mentor</CardTitle>
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
                <Label htmlFor="mn-cv">Upload CV (.pdf) *</Label>
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

            <div className="flex justify-end">
              <Button type="submit" disabled={daftar.isPending || !nama.trim() || !bidang.trim() || !cv}>
                <Send className="size-4" />
                {daftar.isPending ? "Mengirim…" : "Daftar Jadi Mentor"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
