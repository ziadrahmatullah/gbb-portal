import { describe, expect, it } from "vitest";
import { singkatNominal } from "./nominal";

describe("singkatNominal", () => {
  it("di bawah seribu tetap apa adanya", () => {
    expect(singkatNominal(0)).toBe("0");
    expect(singkatNominal(850)).toBe("850");
    expect(singkatNominal(999)).toBe("999");
  });

  it("ribu memakai k", () => {
    expect(singkatNominal(1_000)).toBe("1k");
    expect(singkatNominal(1_500)).toBe("1,5k");
    expect(singkatNominal(100_000)).toBe("100k");
  });

  it("juta memakai jt, BUKAN M", () => {
    expect(singkatNominal(1_000_000)).toBe("1jt");
    expect(singkatNominal(1_500_000)).toBe("1,5jt");
    expect(singkatNominal(800_000_000)).toBe("800jt");
  });

  it("miliar memakai M — konvensi Indonesia, bukan million", () => {
    expect(singkatNominal(1_000_000_000)).toBe("1M");
    expect(singkatNominal(2_500_000_000)).toBe("2,5M");
  });

  it("triliun memakai T", () => {
    expect(singkatNominal(1_000_000_000_000)).toBe("1T");
    expect(singkatNominal(1_200_000_000_000)).toBe("1,2T");
  });

  it("pembulatan yang menyentuh 1000 dinaikkan ke satuan berikutnya", () => {
    expect(singkatNominal(999_999)).toBe("1jt");
    expect(singkatNominal(999_999_999)).toBe("1M");
  });

  it("nilai negatif tetap tersingkat", () => {
    expect(singkatNominal(-1_500_000)).toBe("-1,5jt");
  });
});
