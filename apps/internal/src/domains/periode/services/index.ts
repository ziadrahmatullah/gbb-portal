import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/periode_dto.go
export interface Periode {
  id: number;
  nama: string;
  goal: string;
  semester: number; // 1 = Jan–Jun, 2 = Jul–Des
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  status: string; // "aktif" | "selesai"
}

export interface CreatePeriodeReq {
  nama: string;
  goal?: string;
  semester: 1 | 2;
  start_date: string;
  end_date: string;
  status: "aktif" | "selesai";
}

// PUT bersifat partial: field yang tidak dikirim/zero-value tidak diubah backend
export type UpdatePeriodeReq = Partial<CreatePeriodeReq>;

export async function getPeriodeList(params: ListParams = {}) {
  const res = await apiClient.get<Periode[]>("/internal/periode", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

export async function createPeriode(body: CreatePeriodeReq) {
  const res = await apiClient.post<Periode>("/internal/periode", body);
  return res.data;
}

export async function updatePeriode(id: number, body: UpdatePeriodeReq) {
  const res = await apiClient.put<Periode>(`/internal/periode/${id}`, body);
  return res.data;
}

export async function deletePeriode(id: number) {
  const res = await apiClient.delete(`/internal/periode/${id}`);
  return res.message; // { message: "berhasil dihapus" }
}
