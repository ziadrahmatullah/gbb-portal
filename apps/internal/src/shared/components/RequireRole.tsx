import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import type { Role } from "@/shared/constants/roles";

function AccessDeniedPanel() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Tidak memiliki akses</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Role Anda tidak diizinkan membuka halaman ini. Hubungi admin bila Anda merasa ini
          keliru.
        </p>
      </div>
    </div>
  );
}

// Panel inline (bukan redirect) — mirror semantik 403 backend, URL tetap jujur.
export function RequireRole({ roles }: { roles: Role[] }) {
  const role = useAuthStore((s) => s.role);

  if (!hasAnyRole(role, roles)) {
    return <AccessDeniedPanel />;
  }

  return <Outlet />;
}
