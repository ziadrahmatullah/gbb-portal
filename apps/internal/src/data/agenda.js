// Agenda items for the Microsite
// speaker_ids references speakers.id (microsite speaker profiles)
// day_number: 1 | 2 | 3
// date: ISO date string "YYYY-MM-DD"
// time_start / time_end: "HH:MM"
// event_type: "Simposium" | "ESS Awards"
export const agenda = [
  {
    id: "ag-001",
    title: "Opening Keynote: Masa Depan Teknologi Indonesia",
    event_type: "Simposium",
    day_number: 1,
    date: "2025-06-10",
    time_start: "09:00",
    time_end: "10:00",
    place: "Aula Utama, Lantai 2",
    speaker_ids: ["spk-001"],
    description: "Keynote pembuka yang membahas visi dan arah transformasi digital Indonesia dalam lima tahun ke depan.",
  },
  {
    id: "ag-002",
    title: "Panel: AI & Data Science dalam Industri 4.0",
    event_type: "Simposium",
    day_number: 1,
    date: "2025-06-10",
    time_start: "10:30",
    time_end: "12:00",
    place: "Ruang Konferensi A, Lantai 3",
    speaker_ids: ["spk-002", "spk-003"],
    description:
      "Diskusi panel mendalam tentang penerapan kecerdasan buatan dan ilmu data dalam transformasi industri manufaktur.",
  },
  {
    id: "ag-003",
    title: "Seminar: Inovasi Bisnis & ESS Award Nominees",
    event_type: "ESS Awards",
    day_number: 1,
    date: "2025-06-10",
    time_start: "13:30",
    time_end: "15:00",
    place: "Ruang Seminar B, Lantai 2",
    speaker_ids: ["spk-004"],
    description:
      "Seminar khusus menampilkan para nominator ESS Awards 2025 yang berbagi praktik terbaik inovasi bisnis berkelanjutan.",
  },
  {
    id: "ag-004",
    title: "Workshop: Digital Marketing Strategy 2025",
    event_type: "Simposium",
    day_number: 2,
    date: "2025-06-11",
    time_start: "09:00",
    time_end: "11:00",
    place: "Ruang Workshop C, Lantai 1",
    speaker_ids: ["spk-005"],
    description:
      "Workshop hands-on membahas tren digital marketing terkini, mulai dari SEO, social media, hingga AI-driven campaigns.",
  },
  {
    id: "ag-005",
    title: "Closing Panel: Kolaborasi Lintas Sektor",
    event_type: "Simposium",
    day_number: 2,
    date: "2025-06-11",
    time_start: "13:00",
    time_end: "14:30",
    place: "Aula Utama, Lantai 2",
    speaker_ids: ["spk-001", "spk-002"],
    description:
      "Panel penutup yang menekankan pentingnya sinergi antara akademisi, industri, dan pemerintah untuk kemajuan teknologi nasional.",
  },
  {
    id: "ag-006",
    title: "Workshop: Implementasi IoT untuk Smart Manufacturing",
    event_type: "ESS Awards",
    day_number: 2,
    date: "2025-06-11",
    time_start: "15:00",
    time_end: "17:00",
    place: "Lab Teknologi, Lantai 4",
    speaker_ids: ["spk-003"],
    description:
      "Workshop teknis tentang implementasi Internet of Things dalam lini produksi manufaktur cerdas — dipresentasikan oleh finalis ESS Awards.",
  },
  {
    id: "ag-007",
    title: "ESS Awards 2025: Pengumuman & Malam Anugerah",
    event_type: "ESS Awards",
    day_number: 3,
    date: "2025-06-12",
    time_start: "18:00",
    time_end: "21:00",
    place: "Grand Ballroom, Lantai 5",
    speaker_ids: ["spk-001", "spk-004"],
    description:
      "Malam puncak ESS Awards 2025 — pengumuman pemenang di seluruh kategori, gala dinner, dan networking bersama pemimpin industri.",
  },
  {
    id: "ag-008",
    title: "Closing Plenary: Agenda Transformasi Nasional",
    event_type: "Simposium",
    day_number: 3,
    date: "2025-06-12",
    time_start: "09:00",
    time_end: "11:00",
    place: "Aula Utama, Lantai 2",
    speaker_ids: ["spk-002", "spk-005"],
    description:
      "Sesi pleno penutup simposium yang merangkum temuan utama dan menetapkan agenda kolaborasi transformasi digital nasional ke depan.",
  },
];

export const AGENDA_CATEGORIES = ["Simposium", "ESS Awards"];
