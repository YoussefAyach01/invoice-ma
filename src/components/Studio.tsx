"use client";
import { useState } from "react";
import Link from "next/link";
import InvoiceSheet from "./InvoiceSheet";
import {
  VAT_RATES,
  computeTotals,
  formatMad,
  nextInvoiceNumber,
  parseMadToCentimes,
  validateInvoice,
  type Client,
  type Invoice,
  type Line,
  type Seller,
  type VatRate,
} from "@/lib/invoice";
import { loadInvoices, loadSeller, saveInvoices, saveSeller } from "@/lib/storage";

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID();

function newLine(): Line {
  return { id: uid(), description: "", quantity: 1, unitPriceCentimes: 0, vatRate: 20 };
}

function newInvoice(seller: Seller, all: Invoice[]): Invoice {
  const d = today();
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return {
    id: uid(),
    number: nextInvoiceNumber(
      all.map((i) => i.number),
      new Date().getFullYear(),
    ),
    issueDate: d,
    dueDate: due,
    seller,
    client: { name: "", ice: "", address: "" },
    lines: [newLine()],
    notes: "",
    vatExempt: seller.legalStatus === "auto-entrepreneur",
    status: "draft",
  };
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  inputMode?: "numeric" | "decimal" | "text";
  multiline?: boolean;
  id: string;
}) {
  const { label, value, onChange, error, type = "text", inputMode, multiline, id } = props;
  const common = {
    id,
    value,
    className: "field",
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${id}-err` : undefined,
  };
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea {...common} rows={2} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          {...common}
          type={type}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-stamp">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Studio() {
  const [seller, setSeller] = useState<Seller>(() => loadSeller());
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [showProblems, setShowProblems] = useState(false);
  const [notice, setNotice] = useState("");
  // Decided once on mount, not re-derived every render: otherwise the panel would snap shut
  // the instant the user types their first ICE digit, before they reach IF/address/RIB below.
  const [sellerPanelOpen] = useState(() => !seller.ice);

  const current = invoices.find((i) => i.id === currentId) ?? null;

  function commit(next: Invoice[]) {
    setInvoices(next);
    if (!saveInvoices(next))
      setNotice("Enregistrement local impossible (stockage du navigateur bloqué).");
  }

  function patch(p: Partial<Invoice>) {
    if (!current) return;
    commit(invoices.map((i) => (i.id === current.id ? { ...i, ...p } : i)));
  }

  // One commit per edit: two patch() calls in a row would both read the same stale `invoices`.
  function patchSeller(p: Partial<Seller>, extra: Partial<Invoice> = {}) {
    const next = { ...seller, ...p };
    setSeller(next);
    saveSeller(next);
    if (current && current.status === "draft") patch({ seller: next, ...extra });
  }

  function create() {
    const inv = newInvoice(seller, invoices);
    commit([inv, ...invoices]);
    setCurrentId(inv.id);
    setShowProblems(false);
    setTab("edit");
  }

  function remove(id: string) {
    if (!window.confirm("Supprimer cette facture ? Action définitive.")) return;
    commit(invoices.filter((i) => i.id !== id));
    if (currentId === id) setCurrentId(null);
  }

  function updateLine(id: string, p: Partial<Line>) {
    if (!current) return;
    patch({ lines: current.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  }

  function print() {
    if (!current) return;
    setShowProblems(true);
    const problems = validateInvoice(current);
    if (problems.length > 0) {
      setNotice("Corrigez les champs signalés avant d'exporter.");
      setTab("edit");
      return;
    }
    setNotice("");
    setTab("preview");
    // Let the preview render before the print dialog opens; choose "Enregistrer en PDF".
    setTimeout(() => window.print(), 100);
  }

  const problems = current && showProblems ? validateInvoice(current) : [];
  const err = (field: string) => problems.find((p) => p.field === field)?.message;

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-6">
      <header className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-lg font-bold">
          Facture<span className="text-blue">.ma</span>
        </Link>
        <button className="btn" onClick={create}>
          Nouvelle facture
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <aside className="no-print space-y-4">
          <details className="rounded-lg bg-white p-3" open={sellerPanelOpen}>
            <summary className="cursor-pointer font-semibold">Mon entreprise</summary>
            <div className="mt-3 space-y-3">
              <Field
                id="s-name"
                label="Nom ou raison sociale"
                value={seller.name}
                onChange={(v) => patchSeller({ name: v })}
                error={err("seller.name")}
              />
              <div>
                <label htmlFor="s-status" className="mb-1 block text-sm font-semibold">
                  Statut
                </label>
                <select
                  id="s-status"
                  className="field"
                  value={seller.legalStatus}
                  onChange={(e) => {
                    const legalStatus = e.target.value as Seller["legalStatus"];
                    patchSeller(
                      { legalStatus },
                      { vatExempt: legalStatus === "auto-entrepreneur" },
                    );
                  }}
                >
                  <option value="auto-entrepreneur">Auto-entrepreneur</option>
                  <option value="personne-physique">Personne physique (patente)</option>
                  <option value="sarl">Société (SARL, SA…)</option>
                </select>
              </div>
              <Field
                id="s-ice"
                label="ICE (15 chiffres)"
                inputMode="numeric"
                value={seller.ice}
                onChange={(v) => patchSeller({ ice: v.replace(/\D/g, "").slice(0, 15) })}
                error={err("seller.ice")}
              />
              <Field
                id="s-if"
                label="Identifiant fiscal (IF)"
                value={seller.identifiantFiscal}
                onChange={(v) => patchSeller({ identifiantFiscal: v })}
                error={err("seller.if")}
              />
              <Field
                id="s-rc"
                label={
                  seller.legalStatus === "auto-entrepreneur"
                    ? "N° carte auto-entrepreneur"
                    : "N° RC"
                }
                value={seller.registreCommerce}
                onChange={(v) => patchSeller({ registreCommerce: v })}
              />
              <Field
                id="s-addr"
                label="Adresse"
                multiline
                value={seller.address}
                onChange={(v) => patchSeller({ address: v })}
                error={err("seller.address")}
              />
              <Field
                id="s-city"
                label="Ville"
                value={seller.city}
                onChange={(v) => patchSeller({ city: v })}
              />
              <Field
                id="s-phone"
                label="Téléphone"
                type="tel"
                value={seller.phone}
                onChange={(v) => patchSeller({ phone: v })}
              />
              <Field
                id="s-email"
                label="E-mail"
                type="email"
                value={seller.email}
                onChange={(v) => patchSeller({ email: v })}
              />
              <Field
                id="s-rib"
                label="RIB (24 chiffres)"
                inputMode="numeric"
                value={seller.rib}
                onChange={(v) => patchSeller({ rib: v })}
              />
              <p className="text-xs text-muted">Enregistré dans ce navigateur uniquement.</p>
            </div>
          </details>

          <section aria-labelledby="list-h" className="rounded-lg bg-white p-3">
            <h2 id="list-h" className="font-semibold">
              Mes factures ({invoices.length})
            </h2>
            {invoices.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                Aucune facture. Cliquez sur « Nouvelle facture » pour commencer.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {invoices.map((i) => (
                  <li key={i.id} className="flex items-center gap-2 py-1">
                    <button
                      className="min-h-11 flex-1 text-left"
                      aria-current={i.id === currentId ? "true" : undefined}
                      onClick={() => {
                        setCurrentId(i.id);
                        setShowProblems(false);
                        setTab("edit");
                      }}
                    >
                      <span
                        className={`font-mono ${i.id === currentId ? "font-bold text-blue" : ""}`}
                      >
                        {i.number}
                      </span>{" "}
                      <span className="text-sm text-muted">
                        {i.client.name || "sans client"} ·{" "}
                        {formatMad(computeTotals(i.lines, i.vatExempt).totalTtc)}
                        {i.status === "paid" ? " · payée" : ""}
                      </span>
                    </button>
                    <button
                      className="btn btn-danger min-h-11 px-3"
                      onClick={() => remove(i.id)}
                      aria-label={`Supprimer la facture ${i.number}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <div>
          {!current ? (
            <p className="no-print rounded-lg bg-white p-6">
              Sélectionnez une facture ou créez-en une nouvelle.
            </p>
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Affichage"
                className="no-print mb-3 flex gap-2 lg:hidden"
              >
                {(["edit", "preview"] as const).map((k) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={tab === k}
                    className={`btn flex-1 ${tab === k ? "" : "btn-ghost"}`}
                    onClick={() => setTab(k)}
                  >
                    {k === "edit" ? "Modifier" : "Aperçu"}
                  </button>
                ))}
              </div>
              {notice && (
                <p
                  role="status"
                  className="no-print mb-3 rounded-md border border-stamp bg-white p-3 text-stamp"
                >
                  {notice}
                </p>
              )}
              <div className="grid gap-4 xl:grid-cols-2">
                <form
                  className={`no-print space-y-4 rounded-lg bg-white p-3 ${tab === "edit" ? "" : "hidden lg:block"}`}
                  onSubmit={(e) => e.preventDefault()}
                  noValidate
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      id="i-num"
                      label="N° de facture"
                      value={current.number}
                      onChange={(v) => patch({ number: v })}
                    />
                    <div>
                      <label htmlFor="i-status" className="mb-1 block text-sm font-semibold">
                        Statut
                      </label>
                      <select
                        id="i-status"
                        className="field"
                        value={current.status}
                        onChange={(e) => patch({ status: e.target.value as Invoice["status"] })}
                      >
                        <option value="draft">Brouillon</option>
                        <option value="sent">Envoyée</option>
                        <option value="paid">Payée</option>
                      </select>
                    </div>
                    <Field
                      id="i-date"
                      type="date"
                      label="Date d'émission"
                      value={current.issueDate}
                      onChange={(v) => patch({ issueDate: v })}
                      error={err("issueDate")}
                    />
                    <Field
                      id="i-due"
                      type="date"
                      label="Échéance"
                      value={current.dueDate}
                      onChange={(v) => patch({ dueDate: v })}
                      error={err("dueDate")}
                    />
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="font-semibold">Client</legend>
                    <Field
                      id="c-name"
                      label="Nom"
                      value={current.client.name}
                      onChange={(v) => patch({ client: { ...current.client, name: v } as Client })}
                      error={err("client.name")}
                    />
                    <Field
                      id="c-ice"
                      label="ICE du client (si société)"
                      inputMode="numeric"
                      value={current.client.ice}
                      onChange={(v) =>
                        patch({
                          client: { ...current.client, ice: v.replace(/\D/g, "").slice(0, 15) },
                        })
                      }
                      error={err("client.ice")}
                    />
                    <Field
                      id="c-addr"
                      label="Adresse"
                      multiline
                      value={current.client.address}
                      onChange={(v) => patch({ client: { ...current.client, address: v } })}
                    />
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="font-semibold">Lignes</legend>
                    <label className="flex min-h-11 items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-5"
                        checked={current.vatExempt}
                        onChange={(e) => patch({ vatExempt: e.target.checked })}
                      />
                      Exonéré de TVA (auto-entrepreneur)
                    </label>
                    {err("lines") && <p className="text-sm text-stamp">{err("lines")}</p>}
                    {current.lines.map((l, idx) => (
                      <LineEditor
                        key={l.id}
                        line={l}
                        index={idx}
                        vatExempt={current.vatExempt}
                        problems={problems}
                        onChange={(p) => updateLine(l.id, p)}
                        onRemove={() =>
                          patch({ lines: current.lines.filter((x) => x.id !== l.id) })
                        }
                      />
                    ))}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => patch({ lines: [...current.lines, newLine()] })}
                    >
                      Ajouter une ligne
                    </button>
                  </fieldset>

                  <Field
                    id="i-notes"
                    label="Notes (conditions de paiement, pénalités…)"
                    multiline
                    value={current.notes}
                    onChange={(v) => patch({ notes: v })}
                  />
                  <button type="button" className="btn w-full" onClick={print}>
                    Exporter en PDF
                  </button>
                  <p className="text-xs text-muted">
                    Dans la fenêtre d&apos;impression, choisissez « Enregistrer au format PDF ».
                  </p>
                </form>

                <div className={tab === "preview" ? "" : "hidden lg:block"}>
                  <InvoiceSheet invoice={current} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LineEditor(props: {
  line: Line;
  index: number;
  vatExempt: boolean;
  problems: { field: string; message: string }[];
  onChange: (p: Partial<Line>) => void;
  onRemove: () => void;
}) {
  const { line, index, vatExempt, problems, onChange, onRemove } = props;
  const [price, setPrice] = useState(() =>
    line.unitPriceCentimes ? (line.unitPriceCentimes / 100).toFixed(2).replace(".", ",") : "",
  );
  const [qty, setQty] = useState(String(line.quantity));
  const n = index + 1;
  const e = (f: string) => problems.find((p) => p.field === `lines.${index}.${f}`)?.message;
  const priceBad = price !== "" && parseMadToCentimes(price) === null;
  return (
    <div className="space-y-2 rounded-md border border-line p-2">
      <Field
        id={`l${n}-d`}
        label={`Ligne ${n} — désignation`}
        value={line.description}
        onChange={(v) => onChange({ description: v })}
        error={e("description")}
      />
      <div className="grid grid-cols-3 gap-2">
        <Field
          id={`l${n}-q`}
          label="Qté"
          inputMode="decimal"
          value={qty}
          onChange={(v) => {
            setQty(v);
            const q = parseFloat(v.replace(",", "."));
            onChange({ quantity: Number.isFinite(q) ? q : 0 });
          }}
          error={e("quantity")}
        />
        <Field
          id={`l${n}-p`}
          label="PU HT (MAD)"
          inputMode="decimal"
          value={price}
          onChange={(v) => {
            setPrice(v);
            onChange({ unitPriceCentimes: parseMadToCentimes(v) ?? 0 });
          }}
          error={priceBad ? "Format : 1250,50" : undefined}
        />
        <div>
          <label htmlFor={`l${n}-v`} className="mb-1 block text-sm font-semibold">
            TVA
          </label>
          <select
            id={`l${n}-v`}
            className="field"
            disabled={vatExempt}
            value={vatExempt ? 0 : line.vatRate}
            onChange={(ev) => onChange({ vatRate: Number(ev.target.value) as VatRate })}
          >
            {VAT_RATES.map((r) => (
              <option key={r} value={r}>
                {r} %
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-danger"
        onClick={onRemove}
        aria-label={`Supprimer la ligne ${n}`}
      >
        Supprimer la ligne
      </button>
    </div>
  );
}
