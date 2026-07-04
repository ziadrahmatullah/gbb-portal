import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "../services";

const KEY = "transactions";

export function useTransactions(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => transactionService.getAll(params),
  });
}

export function useTransaction(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => transactionService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCategoriesDropdown() {
  return useQuery({
    queryKey: [KEY, "categories-dropdown"],
    queryFn: () => transactionService.getCategoriesDropdown(),
  });
}

export function useDistrictsDropdown() {
  return useQuery({
    queryKey: [KEY, "districts-dropdown"],
    queryFn: () => transactionService.getDistrictsDropdown(),
  });
}

export function useMosquesDropdown() {
  return useQuery({
    queryKey: [KEY, "mosques-dropdown"],
    queryFn: () => transactionService.getMosquesDropdown(),
  });
}

export function useTransactionTrend(params = {}) {
  return useQuery({
    queryKey: [KEY, "trend", params],
    queryFn: () => transactionService.getTrend(params),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => transactionService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => transactionService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => transactionService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useBulkUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => transactionService.bulkUpload(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
