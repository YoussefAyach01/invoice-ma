// Amount in French words, as printed on Moroccan invoices:
// "Arrêtée la présente facture à la somme de : mille deux cents dirhams et cinquante centimes".

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

/** 0..99. `final` = nothing follows, so "quatre-vingts" takes its s. */
function below100(n: number, final: boolean): string {
  if (n < 20) return UNITS[n] as string;
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    const ten = TENS[t] as string;
    if (u === 0) return ten;
    return u === 1 ? `${ten} et un` : `${ten}-${UNITS[u]}`;
  }
  if (n < 80) {
    const u = n - 60; // 10..19
    return u === 11 ? "soixante et onze" : `soixante-${UNITS[u]}`;
  }
  if (n === 80) return final ? "quatre-vingts" : "quatre-vingt";
  return `quatre-vingt-${UNITS[n - 80]}`;
}

/** 0..999 */
function below1000(n: number, final: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h === 0) return below100(r, final);
  const hundred = h === 1 ? "cent" : `${UNITS[h]} cent`;
  if (r === 0) return h === 1 || !final ? hundred : `${hundred}s`;
  return `${hundred} ${below100(r, final)}`;
}

export function integerToFrench(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999_999) {
    throw new RangeError("integerToFrench: expected integer in 0..999 999 999 999");
  }
  if (n === 0) return "zéro";
  const parts: string[] = [];
  const billions = Math.floor(n / 1e9);
  const millions = Math.floor((n % 1e9) / 1e6);
  const thousands = Math.floor((n % 1e6) / 1e3);
  const rest = n % 1e3;

  if (billions) parts.push(`${below1000(billions, false)} milliard${billions > 1 ? "s" : ""}`);
  if (millions) parts.push(`${below1000(millions, false)} million${millions > 1 ? "s" : ""}`);
  if (thousands) parts.push(thousands === 1 ? "mille" : `${below1000(thousands, false)} mille`);
  if (rest) parts.push(below1000(rest, true));
  return parts.join(" ");
}

/** Amount in centimes -> "mille deux cents dirhams et cinquante centimes". */
export function centimesToWords(centimes: number): string {
  if (!Number.isInteger(centimes) || centimes < 0) {
    throw new RangeError("centimes must be a non-negative integer");
  }
  const dh = Math.floor(centimes / 100);
  const c = centimes % 100;
  const dhWord = `${integerToFrench(dh)} dirham${dh > 1 ? "s" : ""}`;
  if (c === 0) return dhWord;
  return `${dhWord} et ${integerToFrench(c)} centime${c > 1 ? "s" : ""}`;
}
