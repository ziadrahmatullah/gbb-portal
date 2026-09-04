import { FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gbb/ui";
import { assetUrl } from "@/domains/beranda/services";
import { readerKind } from "../services";
import type { LibraryItem, ReaderKind } from "../services";

// Baca materi langsung di portal tanpa mengunduh (masukan PCM Sep 2026).
// PDF & gambar dirender browser sendiri (iframe/img — backend melayani
// asset-storage tanpa header X-Frame-Options); dokumen Office lewat Office
// Online viewer Microsoft (lebih stabil daripada Google Docs Viewer yang
// sering membalas kosong/403), keduanya hanya bekerja bila file_url bisa
// diakses publik.
const OFFICE_VIEWER = "https://view.officeapps.live.com/op/embed.aspx?src=";

export function LibraryReaderDialog({
  item,
  onClose,
}: {
  item: LibraryItem | null;
  onClose: () => void;
}) {
  const fileUrl = item ? (assetUrl(item.file_url) ?? item.file_url) : "";
  const kind: ReaderKind = item ? readerKind(fileUrl) : "other";
  const src = kind === "office" ? `${OFFICE_VIEWER}${encodeURIComponent(fileUrl)}` : fileUrl;

  return (
    <Dialog open={!!item} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="flex h-[90vh] flex-col gap-3 p-4 sm:max-w-5xl">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="truncate">{item?.nama}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {kind === "office"
                ? "Ditampilkan lewat Office Online viewer"
                : "Pratinjau langsung di portal — tidak perlu mengunduh"}
            </span>
            {item && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <FileDown className="size-3.5" />
                Download
              </a>
            )}
          </DialogDescription>
        </DialogHeader>
        {item && (
          <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30">
            {kind === "image" ? (
              <img src={fileUrl} alt={item.nama} className="mx-auto max-h-full object-contain" />
            ) : (
              // key: paksa iframe baru saat materi berganti (tanpa ini beberapa
              // browser mempertahankan dokumen lama)
              <iframe key={item.id} src={src} title={item.nama} className="size-full" />
            )}
          </div>
        )}
        {kind === "office" && (
          <p className="text-xs text-muted-foreground">
            Kalau pratinjau kosong, file belum bisa diakses publik oleh layanan viewer —
            gunakan Download.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
