import Link from "next/link";

export default function VtcProfileNotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-4">
      <h1 className="text-xl font-semibold mb-2">Profil introuvable</h1>
      <p className="text-[var(--muted-foreground)] text-center mb-6">
        Ce chauffeur n’existe pas ou son profil n’est pas public.
      </p>
      <Link
        href="https://getcorail.com"
        className="text-[var(--primary)] hover:underline"
      >
        Retour à getcorail.com
      </Link>
    </div>
  );
}
