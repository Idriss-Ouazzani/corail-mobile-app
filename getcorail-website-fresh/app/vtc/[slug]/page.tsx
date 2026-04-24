import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { VtcProfileActions } from "./vtc-profile-actions";

const DEFAULT_PAGE_COVER =
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=85";

type VtcProfile = {
  user_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
  page_cover_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  services: string[] | null;
  zone_city: string | null;
  zone_radius_km: number | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_seats: number | null;
  driver_verification_status: string | null;
  siret: string | null;
};

type DriverInfo = {
  full_name: string | null;
  company_name: string | null;
  professional_card_number: string | null;
  vtc_card_number: string | null;
};

export const dynamic = "force-dynamic";

export default async function VtcProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase().trim();
  const supabase = getSupabaseServer();

  const { data: profile, error } = await supabase
    .from("vtc_profiles")
    .select("user_id, slug, display_name, bio, photo_url, page_cover_url, phone, whatsapp, email, services, zone_city, zone_radius_km, vehicle_brand, vehicle_model, vehicle_year, vehicle_seats, driver_verification_status, siret")
    .eq("slug", normalizedSlug)
    .eq("is_public", true)
    .single();

  if (error || !profile) {
    notFound();
  }

  supabase.rpc("increment_profile_view", { profile_slug: normalizedSlug }).then(() => {});

  const p = profile as VtcProfile;
  let driverInfo: DriverInfo | null = null;
  if (p.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("full_name, company_name, professional_card_number, vtc_card_number")
      .eq("id", p.user_id)
      .single();
    driverInfo = user as DriverInfo | null;
  }

  const services: string[] = Array.isArray(p.services) ? p.services : [];
  const isVerified = p.driver_verification_status === "approved";
  const cardNumber = driverInfo?.vtc_card_number || driverInfo?.professional_card_number || null;
  const zoneLabel =
    p.zone_city && p.zone_radius_km
      ? `${p.zone_city} (${p.zone_radius_km} km)`
      : p.zone_city || null;
  const vehicleParts = [p.vehicle_brand, p.vehicle_model, p.vehicle_year].filter(Boolean);
  if (p.vehicle_seats != null && p.vehicle_seats >= 2 && p.vehicle_seats <= 7) vehicleParts.push(`${p.vehicle_seats} places`);
  const vehicleLabel = vehicleParts.length ? vehicleParts.join(" ") : null;
  const contactNote = [p.zone_city, vehicleLabel].filter(Boolean).length
    ? `Chauffeur privé Corail · ${[p.zone_city, vehicleLabel].filter(Boolean).join(" · ")}`
    : "Chauffeur privé Corail";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link
            href="https://getcorail.com"
            className="text-sm text-[var(--muted-foreground)] hover:underline"
          >
            ← Retour à getcorail.com
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-lg">
          {/* Hero : bannière type LinkedIn (image fond), hauteur réduite pour moins d'espace au-dessus de la photo */}
          <div className="relative aspect-[3/1] min-h-[140px] max-h-[200px] w-full overflow-visible">
            {/* Image de fond élégante (voiture / chauffeur privé, Unsplash) */}
            <div
              className="absolute inset-0 overflow-hidden rounded-t-2xl bg-[var(--muted)]"
              style={{
                backgroundImage: `url(${p.page_cover_url && p.page_cover_url.trim() ? p.page_cover_url : DEFAULT_PAGE_COVER})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)]/90 via-[var(--card)]/30 to-transparent" />
            </div>
            {/* Droite : logo Corail (3x plus petit qu’avant, à l’opposé du label) */}
            <div className="absolute top-3 right-3 z-10">
              <img src="/images/corail-logo.png" alt="Corail" className="h-12 w-auto object-contain drop-shadow-md" />
            </div>
            {/* Avatar du chauffeur (photo ou initiale) — hors du bloc qui clip pour ne pas être tronqué */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
              <div className="w-28 h-28 rounded-full border-4 border-[var(--card)] bg-[var(--card)] shadow-xl overflow-hidden flex-shrink-0">
                {p.photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.photo_url}
                    alt={p.display_name}
                    className="w-full h-full object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--primary)] flex items-center justify-center">
                    <span className="text-3xl font-semibold text-[var(--primary-foreground)]">
                      {p.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 pt-16">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--primary)] mb-1">
              Chauffeur privé
            </p>
            <h1 className="text-2xl font-semibold tracking-tight mb-1 flex items-center gap-2 flex-wrap">
              {p.display_name}
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L7 10.586 5.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Profil vérifié
                </span>
              )}
            </h1>
            {zoneLabel && (
              <p className="text-[var(--muted-foreground)] text-sm mb-6">
                {zoneLabel}
              </p>
            )}
            {p.bio && (
              <p className="text-sm leading-relaxed text-[var(--foreground)]/90 mb-6 whitespace-pre-wrap">
                {p.bio}
              </p>
            )}
            {vehicleLabel && (
              <div className="mb-6">
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Véhicule
                </p>
                <p className="text-sm font-medium">{vehicleLabel}</p>
              </div>
            )}
            {services.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                  Prestations
                </p>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--muted)]/80 text-[var(--foreground)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coordonnées */}
            <div className="mb-6">
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                Contact
              </p>
              <VtcProfileActions
                phone={p.phone}
                whatsapp={p.whatsapp}
                email={p.email}
                displayName={p.display_name}
                contactNote={contactNote}
              />
            </div>

            {/* Informations professionnelles */}
            {(driverInfo?.company_name || cardNumber || p.siret) && (
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                  Activité
                </p>
                <dl className="space-y-2 text-sm">
                  {driverInfo?.company_name && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">Raison sociale</dt>
                      <dd className="font-medium">{driverInfo.company_name}</dd>
                    </div>
                  )}
                  {cardNumber && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">Numéro carte professionnelle</dt>
                      <dd className="font-medium tabular-nums">{cardNumber}</dd>
                    </div>
                  )}
                  {p.siret && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">SIRET</dt>
                      <dd className="font-medium tabular-nums">{p.siret}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          {isVerified ? (
            <Link
              href={`/reserver?chauffeur=${normalizedSlug}`}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] px-8 py-4 font-medium hover:opacity-90 shadow-lg shadow-[var(--primary)]/20"
            >
              Réserver une course
            </Link>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                Ce chauffeur est en cours de vérification. Les réservations seront disponibles une fois le profil validé.
              </p>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--muted-foreground)]">
          Chauffeur privé du réseau Corail · getcorail.com
        </p>
      </div>
    </div>
  );
}
