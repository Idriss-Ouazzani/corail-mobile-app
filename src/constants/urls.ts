/**
 * URL de base du site web Corail (devis, factures, pages publiques).
 * Tout est hébergé sur le domaine pro getcorail.com.
 */
export const WEB_APP_BASE_URL = 'https://getcorail.com';

/**
 * Lien public App Store (iOS) — partages invitation, messages, etc.
 * @see https://apps.apple.com/fr/app/corail/id6759494730
 */
export const CORAIL_IOS_APP_STORE_URL = 'https://apps.apple.com/fr/app/corail/id6759494730';

export const getQuoteUrl = (token: string) => `${WEB_APP_BASE_URL}/q/${token}`;
export const getVtcProfileUrl = (slug: string) => `${WEB_APP_BASE_URL}/vtc/${slug.toLowerCase()}`;
export const getInvoiceUrl = (publicToken: string) => `${WEB_APP_BASE_URL}/invoice/${publicToken}`;
export const getInvoicePdfUrl = (publicToken: string) => `${WEB_APP_BASE_URL}/api/invoice/${publicToken}/pdf`;
