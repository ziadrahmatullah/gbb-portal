import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn } from "../lib/utils.js";

/** Ekstensi cadangan untuk browser yang mengirim file.type kosong (mis. .docx di beberapa OS). */
const MIME_FALLBACK_EXT = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp", ".svg"],
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Drop melewati filter native `accept`, jadi tipe file divalidasi ulang di sini.
 * Mendukung ekstensi (".pdf"), mime penuh ("application/pdf"), dan wildcard ("image/*").
 */
function matchesAccept(file, accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      const byMime = rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule;
      if (byMime) return true;
      // file.type kosong → jatuh ke pencocokan ekstensi
      return !type && (MIME_FALLBACK_EXT[rule] ?? []).some((ext) => name.endsWith(ext));
    });
}

function acceptHint(accept) {
  if (!accept) return "";
  return accept
    .split(",")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => (rule.startsWith(".") ? rule.slice(1) : rule.replace("/*", "")))
    .join(", ")
    .toUpperCase();
}

/**
 * FileDropzone — pengganti `<Input type="file">` yang menerima drag & drop
 * sekaligus klik-untuk-memilih. File dipegang caller (controlled).
 *
 * @param {Object} props
 * @param {string} [props.id] id `<input>` tersembunyi — pasangkan dengan `<Label htmlFor>`
 * @param {File|File[]|null|undefined} [props.value] file terpilih saat ini; kosongkan bila
 *   daftar file dirender caller — `onChange` lalu hanya mengirim file yang baru dipilih
 * @param {(value: any) => void} props.onChange `File | null` saat single, `File[]` saat multiple
 * @param {string} [props.accept] sama seperti atribut accept native
 * @param {boolean} [props.multiple] izinkan lebih dari satu file
 * @param {boolean} [props.disabled]
 * @param {number} [props.maxSizeMb] tolak file yang lebih besar dari ini
 * @param {string} [props.hint] baris keterangan di bawah label (default: dari `accept`)
 * @param {(message: string) => void} [props.onReject] dipanggil saat file ditolak
 * @param {string} [props.className] kelas untuk wrapper terluar
 * @param {string} [props.zoneClassName] kelas untuk kotak drop-nya saja
 */
export function FileDropzone({
  id,
  value,
  onChange,
  accept,
  multiple,
  disabled,
  maxSizeMb,
  hint,
  onReject,
  className,
  zoneClassName,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const files = Array.isArray(value) ? value : value ? [value] : [];
  const hintText = hint ?? acceptHint(accept);

  const reject = (message) => {
    setError(message);
    onReject?.(message);
  };

  const commit = (fileList) => {
    const picked = Array.from(fileList ?? []);
    if (picked.length === 0) return;
    if (!multiple && picked.length > 1) {
      reject("Hanya boleh satu file.");
      return;
    }

    // File yang tidak lolos dibuang satu per satu; sisanya tetap diterima
    const valid = [];
    const salahFormat = [];
    const terlaluBesar = [];
    for (const f of picked) {
      if (!matchesAccept(f, accept)) salahFormat.push(f.name);
      else if (maxSizeMb && f.size > maxSizeMb * 1024 * 1024) terlaluBesar.push(f.name);
      else valid.push(f);
    }

    const masalah = [];
    if (salahFormat.length)
      masalah.push(
        `Format tidak didukung${hintText ? ` (${hintText})` : ""}: ${salahFormat.join(", ")}`
      );
    if (terlaluBesar.length)
      masalah.push(`Melebihi ${maxSizeMb} MB: ${terlaluBesar.join(", ")}`);

    if (masalah.length) reject(masalah.join(" · "));
    else setError("");

    if (valid.length) onChange(multiple ? [...files, ...valid] : valid[0]);
  };

  const removeAt = (index) => {
    setError("");
    onChange(multiple ? files.filter((_, i) => i !== index) : null);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    // abaikan drag yang hanya berpindah ke elemen anak
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    commit(e.dataTransfer.files);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label="Drop file di sini atau klik untuk memilih"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging ? "border-primary bg-primary/10" : "border-input bg-muted/20",
          error && !isDragging && "border-destructive/60",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-primary/50 hover:bg-muted/40",
          zoneClassName
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            commit(e.target.files);
            // reset agar memilih file yang sama dua kali tetap memicu onChange
            e.target.value = "";
          }}
        />
        <UploadCloud
          className={cn("h-5 w-5", isDragging ? "text-primary" : "text-muted-foreground")}
        />
        <p className="text-sm text-muted-foreground">
          {isDragging ? (
            <span className="font-medium text-primary">Lepaskan file di sini</span>
          ) : (
            <>
              Drag &amp; drop, atau{" "}
              <span className="font-medium text-primary">klik untuk memilih</span>
            </>
          )}
        </p>
        {hintText && <p className="text-xs text-muted-foreground">{hintText}</p>}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-sm"
            >
              <FileText className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(i);
                  }}
                  aria-label={`Hapus ${f.name}`}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
