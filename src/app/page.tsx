import Link from "next/link";

const sample = [
  ["Création site vitrine", "1", "4 500,00"],
  ["Hébergement 12 mois", "1", "600,00"],
];

export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <p className="font-mono text-sm text-muted">ICE · IF · RC · TVA · MAD</p>
      <div className="mt-4 grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Votre facture est prête avant la fin de votre café.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Facture.ma remplit pour vous les mentions obligatoires marocaines : ICE, identifiant
            fiscal, TVA par taux et montant arrêté en lettres. Vous exportez en PDF et vous envoyez.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="btn inline-flex items-center">
              Créer ma première facture
            </Link>
          </div>
          <ul className="mt-6 space-y-1 text-muted">
            <li>Sans compte : vos données restent dans votre navigateur.</li>
            <li>Numérotation automatique 2026-0001, 2026-0002…</li>
            <li>Exonération de TVA pour auto-entrepreneur en un clic.</li>
          </ul>
        </div>
        <div className="sheet" aria-label="Exemple de facture">
          <div className="flex justify-between">
            <strong>FACTURE 2026-0001</strong>
            <span className="font-mono text-xs">ICE 001234567000089</span>
          </div>
          <table className="mt-4">
            <thead>
              <tr>
                <th>Désignation</th>
                <th className="num">Qté</th>
                <th className="num">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {sample.map(([d, q, t]) => (
                <tr key={d}>
                  <td>{d}</td>
                  <td className="num">{q}</td>
                  <td className="num">{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="num mt-3 font-bold">Total : 5 100,00 MAD</p>
          <p className="mt-3 border-t border-dashed border-black pt-2 text-xs italic">
            Arrêtée la présente facture à la somme de : cinq mille cent dirhams.
          </p>
        </div>
      </div>
      <p className="mt-12 text-sm text-muted">
        Facture.ma est un outil d&apos;aide à la rédaction, pas un conseil fiscal. Vérifiez les
        mentions avec votre comptable.
      </p>
    </main>
  );
}
