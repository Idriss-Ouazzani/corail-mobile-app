/**
 * Couleurs du lancement d’app — à garder alignées avec `app.config.js` → `expo.splash.backgroundColor`
 * et l’adaptive icon Android (`backgroundColor`). Toute modification ici doit être reflétée
 * dans la config native (rebuild EAS) pour éviter un flash de couleur au démarrage.
 */
export const LAUNCH_SPLASH_BACKGROUND = '#0c4a6e';

/** Dégradé très léger autour de la même teinte « ocean » que le splash natif. */
export const LAUNCH_GRADIENT_COLORS = ['#08344e', LAUNCH_SPLASH_BACKGROUND, '#0e5f82'] as const;

export const LAUNCH_TEXT_PRIMARY = '#e2e8f0';
export const LAUNCH_TEXT_MUTED = 'rgba(226, 232, 240, 0.88)';
