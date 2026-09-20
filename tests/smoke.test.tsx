import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import InvoiceSheet from "@/components/InvoiceSheet";
import type { Invoice } from "@/lib/invoice";

const inv: Invoice = {
  id: "1",
  number: "2026-0001",
  issueDate: "2026-09-01",
  dueDate: "2026-09-30",
  seller: {
    name: "Youssef <b>A.</b>",
    legalStatus: "auto-entrepreneur",
    ice: "001234567000089",
    identifiantFiscal: "",
    registreCommerce: "AE-1",
    address: "Rue 1",
    city: "Casablanca",
    phone: "",
    email: "",
    rib: "",
  },
  client: { name: "Client", ice: "", address: "" },
  lines: [{ id: "a", description: "Site", quantity: 2, unitPriceCentimes: 250025, vatRate: 20 }],
  notes: "",
  vatExempt: true,
  status: "paid",
};

describe("InvoiceSheet smoke", () => {
  const html = renderToStaticMarkup(createElement(InvoiceSheet, { invoice: inv }));
  it("renders number, ICE, total and amount in words", () => {
    expect(html).toContain("2026-0001");
    expect(html).toContain("ICE 001234567000089");
    expect(html).toContain("5 000,50 MAD");
    expect(html).toContain("cinq mille dirhams et cinquante centimes");
    expect(html).toContain("PAYÉE");
  });
  it("escapes user-supplied text", () => {
    expect(html).not.toContain("<b>A.</b>");
    expect(html).toContain("&lt;b&gt;");
  });
});
