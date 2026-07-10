// Role user portal internal — mirror gbb-backend entity/users.go.
export const ROLES = ["admin", "pcm", "finance", "anc", "viewer"] as const;

export type Role = (typeof ROLES)[number];

// allowed kosong/undefined = tidak ada pembatasan role.
export function hasAnyRole(role: Role | null | undefined, allowed?: readonly Role[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  return Boolean(role && allowed.includes(role));
}
