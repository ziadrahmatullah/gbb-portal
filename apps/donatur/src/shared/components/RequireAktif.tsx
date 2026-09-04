import { Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@gbb/ui";
import { NAV_ITEMS } from "@/shared/constants/navigation";
import { useDonaturStatus } from "@/shared/hooks/useDonaturStatus";
import { AjakPatunganPanel } from "./AjakPatunganPanel";

// Guard rute untuk menu yang hanya terbuka bagi donatur aktif bulan ini.
// Panel inline (bukan redirect) — URL tetap jujur dan alasannya tidak hilang;
// pola yang sama dengan RequireRole di portal internal.
//
// Tiga state, semua ditangani:
//   pending → skeleton (default "terkunci" mengedipkan gembok tiap navigasi,
//             default "terbuka" mengedipkan halaman asli + menjalankan query-nya)
//   error   → FAIL OPEN, render halaman (ditangani di hook: locked=false)
//   sukses  → tegakkan
export function RequireAktif() {
  const { isPending, locked, status } = useDonaturStatus();
  const { pathname } = useLocation();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (locked) {
    // Label menu untuk kalimat pembuka; /data-beswan/:id ikut cocok lewat startsWith
    const item = NAV_ITEMS.find((n) => pathname.startsWith(n.path));
    return <AjakPatunganPanel status={status} fitur={item?.label} />;
  }

  return <Outlet />;
}
