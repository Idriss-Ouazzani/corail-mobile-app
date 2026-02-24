"use client";

type Props = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  displayName: string;
  /** Optionnel : note pour la fiche contact (ex. "Chauffeur privé · Toulouse") */
  contactNote?: string | null;
};

function escapeVcfValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function VtcProfileActions({
  phone,
  whatsapp,
  email,
  displayName,
  contactNote,
}: Props) {
  const hasWhatsApp = whatsapp && /^[0-9]{10,15}$/.test(whatsapp.replace(/\s/g, ""));
  const hasPhone = phone && phone.trim().length > 0;
  const hasEmail = email && email.trim().length > 0;
  const hasAnyContact = hasPhone || hasWhatsApp || hasEmail;

  const whatsappNumber = hasWhatsApp
    ? whatsapp!.replace(/\s/g, "").replace(/^\+/, "")
    : null;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null;
  const telUrl = hasPhone ? `tel:${phone!.trim()}` : null;
  const mailtoUrl = hasEmail ? `mailto:${email!.trim()}` : null;

  const addToContacts = () => {
    const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVcfValue(displayName.trim())}`];
    if (hasPhone) lines.push(`TEL;TYPE=CELL:${phone!.trim().replace(/\s/g, "")}`);
    if (hasEmail) lines.push(`EMAIL:${email!.trim()}`);
    if (contactNote?.trim()) lines.push(`NOTE:${escapeVcfValue(contactNote.trim())}`);
    lines.push("END:VCARD");
    const vcf = lines.join("\r\n");
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayName.replace(/[^a-z0-9_-]/gi, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasAnyContact) {
    return null;
  }

  return (
    <div className="space-y-3">
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
      <button
        type="button"
        onClick={addToContacts}
        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-sm"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5H4a1 1 0 01-1-1V5a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1h-2z" />
        </svg>
        Ajouter à mes contacts
      </button>
    </div>
  );
}
