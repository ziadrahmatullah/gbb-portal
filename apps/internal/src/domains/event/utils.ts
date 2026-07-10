export const formatEventDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });
