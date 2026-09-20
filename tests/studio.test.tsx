// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Studio from "@/components/Studio";

// Node 25 ships its own (broken without a file) localStorage that shadows jsdom's; use a stub.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", { value: memoryStorage(), configurable: true });
});
afterEach(cleanup);

describe("Studio flow", () => {
  it("creates an invoice, computes totals and persists it", async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await user.click(screen.getByRole("button", { name: "Nouvelle facture" }));
    await user.type(screen.getByLabelText("Nom"), "Client SARL");
    await user.type(screen.getByLabelText("Ligne 1 — désignation"), "Logo");
    await user.type(screen.getByLabelText("PU HT (MAD)"), "1250,50");
    // auto-entrepreneur default => TVA exempt => TTC = HT
    expect(screen.getAllByText(/1\s250,50 MAD/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/mille deux cent cinquante dirhams et cinquante centimes/),
    ).toBeTruthy();
    const stored = JSON.parse(window.localStorage.getItem("invoice-ma:invoices:v1") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].client.name).toBe("Client SARL");
    expect(stored[0].number).toMatch(/^\d{4}-0001$/);
  });

  it("blocks export and shows errors when the ICE is missing", async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await user.click(screen.getByRole("button", { name: "Nouvelle facture" }));
    await user.click(screen.getByRole("button", { name: "Exporter en PDF" }));
    expect(screen.getByText("ICE du vendeur : 15 chiffres")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Corrigez");
  });
});
