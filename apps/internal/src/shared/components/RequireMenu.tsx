import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Skeleton } from "@gbb/ui";
import { useMenuAccess } from "@/shared/hooks/useMenuAccess";
import type { MenuKey } from "@/shared/constants/menu";

function AccessDeniedPanel() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-xl bg-card p-8 text-center shadow-md">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Tidak memiliki akses</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Role Anda tidak diizinkan membuka menu ini. Hubungi admin bila Anda merasa ini keliru
          — admin mengaturnya di Settings › Hak Akses Menu.
        </p>
      </div>
    </div>
  );
}

// Guard rute berbasis kunci menu (pengganti RequireRole untuk hak LIHAT).
// Panel inline (bukan redirect) — mirror semantik 403 backend, URL tetap jujur.
// Saat matriks masih dimuat → skeleton, supaya tidak mengedipkan panel tolak
// pada user yang sebenarnya boleh.
export function RequireMenu({ menu }: { menu: MenuKey }) {
  const { allowed, isPending } = useMenuAccess();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  if (!allowed.has(menu)) return <AccessDeniedPanel />;
  return <Outlet />;
}
