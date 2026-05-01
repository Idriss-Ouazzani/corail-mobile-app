/** Affichage / extraction date-heure des courses au fuseau Europe/Paris (emails, devis, champs DB). */
export const PARIS_IANA = "Europe/Paris";

export function formatScheduledInstantFromDb(iso: string): {
  dateYmd: string;
  timeHms: string;
  dateFrLong: string;
  timeFrShort: string;
} | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dateYmd = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_IANA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_IANA,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const pick = (t: Intl.DateTimeFormatPartTypes) =>
    (parts.find((p) => p.type === t)?.value ?? "00").padStart(2, "0");
  const timeHms = `${pick("hour")}:${pick("minute")}:${pick("second")}`;
  const dateFrLong = d.toLocaleDateString("fr-FR", {
    timeZone: PARIS_IANA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFrShort = d.toLocaleTimeString("fr-FR", {
    timeZone: PARIS_IANA,
    hour: "2-digit",
    minute: "2-digit",
  });
  return { dateYmd, timeHms, dateFrLong, timeFrShort };
}
