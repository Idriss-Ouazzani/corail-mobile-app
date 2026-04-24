import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import Link from "next/link";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isAdminAuthenticated();
  if (!ok) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]/98 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2.5">
              <img src="/images/corail-logo.png" alt="Corail" className="h-20 w-auto object-contain" />
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Admin
              </span>
            </Link>
            <span className="h-5 w-px bg-[var(--border)]" aria-hidden />
            <nav className="flex gap-0.5">
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]/40 hover:text-[var(--foreground)]"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/chauffeurs"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]/40 hover:text-[var(--foreground)]"
              >
                Chauffeurs
              </Link>
              <Link
                href="/admin/demandes-certif"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]/40 hover:text-[var(--foreground)]"
              >
                Demandes en cours
              </Link>
            </nav>
          </div>
          <form action="/admin/api/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--foreground)]/20 hover:bg-[var(--muted)]/30 hover:text-[var(--foreground)]"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
