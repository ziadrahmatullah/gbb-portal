import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Calendar,
  Info,
  LayoutGrid,
  Linkedin,
  List,
  Search,
  Users,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from "@gbb/ui";
import { MentorRequestTab } from "./MentorRequestTab";
import { RequestDialog } from "./RequestDialog";
import { useMentorList } from "../hooks/useMentor";
import type { Mentor } from "../services";

const ALL_BIDANG = "all";

function MentorCard({ mentor, onRequest }: { mentor: Mentor; onRequest: () => void }) {
  return (
    <Card className="h-full gap-2 py-4">
      <CardContent className="flex flex-1 flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-medium" title={mentor.nama}>{mentor.nama}</div>
            <div className="truncate text-sm text-muted-foreground">{mentor.bidang_keahlian}</div>
          </div>
          {mentor.is_internal && (
            <Badge variant="outline" className="shrink-0 text-primary">🏠 Tim GBB</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" />
            {mentor.jumlah_event} event
          </span>
          {mentor.linkedin_url && (
            <a
              href={mentor.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Linkedin className="size-3.5" />
              LinkedIn
            </a>
          )}
        </div>
        <Button size="sm" variant="outline" className="mt-auto" onClick={onRequest}>
          Request 1-on-1
        </Button>
      </CardContent>
    </Card>
  );
}

// Varian tampilan list: satu mentor per baris, tombol request di kanan
function MentorRow({ mentor, onRequest }: { mentor: Mentor; onRequest: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{mentor.nama}</span>
          {mentor.is_internal && (
            <Badge variant="outline" className="shrink-0 text-primary">🏠 Tim GBB</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{mentor.bidang_keahlian}</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3" />
            {mentor.jumlah_event} event
          </span>
          {mentor.linkedin_url && (
            <a
              href={mentor.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Linkedin className="size-3" />
              LinkedIn
            </a>
          )}
        </div>
      </div>
      <Button size="sm" variant="outline" className="shrink-0" onClick={onRequest}>
        Request 1-on-1
      </Button>
    </div>
  );
}

function MentorListTab() {
  const [search, setSearch] = useState("");
  const [bidang, setBidang] = useState(ALL_BIDANG);
  // Tampilan grid (kartu) atau list (baris) — ala Google Drive
  const [view, setView] = useState<"grid" | "list">("grid");
  const [requestFor, setRequestFor] = useState<{ open: boolean; mentorId?: number }>({ open: false });

  const { data, isLoading } = useMentorList();
  const mentors = useMemo(() => data?.items ?? [], [data]);

  // Filter bidang diturunkan dari data ter-load (tidak ada endpoint daftar bidang)
  const bidangOptions = useMemo(
    () => [...new Set(mentors.map((m) => m.bidang_keahlian).filter(Boolean))].sort(),
    [mentors]
  );
  const q = search.trim().toLowerCase();
  const visible = mentors.filter(
    (m) =>
      (bidang === ALL_BIDANG || m.bidang_keahlian === bidang) &&
      (!q || m.nama.toLowerCase().includes(q) || m.bidang_keahlian.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-4">
      {/* Tombol request (judul halaman ada di MentorPage ber-tab) */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setRequestFor({ open: true })}>
          <Users className="size-4" />
          Request 1-on-1
        </Button>
      </div>

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          Kontak mentor tidak dibagikan langsung. Untuk terhubung dengan mentor, gunakan tombol
          Request 1-on-1 — Tim Program GBB yang akan menjadwalkan.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari mentor…"
            className="w-64 pl-9"
          />
        </div>
        <Select value={bidang} onValueChange={setBidang}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BIDANG}>Semua Bidang</SelectItem>
            {bidangOptions.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
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
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Users className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Tidak ada mentor ditemukan</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <MentorCard
              key={m.id}
              mentor={m}
              onRequest={() => setRequestFor({ open: true, mentorId: m.id })}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-md border bg-card">
          {visible.map((m) => (
            <MentorRow
              key={m.id}
              mentor={m}
              onRequest={() => setRequestFor({ open: true, mentorId: m.id })}
            />
          ))}
        </div>
      )}

      {requestFor.open && (
        <RequestDialog
          mentors={mentors}
          initialMentorId={requestFor.mentorId}
          onClose={() => setRequestFor({ open: false })}
        />
      )}
    </div>
  );
}

const MENTOR_TABS = [
  { key: "daftar", label: "Daftar Mentor" },
  { key: "request", label: "Request Mentor" },
] as const;

type MentorTabKey = (typeof MENTOR_TABS)[number]["key"];

export function MentorPage() {
  const [tab, setTab] = useState<MentorTabKey>("daftar");
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Mentor</h1>
      </div>

      <Tabs value={tab} onValueChange={(v: string) => setTab(v as MentorTabKey)} className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            {MENTOR_TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="daftar" className="space-y-4">
          <MentorListTab />
        </TabsContent>
        <TabsContent value="request" className="space-y-4">
          <MentorRequestTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
