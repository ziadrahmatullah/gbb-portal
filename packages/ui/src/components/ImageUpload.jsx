import { useState, useRef, useCallback } from "react";
import { ImageIcon, X } from "lucide-react";
import { cn } from "../lib/utils.js";

/**
 * ImageUpload — local file drag-and-drop / browse.
 * Files are converted to base64 data URLs so no server upload is needed.
 *
 * Props:
 *   value    : string  — current base64 data URL
 *   onChange : (val: string) => void
 *   previewClass : extra class for the preview container (default: "h-36")
 */
export function ImageUpload({ value, onChange, previewClass = "h-36" }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => onChange(e.target.result);
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    processFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drag-and-drop zone — shown only when no image selected */}
      {!value && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors select-none",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <ImageIcon className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop, or{" "}
            <span className="text-primary font-medium">click to browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF, WebP</p>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className={cn("relative rounded-lg overflow-hidden bg-muted w-full", previewClass)}>
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded hover:bg-black/80 transition-colors"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}
