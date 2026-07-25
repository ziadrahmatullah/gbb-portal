import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addPrestasiFile,
  createPrestasi,
  deletePrestasi,
  deletePrestasiFile,
  getPertanyaan,
  getPrestasiList,
  getRefleksi,
  saveDraft,
  submitRefleksi,
  updatePrestasi,
  uploadDokumentasi,
} from "../services";
import type { Prestasi, PrestasiInput } from "../services";

export const REFLEKSI_KEY = "refleksi";
export const PRESTASI_KEY = "prestasi";

export function usePertanyaan() {
  return useQuery({
    queryKey: [REFLEKSI_KEY, "pertanyaan"],
    queryFn: getPertanyaan,
    staleTime: 5 * 60 * 1000, // master data, jarang berubah
  });
}

export function useRefleksi(periodeId: number | undefined, bulan: number, tahun: number) {
  return useQuery({
    queryKey: [REFLEKSI_KEY, "detail", periodeId, bulan, tahun],
    queryFn: () => getRefleksi(periodeId!, bulan, tahun),
    enabled: !!periodeId,
  });
}

export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveDraft,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REFLEKSI_KEY, "detail"] });
      toast.success("Draft refleksi tersimpan");
    },
  });
}

export function useSubmitRefleksi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitRefleksi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REFLEKSI_KEY, "detail"] });
      toast.success("Refleksi berhasil disubmit — terima kasih!");
    },
  });
}

export function useUploadDokumentasi() {
  return useMutation({ mutationFn: (files: File[]) => uploadDokumentasi(files) });
}

// ─── Prestasiku ──────────────────────────────────────────────────────────

export function usePrestasiList() {
  return useQuery({
    queryKey: [PRESTASI_KEY, "list"],
    queryFn: () => getPrestasiList(),
  });
}

export function useCreatePrestasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, files }: { input: PrestasiInput; files: File[] }) =>
      createPrestasi(input, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRESTASI_KEY] });
      toast.success("Prestasi ditambahkan");
    },
  });
}

export function useUpdatePrestasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<PrestasiInput> }) =>
      updatePrestasi(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRESTASI_KEY] });
      toast.success("Prestasi diperbarui");
    },
  });
}

export function useAddPrestasiFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file, tipe }: { id: number; file: File; tipe: "sertifikat" | "foto" }) =>
      addPrestasiFile(id, file, tipe),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRESTASI_KEY] });
      toast.success("File ditambahkan");
    },
  });
}

export function useDeletePrestasiFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fileId }: { id: number; fileId: number }) => deletePrestasiFile(id, fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRESTASI_KEY] });
      toast.success("File dihapus");
    },
  });
}

export function useDeletePrestasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prestasi: Prestasi) => deletePrestasi(prestasi),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRESTASI_KEY] });
      toast.success("Prestasi dihapus");
    },
  });
}
