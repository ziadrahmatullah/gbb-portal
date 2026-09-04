import { cn } from "@/lib/utils";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const ALL = "all";

// Select batch/periode untuk toolbar halaman. SENGAJA membaca & menulis store
// global yang sama dengan "Filter Periode" di footer sidebar — bukan state
// lokal — supaya tidak ada dua filter yang saling bertentangan. Dipasang di
// toolbar karena tim tidak menemukan filter di sidebar (masukan tim program,
// Sep 2026): "Database Beswan / Kurikulum / Penugasan perlu filter batch".
export function PeriodeFilterSelect({
  onChange,
  className,
  allLabel = "Semua Batch",
}: {
  // Dipanggil setelah nilai berubah — biasanya untuk setPage(1)
  onChange?: () => void;
  className?: string;
  allLabel?: string;
}) {
  const { data, isLoading } = usePeriodeOptions();
  const periodeId = usePeriodeFilter((s) => s.periodeId);
  const setPeriodeId = usePeriodeFilter((s) => s.setPeriodeId);

  return (
    <Select
      value={periodeId ?? ALL}
      onValueChange={(v: string) => {
        setPeriodeId(v === ALL ? null : v);
        onChange?.();
      }}
      disabled={isLoading}
    >
      <SelectTrigger className={cn("w-48", className)} title="Sama dengan Filter Periode di sidebar">
        <SelectValue placeholder={isLoading ? "Memuat…" : allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {data?.items.map((p) => (
          <SelectItem key={p.id} value={String(p.id)}>
            {p.nama}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
