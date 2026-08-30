import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardList,
  FileCheck,
  FileText,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Skeleton,
} from "@gbb/ui";
import { getNotifikasiTarget } from "../services";
import type { Notifikasi } from "../services";
import {
  useMarkAllNotifikasiRead,
  useMarkNotifikasiRead,
  useNotifikasiList,
  useUnreadCount,
} from "../hooks/useNotifikasi";

// Mapping tipe notifikasi → ikon; tipe baru dari BE cukup ditambah di sini
// (tipe tak dikenal jatuh ke ikon Bell)
const NOTIF_TIPE: Record<string, LucideIcon> = {
  penugasan: ClipboardList,
  nilai: Award,
  event: CalendarDays,
  hasil: FileCheck,
  laporan: FileText,
  mentor_request: UserRound,
};

// Waktu relatif bahasa Indonesia via Intl — tidak ada dayjs/date-fns di repo
function relativeTime(iso: string): string {
  const menit = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (menit < 1) return "baru saja";
  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  if (menit < 60) return rtf.format(-menit, "minute");
  const jam = Math.round(menit / 60);
  if (jam < 24) return rtf.format(-jam, "hour");
  const hari = Math.round(jam / 24);
  if (hari < 7) return rtf.format(-hari, "day");
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// reminders: string bebas dari /beswan/dashboard, tanpa status baca —
// tampil sebagai seksi "Pengingat" di atas daftar notifikasi
export function NotificationBell({ reminders = [] }: { reminders?: string[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: items = [], isLoading } = useNotifikasiList(open);
  const markRead = useMarkNotifikasiRead();
  const markAll = useMarkAllNotifikasiRead();

  const showDot = unreadCount > 0 || reminders.length > 0;

  // Klik notifikasi = tandai dibaca (bila belum) + buka halaman terkait
  const handleOpenNotif = (n: Notifikasi) => {
    if (!n.is_read) markRead.mutate(n.id);
    const target = getNotifikasiTarget(n);
    if (target) {
      setOpen(false);
      navigate(target);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifikasi"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell />
          {showDot && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <span className="text-sm font-semibold">Notifikasi</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="size-3.5" />
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto p-2">
          {reminders.length > 0 && (
            <>
              <div className="px-2 pb-1 pt-1 text-xs font-medium text-muted-foreground">
                Pengingat
              </div>
              <ul className="space-y-1 pb-1">
                {reminders.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-yellow-700 dark:text-yellow-400"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
              <Separator className="my-1" />
            </>
          )}
          {isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : items.length === 0 ? (
            reminders.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Tidak ada notifikasi
              </p>
            )
          ) : (
            <ul className="space-y-0.5">
              {items.map((n) => {
                const Icon = NOTIF_TIPE[n.tipe] ?? Bell;
                return (
                  <li key={n.id} className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenNotif(n)}
                      className="flex min-w-0 flex-1 items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/50"
                    >
                      <div
                        className={cn(
                          "mt-0.5 shrink-0 rounded-md p-1.5",
                          n.is_read ? "bg-muted" : "bg-primary/10"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-3.5",
                            n.is_read ? "text-muted-foreground" : "text-primary"
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            n.is_read ? "text-muted-foreground" : "font-medium"
                          )}
                        >
                          {n.pesan}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {relativeTime(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                    {!n.is_read && (
                      <button
                        title="Tandai dibaca"
                        onClick={() => markRead.mutate(n.id)}
                        disabled={markRead.isPending}
                        className="mt-2 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                      >
                        <Check className="size-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
