// Tautan "Tambah ke Google Calendar" — template URL resmi Google, tanpa OAuth
// dan tanpa backend (masukan PCM Sep 2026 untuk menu Event & Penugasan).
// Sinkronisasi OTOMATIS (langganan kalender) menunggu feed ICS dari backend
// (FEpromt29); sampai itu ada, beswan menambahkan per item lewat tautan ini.
const GCAL_BASE = "https://calendar.google.com/calendar/render?action=TEMPLATE";
// jam_mulai/jam_selesai event dikirim BE tanpa zona → ditafsirkan WIB
const EVENT_TZ = "Asia/Jakarta";

const pad = (n: number) => String(n).padStart(2, "0");

// "HH:MM" | "HH:MM:SS" → [jam, menit]
function parseHHMM(hhmm: string): [number, number] {
  const [h, m] = hhmm.split(":");
  return [Number(h) || 0, Number(m) || 0];
}

// "YYYY-MM-DD…" + "HH:MM" → "YYYYMMDDTHHMM00" (waktu dinding, zona lewat ctz)
function wallTime(dateISO: string, hhmm: string) {
  const [h, m] = parseHHMM(hhmm);
  return `${dateISO.slice(0, 10).replace(/-/g, "")}T${pad(h)}${pad(m)}00`;
}

function plusOneHour(hhmm: string) {
  const [h, m] = parseHHMM(hhmm);
  return `${pad(Math.min(23, h + 1))}:${pad(m)}`;
}

// Tanggal ISO + n hari → "YYYYMMDD" (acara seharian memakai end eksklusif)
function addDaysCompact(dateISO: string, days: number) {
  const [y, m, d] = dateISO.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10).replace(/-/g, "");
}

// Date → "YYYYMMDDTHHMMSSZ" (UTC; Google menyesuaikan ke zona kalender user)
function utcStamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function build(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  return `${GCAL_BASE}&${q.toString()}`;
}

export interface CalendarEventInput {
  title: string;
  tanggal: string; // ISO — hanya bagian tanggalnya yang dipakai
  jamMulai?: string | null; // kosong = acara seharian
  jamSelesai?: string | null; // kosong = jamMulai + 1 jam
  details?: string;
  location?: string;
}

export function googleCalendarEventUrl(e: CalendarEventInput) {
  const date = e.tanggal.slice(0, 10);
  const timed = !!e.jamMulai;
  const dates = timed
    ? `${wallTime(date, e.jamMulai!)}/${wallTime(date, e.jamSelesai || plusOneHour(e.jamMulai!))}`
    : `${date.replace(/-/g, "")}/${addDaysCompact(date, 1)}`;
  return build({
    text: e.title,
    dates,
    ctz: timed ? EVENT_TZ : undefined,
    details: e.details,
    location: e.location,
  });
}

// Deadline penugasan = instan nyata (ISO berzona) → blok 30 menit yang
// berakhir tepat di deadline, supaya pengingat default Google Calendar
// berbunyi sebelum tenggat.
export function googleCalendarDeadlineUrl(input: { title: string; deadline: string; details?: string }) {
  const end = new Date(input.deadline);
  const start = new Date(end.getTime() - 30 * 60 * 1000);
  return build({
    text: input.title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details: input.details,
  });
}
