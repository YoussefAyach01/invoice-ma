import { describe, expect, it } from "vitest";
import { centimesToWords, integerToFrench } from "./words";

describe("integerToFrench", () => {
  it.each([
    [0, "zéro"],
    [1, "un"],
    [21, "vingt et un"],
    [22, "vingt-deux"],
    [71, "soixante et onze"],
    [77, "soixante-dix-sept"],
    [80, "quatre-vingts"],
    [81, "quatre-vingt-un"],
    [91, "quatre-vingt-onze"],
    [100, "cent"],
    [101, "cent un"],
    [200, "deux cents"],
    [280, "deux cent quatre-vingts"],
    [1000, "mille"],
    [1200, "mille deux cents"],
    [2000, "deux mille"],
    [80000, "quatre-vingt mille"],
    [200000, "deux cent mille"],
    [1_000_000, "un million"],
    [2_500_000, "deux millions cinq cent mille"],
    [1_000_000_000, "un milliard"],
  ])("%i -> %s", (n, expected) => {
    expect(integerToFrench(n)).toBe(expected);
  });

  it("rejects negatives and fractions", () => {
    expect(() => integerToFrench(-1)).toThrow(RangeError);
    expect(() => integerToFrench(1.5)).toThrow(RangeError);
  });
});

describe("centimesToWords", () => {
  it("handles whole dirhams", () => {
    expect(centimesToWords(120000)).toBe("mille deux cents dirhams");
    expect(centimesToWords(100)).toBe("un dirham");
  });
  it("adds centimes", () => {
    expect(centimesToWords(120050)).toBe("mille deux cents dirhams et cinquante centimes");
    expect(centimesToWords(101)).toBe("un dirham et un centime");
  });
  it("handles less than one dirham", () => {
    expect(centimesToWords(0)).toBe("zéro dirham");
    expect(centimesToWords(5)).toBe("zéro dirham et cinq centimes");
  });
});
