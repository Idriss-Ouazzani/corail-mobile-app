"use client";

type Props = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  displayName: string;
};

export function VtcProfileActions({
  phone,
  whatsapp,
  email,
  displayName,
}: Props) {
  const hasWhatsApp = whatsapp && /^[0-9]{10,15}$/.test(whatsapp.replace(/\s/g, ""));
  const hasPhone = phone && phone.trim().length > 0;
  const hasEmail = email && email.trim().length > 0;

  const whatsappNumber = hasWhatsApp
    ? whatsapp!.replace(/\s/g, "").replace(/^\+/, "")
    : null;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null;
  const telUrl = hasPhone ? `tel:${phone!.trim()}` : null;
  const mailtoUrl = hasEmail ? `mailto:${email!.trim()}` : null;

  if (!hasPhone && !hasWhatsApp && !hasEmail) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-[#25D366] text-white hover:opacity-90"
        >
          WhatsApp
        </a>
      )}
      {telUrl && (
        <a
          href={telUrl}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
        >
          Appeler
        </a>
      )}
      {mailtoUrl && (
        <a
          href={mailtoUrl}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
        >
          Email
        </a>
      )}
    </div>
  );
}
