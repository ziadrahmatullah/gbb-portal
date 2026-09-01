import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { CircleAlert, Check, User, X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { Input } from "@/shared/components/ui/input";
import type { DonaturOption } from "@/domains/donatur/services";

// Sentinel di luar rentang id donatur — dipetakan pemanggil ke patch
// clear_donatur / is_anonymous.
export const DONATUR_NONE = "none";
export const DONATUR_ANON = "anon";

// Daftar donatur bisa ribuan baris; render dibatasi supaya dropdown di dalam
// tabel tetap ringan. Sisanya dipersempit user lewat kata kunci.
const MAX_RENDER = 50;

type Item =
  | { key: string; kind: "none" | "anon"; label: string; sub: string }
  | { key: string; kind: "donatur"; label: string; sub: string };

// Combobox donatur untuk sel klasifikasi: field-nya sekaligus kotak pencarian
// (ketik langsung, tidak ada input terpisah di dalam dropdown). Cocok dengan
// nama maupun kode donatur.
export function DonaturCombobox({
  value,
  donaturs,
  onChange,
  disabled = false,
  invalid = false,
  className,
}: {
  value: string;
  donaturs: DonaturOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<Item[]>(
    () => [
      {
        key: DONATUR_NONE,
        kind: "none",
        label: "— (tanpa donatur)",
        sub: "Kosongkan relasi donatur untuk baris ini",
      },
      {
        key: DONATUR_ANON,
        kind: "anon",
        label: "Anonim",
        sub: "Donatur tidak diketahui / tidak ingin disebutkan",
      },
      ...donaturs.map<Item>((d) => ({
        key: String(d.id),
        kind: "donatur",
        label: d.nama,
        sub: d.kode,
      })),
    ],
    [donaturs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.label.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q)
    );
  }, [items, query]);

  const visible = filtered.slice(0, MAX_RENDER);
  const hiddenCount = filtered.length - visible.length;

  const selected = items.find((it) => it.key === value && it.key !== DONATUR_NONE);
  const selectedLabel = selected?.label ?? "";

  // Kursor keyboard selalu balik ke atas setiap dropdown dibuka / kata kunci berubah
  const openList = () => {
    setActive(0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const commit = (item: Item) => {
    onChange(item.key);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActive((prev) => {
        if (visible.length === 0) return 0;
        const next = e.key === "ArrowDown" ? prev + 1 : prev - 1;
        return (next + visible.length) % visible.length;
      });
      return;
    }
    if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const item = visible[active];
      if (item) commit(item);
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o: boolean) => {
        if (o) setActive(0);
        setOpen(o);
      }}
    >
      <PopoverAnchor asChild>
        <div ref={anchorRef} className={cn("relative", className)}>
          <Input
            ref={inputRef}
            // Saat tertutup field menampilkan pilihan; saat terbuka jadi kotak
            // pencarian yang mulai kosong supaya bisa langsung ketik nama baru.
            value={open ? query : selectedLabel}
            placeholder="Ketik nama donatur"
            aria-invalid={invalid}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            className={cn("h-8 pr-8 text-sm", invalid && "border-destructive")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setQuery(e.target.value);
              setActive(0);
              if (!open) setOpen(true);
            }}
            onFocus={() => !disabled && openList()}
            onKeyDown={handleKeyDown}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {value && value !== DONATUR_NONE && !disabled ? (
              <button
                type="button"
                aria-label="Kosongkan donatur"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setQuery("");
                  onChange(DONATUR_NONE);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            ) : invalid ? (
              <CircleAlert className="h-4 w-4 text-destructive" />
            ) : null}
          </span>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-(--radix-popover-trigger-width) min-w-72 p-1"
        // Fokus tetap di field supaya user bisa terus mengetik saat dropdown
        // terbuka, dan klik pada field tidak dianggap "klik di luar".
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
        onInteractOutside={(e: { target: EventTarget | null; preventDefault: () => void }) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div ref={listRef} className="max-h-64 overflow-auto">
          {visible.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Donatur tidak ditemukan
            </div>
          ) : (
            visible.map((it, i) => (
              <div key={it.key}>
                {/* Pemisah antara opsi sentinel dan daftar donatur */}
                {it.kind === "donatur" && i > 0 && visible[i - 1]?.kind !== "donatur" && (
                  <div className="my-1 h-px bg-border" />
                )}
                <button
                  type="button"
                  data-idx={i}
                  // Tahan mousedown agar field tidak kehilangan fokus sebelum klik terproses
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(it)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors",
                    i === active ? "bg-muted" : "hover:bg-muted/60"
                  )}
                >
                  {it.kind === "anon" && (
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{it.label}</span>
                    <span
                      className={cn(
                        "block truncate text-xs",
                        it.kind === "donatur"
                          ? "font-medium text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {it.sub}
                    </span>
                  </span>
                  {it.key === value && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                </button>
              </div>
            ))
          )}
          {hiddenCount > 0 && (
            <div className="px-3 py-2 text-center text-xs text-muted-foreground">
              +{hiddenCount} donatur lain — persempit dengan kata kunci
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
