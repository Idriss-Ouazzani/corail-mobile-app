/**
 * Thème centralisé Corail VTC
 * Une seule source de vérité pour couleurs, espacements et rayons.
 * Utiliser partout : import { theme } from '../theme';
 */

export const theme = {
  colors: {
    // Arrière-plans
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#334155',

    // Bordures
    border: '#334155',
    borderLight: 'rgba(255, 255, 255, 0.08)',
    borderMuted: 'rgba(51, 65, 85, 0.6)',

    // Texte
    text: '#f8fafc',
    textSecondary: '#e2e8f0',
    textSoft: '#cbd5e1',
    textMuted: '#94a3b8',
    textMutedDark: '#64748b',

    // Primaire (orange Corail)
    primary: '#ff6b47',
    primaryLight: 'rgba(255, 107, 71, 0.15)',
    primaryBorder: 'rgba(255, 107, 71, 0.4)',
    primaryShadow: 'rgba(255, 107, 71, 0.3)',

    // Accent (indigo - liens, CGU, consentement)
    accent: '#6366f1',
    accentLight: '#818cf8',
    accentBg: 'rgba(99, 102, 241, 0.1)',
    accentBgStrong: 'rgba(99, 102, 241, 0.2)',
    accentBgHero: 'rgba(99, 102, 241, 0.35)',
    accentIcon: '#c7d2fe',

    // Succès
    success: '#10b981',
    successLight: '#34d399',
    successBg: 'rgba(16, 185, 129, 0.12)',
    successBorder: 'rgba(16, 185, 129, 0.25)',
    successIconBg: 'rgba(16, 185, 129, 0.2)',

    // Erreur / danger
    error: '#ef4444',
    errorLight: '#f87171',
    errorBg: 'rgba(239, 68, 68, 0.08)',
    errorBorder: 'rgba(239, 68, 68, 0.25)',

    // Warning / amber
    warning: '#fbbf24',
    warningOrange: '#fb923c',
    warningBg: 'rgba(251, 191, 36, 0.2)',
    warningBorder: 'rgba(251, 191, 36, 0.3)',

    // Info / cyan
    info: '#0ea5e9',
    infoCyan: '#06b6d4',
    infoBg: 'rgba(14, 165, 233, 0.4)',
    infoBgSoft: 'rgba(14, 165, 233, 0.15)',

    // Overlays
    overlay: 'rgba(15, 23, 42, 0.72)',
    overlayLight: 'rgba(15, 23, 42, 0.75)',
    overlayStrong: 'rgba(15, 23, 42, 0.78)',
    overlayDark: 'rgba(0, 0, 0, 0.7)',

    // Neutres
    white: '#fff',
    black: '#000',
    transparent: 'transparent',

    // Désactivé / secondaire UI
    disabled: '#64748b',
    disabledBg: '#475569',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    cardBgSubtle: 'rgba(255, 255, 255, 0.03)',
    cardBgSubtleStrong: 'rgba(255, 255, 255, 0.05)',
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  radii: {
    xs: 8,
    sm: 12,
    md: 14,
    lg: 18,
    xl: 20,
    full: 9999,
  },

  typography: {
    caption: 12,
    body: 14,
    bodyLarge: 15,
    subhead: 16,
    title: 18,
    titleLarge: 20,
    headline: 22,
    display: 26,
  },
} as const;

export type Theme = typeof theme;
