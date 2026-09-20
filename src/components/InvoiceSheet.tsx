import { centimesToWords } from "@/lib/words";
import { computeTotals, formatMad, lineHt, type Invoice } from "@/lib/invoice";

const fr = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "");

const STATUS_LABEL = { draft: "", sent: "", paid: "PAYÉE" } as const;

export default function InvoiceSheet({ invoice }: { invoice: Invoice }) {
  const { seller: s, client: c } = invoice;
  const t = computeTotals(invoice.lines, invoice.vatExempt);
  const idLine = [
    s.ice && `ICE ${s.ice}`,
    s.identifiantFiscal && `IF ${s.identifiantFiscal}`,
    s.registreCommerce &&
      `${s.legalStatus === "auto-entrepreneur" ? "AE" : "RC"} ${s.registreCommerce}`,
  ].filter(Boolean);

  return (
    <article className="sheet" aria-label={`Facture ${invoice.number}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold">{s.name || "Votre nom / raison sociale"}</p>
          <p className="whitespace-pre-line">{s.address}</p>
          <p>{s.city}</p>
          {(s.phone || s.email) && <p>{[s.phone, s.email].filter(Boolean).join(" · ")}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold tracking-wide">FACTURE</h2>
          <p className="font-mono">N° {invoice.number}</p>
          <p>Date : {fr(invoice.issueDate)}</p>
          {invoice.dueDate && <p>Échéance : {fr(invoice.dueDate)}</p>}
          {STATUS_LABEL[invoice.status] && (
            <p className="mt-1 inline-block -rotate-3 border-2 border-[#a4231b] px-2 py-0.5 font-bold tracking-widest text-[#a4231b]">
              {STATUS_LABEL[invoice.status]}
            </p>
          )}
        </div>
      </header>

      {idLine.length > 0 && (
        <p className="mt-3 border-y border-black py-1 font-mono text-xs">{idLine.join("  |  ")}</p>
      )}

      <section className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider">Facturé à</p>
        <p className="font-bold">{c.name || "Nom du client"}</p>
        <p className="whitespace-pre-line">{c.address}</p>
        {c.ice && <p className="font-mono text-xs">ICE {c.ice}</p>}
      </section>

      <table className="mt-5">
        <thead>
          <tr>
            <th>Désignation</th>
            <th className="num">Qté</th>
            <th className="num">PU HT</th>
            {!invoice.vatExempt && <th className="num">TVA</th>}
            <th className="num">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l) => (
            <tr key={l.id}>
              <td>{l.description}</td>
              <td className="num">{l.quantity}</td>
              <td className="num">{formatMad(l.unitPriceCentimes)}</td>
              {!invoice.vatExempt && <td className="num">{l.vatRate} %</td>}
              <td className="num">{formatMad(lineHt(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-full max-w-72 space-y-1">
        <div className="flex justify-between">
          <dt>Total HT</dt>
          <dd className="num">{formatMad(t.totalHt)}</dd>
        </div>
        {!invoice.vatExempt &&
          t.vatByRate
            .filter((r) => r.rate > 0)
            .map((r) => (
              <div key={r.rate} className="flex justify-between">
                <dt>TVA {r.rate} %</dt>
                <dd className="num">{formatMad(r.vat)}</dd>
              </div>
            ))}
        <div className="flex justify-between border-t-2 border-black pt-1 text-base font-bold">
          <dt>Total TTC</dt>
          <dd className="num">{formatMad(t.totalTtc)}</dd>
        </div>
      </dl>

      {invoice.vatExempt && (
        <p className="mt-3 text-xs">TVA non applicable — auto-entrepreneur exonéré de TVA.</p>
      )}

      <p className="mt-5 border-t border-dashed border-black pt-2 italic">
        Arrêtée la présente facture à la somme de : {centimesToWords(t.totalTtc)}.
      </p>

      {s.rib && (
        <p className="mt-3">
          Règlement par virement — RIB : <span className="font-mono">{s.rib}</span>
        </p>
      )}
      {invoice.notes && <p className="mt-3 whitespace-pre-line text-xs">{invoice.notes}</p>}
    </article>
  );
}
