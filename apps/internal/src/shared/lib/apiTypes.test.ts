import { describe, it, expect } from "vitest";
import { getErrorMessage, toPaged } from "./apiTypes";

describe("getErrorMessage", () => {
  // Bentuk dari middleware auth (middleware/auth.go): error = string
  it("error string (middleware auth: 401/403)", () => {
    expect(getErrorMessage({ error: "tidak memiliki akses" }, "fallback")).toBe(
      "tidak memiliki akses"
    );
    expect(getErrorMessage({ error: "missing or invalid token" }, "fallback")).toBe(
      "missing or invalid token"
    );
  });

  // Bentuk dari error middleware (middleware/error_middleware.go): error = string[]
  it("error array (validasi binding)", () => {
    expect(getErrorMessage({ error: ["email atau password salah"] }, "fallback")).toBe(
      "email atau password salah"
    );
    expect(
      getErrorMessage({ error: ["email wajib diisi", "password wajib diisi"] }, "fallback")
    ).toBe("email wajib diisi, password wajib diisi");
  });

  it("array kosong → jatuh ke message lalu fallback", () => {
    expect(getErrorMessage({ error: [], message: "ada message" }, "fallback")).toBe("ada message");
    expect(getErrorMessage({ error: [] }, "fallback")).toBe("fallback");
  });

  it("tanpa error → pakai message", () => {
    expect(getErrorMessage({ message: "sukses tapi aneh" }, "fallback")).toBe("sukses tapi aneh");
  });

  it("envelope kosong / undefined → fallback (mis. network error)", () => {
    expect(getErrorMessage({}, "Network Error")).toBe("Network Error");
    expect(getErrorMessage(undefined, "Network Error")).toBe("Network Error");
  });
});

describe("toPaged", () => {
  it("envelope list lengkap", () => {
    expect(
      toPaged({ data: [1, 2], current_page: 2, total_page: 5, total_item: 42, current_item: 2 })
    ).toEqual({ items: [1, 2], page: 2, totalPages: 5, totalItems: 42 });
  });

  it("field pagination omitempty (hilang) → default aman", () => {
    expect(toPaged({ data: [1, 2, 3] })).toEqual({
      items: [1, 2, 3],
      page: 1,
      totalPages: 1,
      totalItems: 3,
    });
    expect(toPaged({})).toEqual({ items: [], page: 1, totalPages: 1, totalItems: 0 });
  });
});
