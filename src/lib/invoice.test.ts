import { describe, expect, it } from "vitest";
import {
  computeTotals,
  formatMad,
  isValidIce,
  nextInvoiceNumber,
  parseMadToCentimes,
  validateInvoice,
  type Invoice,
  type Line,
} from "./invoice";

const line = (q: number, price: number, vat: Line["vatRate"] = 20): Line => ({
  id: "x",
  description: "Prestation",
  quantity: q,
  unitPriceCentimes: price,
  vatRate: vat,
});

describe("computeTotals", () => {
  it("sums HT and applies TVA per rate", () => {
    const t = computeTotals([line(2, 10000, 20), line(1, 5000, 10)], false);
    expect(t.totalHt).toBe(25000);
    expect(t.vatByRate).toEqual([
      { rate: 10, base: 5000, vat: 500 },
      { rate: 20, base: 20000, vat: 4000 },
    ]);
    expect(t.totalTtc).toBe(29500);
  });
  it("charges no TVA when exempt (auto-entrepreneur)", () => {
    const t = computeTotals([line(1, 100000, 20)], true);
    expect(t.totalVat).toBe(0);
    expect(t.totalTtc).toBe(100000);
  });
  it("uses integer rounding on decimal quantities", () => {
    expect(computeTotals([line(1.5, 3333, 0)], false).totalHt).toBe(5000); // 4999.5 -> 5000
    expect(computeTotals([line(0.1 + 0.2, 100, 0)], false).totalHt).toBe(30);
  });
  it("returns zeros for no lines", () => {
    expect(computeTotals([], false)).toEqual({
      totalHt: 0,
      vatByRate: [],
      totalVat: 0,
      totalTtc: 0,
    });
  });
});

describe("parseMadToCentimes / formatMad", () => {
  it("parses French and English styles", () => {
    expect(parseMadToCentimes("1 250,50")).toBe(125050);
    expect(parseMadToCentimes("1250.5")).toBe(125050);
    expect(parseMadToCentimes("0")).toBe(0);
  });
  it("rejects garbage", () => {
    expect(parseMadToCentimes("")).toBeNull();
    expect(parseMadToCentimes("-5")).toBeNull();
    expect(parseMadToCentimes("1,234")).toBeNull();
    expect(parseMadToCentimes("abc")).toBeNull();
  });
  it("formats with thin-space grouping", () => {
    expect(formatMad(125050)).toBe("1 250,50 MAD");
    expect(formatMad(5)).toBe("0,05 MAD");
  });
});

describe("nextInvoiceNumber", () => {
  it("starts at 0001", () => expect(nextInvoiceNumber([], 2026)).toBe("2026-0001"));
  it("continues after the max of the same year, ignoring others", () => {
    expect(nextInvoiceNumber(["2026-0001", "2026-0009", "2025-0500", "junk"], 2026)).toBe(
      "2026-0010",
    );
  });
});

describe("isValidIce", () => {
  it("needs exactly 15 digits", () => {
    expect(isValidIce("001234567000089")).toBe(true);
    expect(isValidIce("12345")).toBe(false);
    expect(isValidIce("00123456700008a")).toBe(false);
  });
});

const good: Invoice = {
  id: "1",
  number: "2026-0001",
  issueDate: "2026-09-01",
  dueDate: "2026-09-30",
  seller: {
    name: "Youssef A.",
    legalStatus: "auto-entrepreneur",
    ice: "001234567000089",
    identifiantFiscal: "",
    registreCommerce: "",
    address: "Rue 1",
    city: "Casablanca",
    phone: "",
    email: "",
    rib: "",
  },
  client: { name: "Client SARL", ice: "", address: "" },
  lines: [line(1, 100000, 0)],
  notes: "",
  vatExempt: true,
  status: "draft",
};

describe("validateInvoice", () => {
  it("accepts a complete invoice", () => expect(validateInvoice(good)).toEqual([]));
  it("flags a bad ICE, no lines, and due before issue", () => {
    const bad = { ...good, seller: { ...good.seller, ice: "1" }, lines: [], dueDate: "2026-08-01" };
    const fields = validateInvoice(bad).map((p) => p.field);
    expect(fields).toEqual(expect.arrayContaining(["seller.ice", "lines", "dueDate"]));
  });
  it("requires IF for non auto-entrepreneur", () => {
    const sarl = { ...good, seller: { ...good.seller, legalStatus: "sarl" as const } };
    expect(validateInvoice(sarl).map((p) => p.field)).toContain("seller.if");
  });
});
