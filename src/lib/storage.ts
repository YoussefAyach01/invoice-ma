import type { Invoice, Seller } from "./invoice";

const KEY_INVOICES = "invoice-ma:invoices:v1";
const KEY_SELLER = "invoice-ma:seller:v1";

export const emptySeller: Seller = {
  name: "",
  legalStatus: "auto-entrepreneur",
  ice: "",
  identifiantFiscal: "",
  registreCommerce: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  rib: "",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadInvoices = () => read<Invoice[]>(KEY_INVOICES, []);
export const saveInvoices = (v: Invoice[]) => write(KEY_INVOICES, v);
export const loadSeller = () => ({ ...emptySeller, ...read<Partial<Seller>>(KEY_SELLER, {}) });
export const saveSeller = (v: Seller) => write(KEY_SELLER, v);
