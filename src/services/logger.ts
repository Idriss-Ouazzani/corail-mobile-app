/**
 * Logger Service avec Sentry
 * 
 * Remplace console.log/error par un système de logging structuré
 * Envoie automatiquement les erreurs à Sentry en production
 */

import * as Sentry from '@sentry/react-native';

/**
 * Type de log
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Context additionnel pour les logs
 */
interface LogContext {
  [key: string]: any;
}

/**
 * Logger Service
 */
export const logger = {
  /**
   * 🐛 Debug - Développement uniquement
   */
  debug: (message: string, context?: LogContext) => {
    if (__DEV__) {
      console.log(`🐛 DEBUG: ${message}`, context || '');
    }
    
    // Breadcrumb Sentry (pour contexte)
    Sentry.addBreadcrumb({
      message,
      level: 'debug',
      data: context,
    });
  },

  /**
   * ℹ️ Info - Information générale
   */
  info: (message: string, context?: LogContext) => {
    if (__DEV__) {
      console.log(`ℹ️ INFO: ${message}`, context || '');
    }
    
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
    });
  },

  /**
   * ⚠️ Warning - Avertissement
   */
  warn: (message: string, context?: LogContext) => {
    if (__DEV__) {
      console.warn(`⚠️ WARN: ${message}`, context || '');
    }
    
    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: context,
    });
    
    // Capturer le warning dans Sentry (prod uniquement)
    if (!__DEV__) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  },

  /**
   * ❌ Error - Erreur capturée
   */
  error: (message: string, error?: Error | any, context?: LogContext) => {
    if (__DEV__) {
      console.error(`❌ ERROR: ${message}`, error, context || '');
    }
    
    // Capturer l'erreur dans Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: {
          message,
          ...context,
        },
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: {
          error,
          ...context,
        },
      });
    }
  },

  /**
   * 💀 Fatal - Erreur fatale (crash)
   */
  fatal: (message: string, error: Error, context?: LogContext) => {
    if (__DEV__) {
      console.error(`💀 FATAL: ${message}`, error, context || '');
    }
    
    Sentry.captureException(error, {
      level: 'fatal',
      extra: {
        message,
        ...context,
      },
    });
  },

  /**
   * 🎯 Event - Événement métier
   */
  event: (eventName: string, properties?: LogContext) => {
    if (__DEV__) {
      console.log(`🎯 EVENT: ${eventName}`, properties || '');
    }
    
    Sentry.addBreadcrumb({
      message: eventName,
      level: 'info',
      data: properties,
      category: 'event',
    });
  },

  /**
   * 👤 User - Définir l'utilisateur courant
   */
  setUser: (userId: string, email?: string, username?: string) => {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  },

  /**
   * 🧹 Clear user
   */
  clearUser: () => {
    Sentry.setUser(null);
  },

  /**
   * 🏷️ Tag - Ajouter un tag pour filtrer dans Sentry
   */
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },

  /**
   * 📝 Context - Ajouter du contexte global
   */
  setContext: (key: string, context: LogContext) => {
    Sentry.setContext(key, context);
  },
};

export default logger;

