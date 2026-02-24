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
