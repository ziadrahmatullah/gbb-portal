// Helper tautan WhatsApp (wa.me) — dipakai portal internal (Monitoring Donatur)
// dan portal donatur (floating "Hubungi Admin GBB"). Satu sumber supaya aturan
// normalisasi nomor tidak bercabang antar app.

/**
 * Normalisasi nomor HP Indonesia ke format internasional tanpa "+" (62xxx),
 * seperti yang diminta wa.me. "0812…" → "62812…", "+62 812…" → "62812…".
 * @param {string | null | undefined} hp
 * @returns {string}
 */
export function normalizeWa(hp) {
  let n = (hp || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (!n.startsWith("62")) n = "62" + n;
  return n;
}

/**
 * Bangun URL wa.me dengan pesan pre-filled (sudah di-encode).
 * @param {string} hp nomor tujuan (format apa pun, akan dinormalisasi)
 * @param {string} [text] isi pesan awal
 * @returns {string}
 */
export function waLink(hp, text) {
  const base = `https://wa.me/${normalizeWa(hp)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
