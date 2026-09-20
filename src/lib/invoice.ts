// Pure invoice logic. All money is integer centimes (1 MAD = 100 centimes) to avoid float drift.

export const VAT_RATES = [0, 7, 10, 14, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

export interface Line {
  id: string;
  description: string;
  quantity: number; // may be decimal (e.g. 1.5 hours)
  unitPriceCentimes: number; // HT
  vatRate: VatRate;
}

export interface Seller {
  name: string;
  legalStatus: "auto-entrepreneur" | "sarl" | "personne-physique";
  ice: string;
  identifiantFiscal: string;
  registreCommerce: string; // RC, or auto-entrepreneur card number
  address: string;
  city: string;
  phone: string;
  email: string;
  rib: string;
}

export interface Client {
  name: string;
  ice: string; // optional for individuals
  address: string;
}

export interface Invoice {
  id: string;
  number: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;
  seller: Seller;
  client: Client;
  lines: Line[];
  notes: string;
  vatExempt: boolean; // auto-entrepreneur under the exemption: no TVA charged
  status: "draft" | "sent" | "paid";
}

export interface Totals {
  totalHt: number;
  vatByRate: { rate: number; base: number; vat: number }[];
  totalVat: number;
  totalTtc: number;
}

/** Round half away from zero to an integer. */
export function roundHalf(n: number): number {
  return Math.sign(n) * Math.round(Math.abs(n) + 1e-9);
}

export function lineHt(line: Pick<Line, "quantity" | "unitPriceCentimes">): number {
  return roundHalf(line.quantity * line.unitPriceCentimes);
}

export function computeTotals(lines: Line[], vatExempt: boolean): Totals {
  const bases = new Map<number, number>();
  let totalHt = 0;
  for (const l of lines) {
    const ht = lineHt(l);
    totalHt += ht;
    const rate = vatExempt ? 0 : l.vatRate;
    bases.set(rate, (bases.get(rate) ?? 0) + ht);
  }
  const vatByRate = [...bases.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, base]) => ({ rate, base, vat: roundHalf((base * rate) / 100) }));
  const totalVat = vatByRate.reduce((s, r) => s + r.vat, 0);
  return { totalHt, vatByRate, totalVat, totalTtc: totalHt + totalVat };
}

/** Parse a user-typed amount ("1 250,50", "1250.5") into centimes. Returns null if invalid. */
export function parseMadToCentimes(input: string): number | null {
  const s = input.replace(/[\s  ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return roundHalf(parseFloat(s) * 100);
}

export function formatMad(centimes: number): string {
  const sign = centimes < 0 ? "-" : "";
  const abs = Math.abs(centimes);
  const dh = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const c = (abs % 100).toString().padStart(2, "0");
  return `${sign}${dh},${c} MAD`;
}

/** Sequential number per year: 2026-0001. Continues from the highest number used that year. */
export function nextInvoiceNumber(existing: string[], year: number): string {
  const re = new RegExp(`^${year}-(\\d{4,})$`);
  let max = 0;
  for (const n of existing) {
    const m = re.exec(n);
    if (m) max = Math.max(max, parseInt(m[1] as string, 10));
  }
  return `${year}-${String(max + 1).padStart(4, "0")}`;
}

/** ICE = 15 digits in Morocco. */
export function isValidIce(ice: string): boolean {
  return /^\d{15}$/.test(ice);
}

export interface Problem {
  field: string;
  message: string;
}

/** Checks the mandatory mentions before an invoice is issued. */
export function validateInvoice(inv: Invoice): Problem[] {
  const p: Problem[] = [];
  const s = inv.seller;
  if (!s.name.trim())
    p.push({ field: "seller.name", message: "Nom ou raison sociale du vendeur requis" });
  if (!isValidIce(s.ice)) p.push({ field: "seller.ice", message: "ICE du vendeur : 15 chiffres" });
  if (s.legalStatus !== "auto-entrepreneur" && !s.identifiantFiscal.trim()) {
    p.push({ field: "seller.if", message: "Identifiant fiscal (IF) requis" });
  }
  if (!s.address.trim()) p.push({ field: "seller.address", message: "Adresse du vendeur requise" });
  if (!inv.client.name.trim()) p.push({ field: "client.name", message: "Nom du client requis" });
  if (inv.client.ice && !isValidIce(inv.client.ice)) {
    p.push({ field: "client.ice", message: "ICE du client : 15 chiffres (ou laisser vide)" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inv.issueDate)) {
    p.push({ field: "issueDate", message: "Date d'émission invalide" });
  }
  if (inv.dueDate && inv.dueDate < inv.issueDate) {
    p.push({ field: "dueDate", message: "L'échéance précède la date d'émission" });
  }
  if (inv.lines.length === 0) p.push({ field: "lines", message: "Ajoutez au moins une ligne" });
  inv.lines.forEach((l, i) => {
    if (!l.description.trim())
      p.push({ field: `lines.${i}.description`, message: `Ligne ${i + 1} : description requise` });
    if (!(l.quantity > 0))
      p.push({ field: `lines.${i}.quantity`, message: `Ligne ${i + 1} : quantité > 0` });
    if (!(l.unitPriceCentimes >= 0))
      p.push({ field: `lines.${i}.price`, message: `Ligne ${i + 1} : prix invalide` });
  });
  return p;
}
