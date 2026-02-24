import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { BookingFormChauffeur } from "@/components/landing/booking-form-chauffeur";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export const dynamic = "force-dynamic";

export default async function ReserverPage({
  searchParams,
}: {
  searchParams: Promise<{ chauffeur?: string }>;
}) {
  const { chauffeur: slug } = await searchParams;
  if (!slug?.trim()) {
    redirect("/#reserver");
  }

  const normalizedSlug = slug.toLowerCase().trim();
  const supabase = getSupabaseServer();

  const { data: profile, error } = await supabase
    .from("vtc_profiles")
    .select("user_id, display_name, driver_verification_status")
    .eq("slug", normalizedSlug)
    .eq("is_public", true)
    .single();

  if (error || !profile) {
    redirect("/#reserver");
  }

  const p = profile as { user_id: string; display_name: string; driver_verification_status: string | null };
  if (p.driver_verification_status !== "approved") {
    redirect(`/vtc/${normalizedSlug}`);
  }

  const driverId = p.user_id;
  const driverDisplayName = p.display_name;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <main className="flex-1 py-12 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:underline">
              ← Retour à l&apos;accueil
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            Réserver une course
          </h1>
          <p className="text-[var(--muted-foreground)] mb-8">
            Demande adressée à votre chauffeur privé
          </p>
          <BookingFormChauffeur
            driverId={driverId}
            driverDisplayName={driverDisplayName}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
