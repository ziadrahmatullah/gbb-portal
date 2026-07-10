import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { KeyRound, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { ROLES } from "@/shared/constants/roles";
import type { Role } from "@/shared/constants/roles";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  useCreateUser,
  useDeleteUser,
  useResetPassword,
  useUpdateUser,
  useUserList,
} from "../hooks/useSettings";
import type { User } from "../services";

const ALL = "all";

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateUser();
  const [form, setForm] = useState({ nama: "", email: "", password: "", divisi: "" });
  const [role, setRole] = useState<Role>("viewer");

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate(
      { ...form, divisi: form.divisi || undefined, role },
      { onSuccess: onClose }
    );
  };

  const saving = createMutation.isPending;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah User</DialogTitle>
          <DialogDescription>Buat akun portal internal baru.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="u-nama">Nama</Label>
            <Input id="u-nama" value={form.nama} onChange={set("nama")} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" value={form.email} onChange={set("email")} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-password">Password (min 8 karakter)</Label>
            <Input id="u-password" type="password" minLength={8} value={form.password} onChange={set("password")} required disabled={saving} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v: Role) => setRole(v)} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-divisi">Divisi (opsional)</Label>
              <Input id="u-divisi" value={form.divisi} onChange={set("divisi")} disabled={saving} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const updateMutation = useUpdateUser();
  const [nama, setNama] = useState(user.nama);
  const [role, setRole] = useState<Role>(user.role);
  const [divisi, setDivisi] = useState(user.divisi ?? "");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateMutation.mutate({ id: user.id, body: { nama, role, divisi } }, { onSuccess: onClose });
  };

  const saving = updateMutation.isPending;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User — {user.nama}</DialogTitle>
          <DialogDescription>
            Email &amp; password tidak dapat diubah dari sini (reset password belum tersedia).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground">Email:</span> {user.email}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ue-nama">Nama</Label>
            <Input id="ue-nama" value={nama} onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)} required disabled={saving} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v: Role) => setRole(v)} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ue-divisi">Divisi</Label>
              <Input id="ue-divisi" value={divisi} onChange={(e: ChangeEvent<HTMLInputElement>) => setDivisi(e.target.value)} disabled={saving} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const resetMutation = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setError("");
    resetMutation.mutate({ id: user.id, password }, { onSuccess: onClose });
  };

  const saving = resetMutation.isPending;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password — {user.nama}</DialogTitle>
          <DialogDescription>
            Set password baru untuk {user.email}. Sampaikan ke user via WA/email di luar sistem.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rp-pass">Password baru (min 8 karakter)</Label>
            <Input id="rp-pass" type="password" minLength={8} value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required disabled={saving} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm">Konfirmasi password baru</Label>
            <Input id="rp-confirm" type="password" minLength={8} value={confirm} onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)} required disabled={saving} autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Mereset…" : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTab() {
  const myEmail = useAuthStore((s) => s.email);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  // Pesan error 409 saat delete (mis. user direferensikan) → tampilkan CTA Nonaktifkan
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading } = useUserList({
    limit: 100,
    search: search || undefined,
    role: roleFilter === ALL ? undefined : roleFilter,
  });
  const deleteMutation = useDeleteUser();
  const updateMutation = useUpdateUser();

  const items = data?.items ?? [];

  const closeDelete = () => {
    setDeleting(null);
    setDeleteError("");
  };
  const deactivate = (u: User) =>
    updateMutation.mutate({ id: u.id, body: { is_active: false } }, { onSuccess: closeDelete });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Cari nama/email…"
              className="pl-9 w-64"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua Role</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-28">Role</TableHead>
              <TableHead className="w-32">Divisi</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada user ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.nama}
                    {u.email === myEmail && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Anda
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{u.divisi || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.is_active}
                        onCheckedChange={(v: boolean) =>
                          updateMutation.mutate({ id: u.id, body: { is_active: v } })
                        }
                        disabled={updateMutation.isPending}
                        title={u.is_active ? "Aktif — klik untuk nonaktifkan" : "Nonaktif — klik untuk aktifkan"}
                      />
                      <span className={`text-xs ${u.is_active ? "text-primary" : "text-muted-foreground"}`}>
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Reset Password"
                        onClick={() => setResetting(u)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => setEditing(u)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Hapus"
                        onClick={() => { setDeleteError(""); setDeleting(u); }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {createOpen && <CreateUserDialog onClose={() => setCreateOpen(false)} />}
      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && closeDelete()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus <strong>{deleting?.nama}</strong> ({deleting?.email})? Bila
              user masih direferensikan data lain, penghapusan akan ditolak — nonaktifkan
              aksesnya sebagai gantinya.
            </DialogDescription>
          </DialogHeader>
          {/* Gagal karena direferensikan → tawarkan Nonaktifkan (is_active:false) */}
          {deleteError && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
              {deleteError}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDelete}>
              Batal
            </Button>
            {deleteError && deleting?.is_active ? (
              <Button
                variant="destructive"
                disabled={updateMutation.isPending}
                onClick={() => deleting && deactivate(deleting)}
              >
                {updateMutation.isPending ? "Menonaktifkan…" : "Nonaktifkan User"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleting &&
                  deleteMutation.mutate(deleting.id, {
                    onSuccess: closeDelete,
                    onError: (err) =>
                      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus user"),
                  })
                }
              >
                {deleteMutation.isPending ? "Menghapus…" : "Ya, Hapus"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
