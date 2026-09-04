import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  BookOpen,
  FileDown,
  LayoutGrid,
  List,
  Mic,
  PlayCircle,
  Search,
  Send,
  Sparkles,
  Tag,
  Upload,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
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
  Skeleton,
  Textarea,
  cn,
} from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { useLibraryList, useLibraryStats, useUsulTopik } from "../hooks/useLibrary";
import { canReadOnline, splitTags } from "../services";
import type { LibraryItem } from "../services";
import { LibraryReaderDialog } from "./LibraryReaderDialog";
import { UsulankuSection } from "./UsulankuSection";

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
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending || !topik.trim()}>
              <Send className="size-4" />
              {mutation.isPending ? "Mengirim…" : "Kirim Usulan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Tombol "Baca" — buka materi di dialog pratinjau tanpa mengunduh (PCM Sep 2026)
function ReadButton({ item, onRead }: { item: LibraryItem; onRead: () => void }) {
  if (!canReadOnline(item.file_url)) return null;
  return (
    <button
      type="button"
      onClick={onRead}
      className="inline-flex items-center gap-1.5 text-primary hover:underline"
    >
      <BookOpen className="size-4" />
      Baca
    </button>
  );
}

function LibraryCard({ item, onRead }: { item: LibraryItem; onRead: () => void }) {
  const TipeIcon = item.tipe === "event_materi" ? Mic : Upload;
  const tags = splitTags(item.tags);
  return (
    <Card className="h-full gap-2 py-4">
      <CardContent className="flex flex-1 flex-col gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2">
            <TipeIcon className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium" title={item.nama}>
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
              <Badge key={t} variant="outline" className="font-normal text-muted-foreground">
                #{t}
              </Badge>
            ))}
          </div>
        )}
        {item.deskripsi && <p className="line-clamp-2 text-sm text-muted-foreground">{item.deskripsi}</p>}
        <div className="flex items-start gap-1.5 text-xs">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          {item.ai_summary ? (
            <span className="line-clamp-2 italic">“{item.ai_summary}”</span>
          ) : (
            <span className="text-muted-foreground">Belum ada ringkasan AI</span>
          )}
        </div>
        <div className="mt-auto flex items-center gap-4 pt-1 text-sm">
          <ReadButton item={item} onRead={onRead} />
          <a
            href={item.file_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <FileDown className="size-4" />
            Download
          </a>
          {item.youtube_url && (
            <a
              href={item.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <PlayCircle className="size-4" />
              YouTube
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Varian tampilan list: satu materi per baris, link download/YouTube di kanan
function LibraryRow({ item, onRead }: { item: LibraryItem; onRead: () => void }) {
  const TipeIcon = item.tipe === "event_materi" ? Mic : Upload;
  const tags = splitTags(item.tags);
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="shrink-0 rounded-lg bg-primary/10 p-2">
        <TipeIcon className="size-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate font-medium">{item.nama}</span>
          {tags.map((t) => (
            <Badge key={t} variant="outline" className="font-normal text-muted-foreground">
              #{t}
            </Badge>
          ))}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {item.tipe === "event_materi" ? "Materi event" : "Upload PCM"}
          {item.deskripsi ? ` · ${item.deskripsi}` : ""}
        </div>
        {item.ai_summary && (
          <div className="mt-0.5 flex items-start gap-1.5 text-xs">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="line-clamp-1 italic">“{item.ai_summary}”</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <ReadButton item={item} onRead={onRead} />
        <a
          href={item.file_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline"
        >
          <FileDown className="size-4" />
          Download
        </a>
        {item.youtube_url && (
          <a
            href={item.youtube_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <PlayCircle className="size-4" />
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
  // Materi yang sedang dibaca di dialog pratinjau (null = tertutup)
  const [reader, setReader] = useState<LibraryItem | null>(null);
  // Tampilan grid (kartu) atau list (baris) — ala Google Drive
  const [view, setView] = useState<"grid" | "list">("grid");

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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Library Materi</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setUsulOpen(true)}>
            <Send className="size-4" />
            Usul Topik
          </Button>
        </div>
      </div>

      <div className="grid max-w-md grid-cols-2 gap-4">
        <StatCard icon={BookOpen} label="Total Materi" value={String(stats?.total_materi ?? "—")} loading={statsLoading} />
        <StatCard icon={Tag} label="Topik Tag" value={String(stats?.total_tag ?? "—")} loading={statsLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari materi…"
            className="w-64 pl-9"
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
        {/* Toggle tampilan grid / list — ala Google Drive */}
        <div className="ms-auto flex items-center rounded-md border p-0.5">
          <button
            title="Tampilan grid"
            onClick={() => setView("grid")}
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            title="Tampilan list"
            onClick={() => setView("list")}
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <BookOpen className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Tidak ada materi ditemukan</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <LibraryCard key={item.id} item={item} onRead={() => setReader(item)} />
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-md border bg-card">
          {visible.map((item) => (
            <LibraryRow key={item.id} item={item} onRead={() => setReader(item)} />
          ))}
        </div>
      )}

      {/* Usulan topik milik beswan + status review (slide 9) */}
      <UsulankuSection />

      {usulOpen && <UsulTopikDialog onClose={() => setUsulOpen(false)} />}
      <LibraryReaderDialog item={reader} onClose={() => setReader(null)} />
    </div>
  );
}
