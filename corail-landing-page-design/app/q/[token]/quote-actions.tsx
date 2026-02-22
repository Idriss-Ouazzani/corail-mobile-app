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
    return (
      <div className="mt-6 p-4 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30">
        <p className="font-medium">Ce devis a été accepté.</p>
      </div>
    );
  }

  if (status === "REFUSED") {
    return (
      <div className="mt-6 p-4 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
        <p className="font-medium">Ce devis a été refusé.</p>
      </div>
    );
  }

  const acceptPath = `/api/quotes/${encodeURIComponent(token)}/accept`;
  const refusePath = `/api/quotes/${encodeURIComponent(token)}/refuse`;

  return (
    <div className="mt-6 space-y-3">
      {urlError && (
        <div className="p-3 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-sm">
          {urlError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <form method="POST" action={acceptPath} className="flex-1">
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          >
            Accepter le devis
          </button>
        </form>
        <form method="POST" action={refusePath} className="flex-1">
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
          >
            Refuser
          </button>
        </form>
      </div>
      <p className="text-xs text-[var(--muted-foreground)] mt-2">
        Version formulaire · En cliquant, la page se recharge après envoi.
      </p>
    </div>
  );
}
