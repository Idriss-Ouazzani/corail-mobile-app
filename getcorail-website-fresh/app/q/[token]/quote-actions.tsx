"use client";

/**
 * Accepter / Refuser le devis.
 * Utilise des formulaires HTML (method="POST") pour fonctionner même sans JavaScript.
 * L’API redirige vers cette page après traitement ; le statut ou l’erreur vient de l’URL.
 */

export type QuoteActionsProps = {
  token: string;
  status: string;
  isProcessed: boolean;
  urlError?: string | null;
};

type Props = QuoteActionsProps;

export function QuoteActions({ token, status, isProcessed, urlError }: Props) {
  if (status === "ACCEPTED") {
    return null; /* Statut déjà affiché en badge en haut de page */
  }

  if (status === "REFUSED") {
    return null; /* Statut déjà affiché en badge en haut de page */
  }

  const acceptPath = `/api/quotes/${encodeURIComponent(token)}/accept`;
  const refusePath = `/api/quotes/${encodeURIComponent(token)}/refuse`;

  return (
    <div className="space-y-3">
      {urlError && (
        <div className="p-2.5 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-xs">
          {urlError}
        </div>
      )}
      <div className="flex gap-2">
        <form method="POST" action={acceptPath} className="flex-1">
          <button
            type="submit"
            className="w-full py-2.5 px-3 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          >
            Accepter
          </button>
        </form>
        <form method="POST" action={refusePath} className="flex-1">
          <button
            type="submit"
            className="w-full py-2.5 px-3 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
          >
            Refuser
          </button>
        </form>
      </div>
      <p className="text-[10px] text-[var(--muted-foreground)]">
        En cliquant, la page se recharge après envoi.
      </p>
    </div>
  );
}
