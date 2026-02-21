/**
 * Utilitaires pour formater les dates avec le bon timezone
 * IMPORTANT : Ne jamais utiliser toISOString() directement pour les dates de courses
 * car cela convertit en UTC et perd l'heure locale sélectionnée par l'utilisateur.
 */

/**
 * Formate une Date en ISO 8601 avec le timezone local
 * Ex: 2025-01-21T14:30:00+01:00 (France)
 * 
 * À utiliser pour envoyer des dates à Supabase (timestamptz)
 */
export function formatDateWithLocalTimezone(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Calculer l'offset timezone (ex: +01:00 pour la France en hiver, +02:00 en été)
  const tzOffset = -date.getTimezoneOffset();
  const offsetSign = tzOffset >= 0 ? '+' : '-';
  const offsetHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
  
  // Format ISO 8601 avec timezone : 2025-01-21T14:30:00+01:00
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

/**
 * Formate une Date pour l'affichage en français
 * Ex: "Lun 21 Jan 2025, 14h30"
 */
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate une Date pour l'affichage court
 * Ex: "Lun 21 Jan"
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
  });
}

/**
 * Formate une heure pour l'affichage
 * Ex: "14h30"
 */
export function formatTimeDisplay(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
  });
}

