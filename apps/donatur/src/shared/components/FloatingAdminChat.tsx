import { MessageCircle } from "lucide-react";
import { waLink } from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { WA_ADMIN, waAdminText } from "@/shared/lib/waAdmin";

// Tombol melayang kanan-bawah, persisten di semua halaman portal donatur
// (dipasang sekali di AppLayout). Masukan tim: teks "hubungi Tim AnC" di banner
// tidak actionable — donatur perlu jalur langsung ke WA admin.
export function FloatingAdminChat() {
  const profile = useAuthStore((s) => s.profile);
  const href = waLink(WA_ADMIN, waAdminText(profile));

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Hubungi Admin GBB via WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 print:hidden"
    >
      {/* Label pill: tampil di layar lebar, di mobile cukup ikonnya */}
      <span className="hidden rounded-full border bg-card px-3 py-1.5 text-sm font-medium shadow-md transition-opacity sm:inline-block">
        Hubungi Admin GBB
      </span>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform group-hover:scale-105 group-active:scale-95">
        <MessageCircle className="h-7 w-7" />
      </span>
    </a>
  );
}
