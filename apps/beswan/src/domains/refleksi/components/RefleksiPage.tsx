import { useMemo, useState } from "react";
import { NotebookPen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
} from "@gbb/ui";
import { useMyDashboard } from "@/domains/beranda/hooks/useBeranda";
import { usePertanyaan, useRefleksi } from "../hooks/useRefleksi";
import { RefleksiForm } from "./RefleksiForm";
import { PrestasiSection } from "./PrestasiSection";

const BULAN_LABEL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function RefleksiPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const { data: dashboard } = useMyDashboard();
  // Periode aktif dari dashboard; fallback periode terakhir yang diikuti
  const periodes = useMemo(() => dashboard?.periodes ?? [], [dashboard]);
  const defaultPeriode = periodes.find((p) => p.status === "aktif") ?? periodes[periodes.length - 1];
  const [periodeId, setPeriodeId] = useState<number | undefined>();
  const activePeriodeId = periodeId ?? defaultPeriode?.periode_id;

  const { data: pertanyaan, isLoading: qLoading } = usePertanyaan();
  const {
    data: refleksi,
    isLoading: rLoading,
    isFetched,
  } = useRefleksi(activePeriodeId, bulan, tahun);

  const tahunOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const loading = qLoading || rLoading || !activePeriodeId;

  // Banner client-side: bulan terpilih belum submitted (tidak ada endpoint reminder server)
  const showBanner = isFetched && refleksi?.status !== "submitted";

  return (
    <div className="space-y-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <NotebookPen className="size-6 text-primary" />
          Refleksi Bulanan
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {periodes.length > 1 && (
            <Select
              value={activePeriodeId ? String(activePeriodeId) : ""}
              onValueChange={(v: string) => setPeriodeId(Number(v))}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodes.map((p) => (
                  <SelectItem key={p.periode_id} value={String(p.periode_id)}>
                    {p.periode_nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={String(bulan)} onValueChange={(v: string) => setBulan(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BULAN_LABEL.map((label, i) => (
                <SelectItem key={label} value={String(i + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(tahun)} onValueChange={(v: string) => setTahun(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tahunOptions.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showBanner && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          📝 Kamu belum mengisi refleksi bulan {BULAN_LABEL[bulan - 1]} {tahun}
          {refleksi?.status === "draft" ? " — draft tersimpan, jangan lupa submit!" : "."}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <RefleksiForm
          // Remount saat periode/bulan/tahun ganti agar state prefill segar
          key={`${activePeriodeId}-${bulan}-${tahun}-${refleksi?.id ?? "new"}`}
          pertanyaan={pertanyaan ?? []}
          existing={refleksi ?? null}
          periodeId={activePeriodeId!}
          bulan={bulan}
          tahun={tahun}
        />
      )}

      <Separator />

      <PrestasiSection />
    </div>
  );
}
