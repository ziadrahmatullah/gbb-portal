import { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/shared/store/useUIStore";

// Google Identity Services (GIS) — tombol resmi "Sign in with Google".
// Client ID bukan rahasia (identifier publik), aman berada di bundle FE.
const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (res: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

// Script GIS dimuat sekali saja walau komponen re-mount
let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiPromise = null;
      reject(new Error("Gagal memuat Google Sign-In"));
    };
    document.head.appendChild(script);
  });
  return gsiPromise;
}

export function GoogleLoginButton({
  onCredential,
  disabled,
}: {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const isDark = useUIStore((s) => s.isDark);

  // Callback disimpan di ref — GIS memegang referensi lama bila di-pass langsung
  const callbackRef = useRef(onCredential);
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        const el = containerRef.current;
        if (cancelled || !el || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res) => {
            if (res.credential) callbackRef.current(res.credential);
          },
        });
        el.replaceChildren();
        window.google.accounts.id.renderButton(el, {
          type: "standard",
          theme: isDark ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          logo_alignment: "center",
          locale: "id",
          width: Math.min(el.clientWidth || 320, 400),
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [isDark]);

  // Tanpa VITE_GOOGLE_CLIENT_ID tombol tidak dirender — login email/password
  // tetap berfungsi seperti biasa
  if (!CLIENT_ID) return null;

  if (failed) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Google Sign-In tidak dapat dimuat. Gunakan email &amp; password.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      // GIS merender iframe sendiri; saat proses login berjalan tombol
      // dinonaktifkan secara visual + pointer-events
      className={disabled ? "pointer-events-none flex justify-center opacity-60" : "flex justify-center"}
    />
  );
}
