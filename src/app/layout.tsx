import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Facture.ma — factures pour auto-entrepreneurs marocains",
  description:
    "Créez des factures conformes (ICE, IF, TVA, montant en lettres) en dirhams et exportez-les en PDF. Gratuit, sans compte, vos données restent dans votre navigateur.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a
          href="#main"
          className="no-print sr-only focus:not-sr-only focus:absolute focus:m-2 focus:bg-white focus:p-2"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
