# Facture.ma (invoice-ma)

Invoice generator for Moroccan auto-entrepreneurs and small businesses. French UI, amounts in MAD,
mandatory Moroccan mentions (ICE, IF, RC / carte auto-entrepreneur, TVA per rate or exempt, amount in
words, RIB). Export to PDF through the browser print dialog.

**Local-first:** no backend and no account. Invoices and seller details live in the browser's
`localStorage`. That is the honest MVP; see `BUSINESS.md` for what a paid tier would add.

## Run

```bash
npm install
npm run dev        # http://localhost:3200
npm run typecheck && npm run lint && npm test
npm run build && npm start
```

## Structure

- `src/lib/invoice.ts` totals (integer centimes), TVA per rate, numbering, ICE and mandatory-mention checks
- `src/lib/words.ts` French amount in words ("mille deux cents dirhams et cinquante centimes")
- `src/components/Studio.tsx` editor, list, storage; `InvoiceSheet.tsx` the printable A4 sheet
- `tests/` render smoke test + a jsdom test of the create-invoice flow

## Deploy

Fully static: `vercel` (Next.js) or any static host after `next build`. Security headers (CSP, HSTS,
nosniff, referrer policy, frame-ancestors none) are set in `next.config.ts`. No env vars are required.

## Limits

- Data is per browser: clearing site data or switching device loses invoices (no export/import yet).
- PDF = browser "Save as PDF"; there is no server-side PDF.
- Not tax advice. Check mentions with an accountant.
