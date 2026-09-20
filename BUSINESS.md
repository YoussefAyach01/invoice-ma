# Facture.ma: business one-pager

## Buyer

Moroccan auto-entrepreneurs (freelancers, developers, designers, artisans, coaches) and micro-businesses
who invoice in Word/Excel today. Over 400k registered auto-entrepreneurs (ANAPEC/Barid figures vary; verify).

## Problem

Correct invoices need ICE, IF, TVA handling, sequential numbers and the amount in words. People get it
wrong in Word, and clients (especially companies) reject incomplete invoices.

## Pricing

- Free: 5 invoices/month, local storage.
- Pro: 49 MAD/month (about 5 USD) or 490 MAD/year: unlimited, logo, cloud sync, client list, e-mail sending, recurring invoices, payment reminders.
- Accountant plan: 199 MAD/month (about 20 USD) for up to 20 clients.

## First 5 customers

1. Post a free-tool demo in Moroccan freelancer/auto-entrepreneur Facebook groups and r/Morocco, then ask users for feedback.
2. Offer 3 local accountants / "domiciliation" agencies a white-label link for their auto-entrepreneur clients (they charge, you get seats).
3. Partner with 2 Moroccan freelance communities (Discord/WhatsApp) and a coworking space; run a 30-minute "your first compliant invoice" session.

## Accounts needed to go live

Domain (.ma or .com), Vercel (or any static host). For the paid tier add: Postgres/Supabase (sync),
Auth provider, Stripe or a Moroccan gateway (CMI/Payzone, as Stripe is limited in Morocco), Resend for e-mail.

## Honest limits

- The MVP is local-only: no sync, no e-mail, no payments coded yet, so nothing to charge for until the Pro features exist.
- Mentions are my reading of common Moroccan practice (ICE, IF, TVA, amount in words), not verified by an accountant or the DGI. Get one review before selling.
- Auto-entrepreneur TVA exemption is offered as a checkbox, and users must confirm their own regime.
- Only French; Arabic invoice output and RTL are not built.
- Free alternatives exist (Word templates, generic invoice tools that lack ICE/IF).
