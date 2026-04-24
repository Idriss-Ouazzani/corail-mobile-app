/**
 * Formatage téléphone FR : 10 chiffres avec espace tous les 2 chiffres.
 * Ex: "0612345678" → "06 12 34 56 78"
 */

const MAX_DIGITS = 10;

/** Affiche le numéro avec espaces tous les 2 chiffres, max 10 chiffres */
export function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, MAX_DIGITS);
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/** À appeler dans onChangeText : retourne la valeur formatée à mettre dans le state */
export function formatPhoneInput(nextValue: string): string {
  return formatPhoneDisplay(nextValue);
}

/** Retourne uniquement les chiffres pour envoi API / tel: / wa */
export function formatPhoneForSubmit(displayValue: string): string {
  return displayValue.replace(/\D/g, '');
}

/** Chiffres uniquement (comparaisons / index) */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Normalise un mobile FR vers 10 chiffres nationaux 0XXXXXXXXX (ex. 0612345678).
 */
export function toFrenchNational10(input: string): string | null {
  const d = digitsOnly(input);
  if (d.length === 10 && d.startsWith('0')) return d;
  if (d.length === 9 && d.startsWith('6')) return `0${d}`;
  if (d.length >= 11 && d.startsWith('33')) return `0${d.slice(2)}`;
  return null;
}

/**
 * Variantes de chaînes à tester pour matcher users.phone ou group_invitations.invitee_phone.
 */
export function frenchPhoneEqualityVariants(input: string): string[] {
  const raw = input.trim();
  const out = new Set<string>();
  if (raw) out.add(raw);
  const national = toFrenchNational10(raw);
  if (national) {
    out.add(national);
    out.add(national.replace(/^0/, '+33'));
    out.add(`33${national.slice(1)}`);
    out.add(national.slice(1));
  }
  const d = digitsOnly(raw);
  if (d) out.add(d);
  return [...out].filter(Boolean);
}

/** True si deux numéros (formats hétérogènes) désignent le même mobile FR. */
export function phonesOverlap(a: string, b: string): boolean {
  const as = new Set(frenchPhoneEqualityVariants(a));
  const bs = new Set(frenchPhoneEqualityVariants(b));
  for (const x of as) {
    if (bs.has(x)) return true;
  }
  return false;
}
