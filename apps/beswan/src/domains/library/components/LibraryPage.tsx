import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BookOpen, FileDown, Mic, PlayCircle, Search, Send, Sparkles, Tag, Upload } from "lucide-react";
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
  Textarea,
} from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { useLibraryList, useLibraryStats, useUsulTopik } from "../hooks/useLibrary";
import { splitTags } from "../services";
import type { LibraryItem } from "../services";

const ALL_TAG = "all";

function UsulTopikDialog({ onClose }: { onClose: () => void }) {
  const mutation = useUsulTopik();
  const [topik, setTopik] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(topik, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Usul Topik Materi</DialogTitle>
          <DialogDescription>
            Topik yang kamu usulkan akan ditinjau tim GBB untuk materi/event berikutnya.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ut-topik">Topik yang ingin dipelajari</Label>
            <Textarea
              id="ut-topik"
              rows={3}
              value={topik}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTopik(e.target.value)}
              placeholder="contoh: Data Analysis, Design Thinking, dll"
              required
              disabled={mutation.isPending}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending || !topik.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Mengirim…" : "Kirim Usulan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LibraryCard({ item }: { item: LibraryItem }) {
  const TipeIcon = item.tipe === "event_materi" ? Mic : Upload;
  const tags = splitTags(item.tags);
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="rounded-lg bg-primary/10 p-2 shrink-0">
          <TipeIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate" title={item.nama}>
            {item.nama}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.tipe === "event_materi" ? "Materi event" : "Upload PCM"}
          </div>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      )}
      {item.deskripsi && <p className="text-sm text-muted-foreground line-clamp-2">{item.deskripsi}</p>}
      <div className="flex items-start gap-1.5 text-xs">
        <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
        {item.ai_summary ? (
          <span className="italic line-clamp-2">“{item.ai_summary}”</span>
        ) : (
          <span className="text-muted-foreground">Belum ada ringkasan AI</span>
        )}
      </div>
      <div className="flex items-center gap-4 mt-auto">
        <a
          href={item.file_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <FileDown className="h-4 w-4" />
          Download
        </a>
        {item.youtube_url && (
          <a
            href={item.youtube_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <PlayCircle className="h-4 w-4" />
            YouTube
          </a>
        )}
      </div>
    </div>
  );
}

export function LibraryPage() {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState(ALL_TAG);
  const [usulOpen, setUsulOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useLibraryStats();
  const { data, isLoading } = useLibraryList({ search: search || undefined });

  const items = useMemo(() => data?.items ?? [], [data]);
  // Daftar tag unik diturunkan dari data ter-load (tidak ada endpoint daftar-tag)
  const tagOptions = useMemo(
    () => [...new Set(items.flatMap((i) => splitTags(i.tags)))].sort(),
    [items]
  );
  const visible = tag === ALL_TAG ? items : items.filter((i) => splitTags(i.tags).includes(tag));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Library Materi</h1>
        <Button size="sm" onClick={() => setUsulOpen(true)}>
          <Send className="h-4 w-4 mr-2" />
          Usul Topik
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <StatCard icon={BookOpen} label="Total Materi" value={String(stats?.total_materi ?? "—")} loading={statsLoading} />
        <StatCard icon={Tag} label="Topik Tag" value={String(stats?.total_tag ?? "—")} loading={statsLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari materi…"
            className="pl-9 w-64"
          />
        </div>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TAG}>Semua Tag</SelectItem>
            {tagOptions.map((t) => (
              <SelectItem key={t} value={t}>
                #{t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Tidak ada materi ditemukan</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((item) => (
            <LibraryCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {usulOpen && <UsulTopikDialog onClose={() => setUsulOpen(false)} />}
    </div>
  );
}
