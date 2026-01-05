/**
 * Formatte un nom en capitalisant la première lettre de chaque mot
 * 
 * @param name - Le nom à formater
 * @returns Le nom formaté
 * 
 * @example
 * formatName("jean dupont") // "Jean Dupont"
 * formatName("MARIE MARTIN") // "Marie Martin"
 * formatName("") // ""
 */
export const formatName = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

