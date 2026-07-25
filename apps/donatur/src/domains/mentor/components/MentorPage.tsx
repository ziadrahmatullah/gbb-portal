import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { GraduationCap, Send } from "lucide-react";
import { Button, Input, Label } from "@gbb/ui";
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          Jadilah Mentor GBB!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
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

      <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Form Pendaftaran Mentor</h2>

        <div className="space-y-1.5">
          <Label htmlFor="mn-nama">Nama Lengkap *</Label>
          <Input
            id="mn-nama"
            value={nama}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)}
            required
            disabled={daftar.isPending}
          />
        </div>

        <div className="space-y-1.5">
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

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mn-cv">Upload CV (.pdf) *</Label>
            <Input
              id="mn-cv"
              type="file"
              accept="application/pdf"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCv(e.target.files?.[0])}
              required
              disabled={daftar.isPending}
            />
          </div>
          <div className="space-y-1.5">
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
            <Send className="h-4 w-4 mr-2" />
            {daftar.isPending ? "Mengirim…" : "Daftar Jadi Mentor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
