import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const LOGO_URL = "https://getcorail.com/images/corail-logo.png";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backLink: {
    fontSize: 8,
    color: "#737373",
  },
  logoWrap: {
    marginLeft: "auto",
  },
  logo: {
    width: 96,
    height: 32,
    objectFit: "contain",
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#737373",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rowSingle: {
    marginBottom: 4,
  },
  muted: {
    color: "#737373",
  },
  bold: {
    fontWeight: 600,
  },
  section: {
    marginBottom: 14,
  },
  sectionContent: {
    fontSize: 10,
    marginBottom: 3,
  },
  driverPhone: {
    color: "#737373",
    fontSize: 10,
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    fontSize: 8,
    color: "#737373",
  },
});

export type InvoicePDFData = {
  invoiceNumber: string;
  issuedAt: string;
  totalTTC: number;
  totalHT: number;
  vatAmount: number;
  isAssujettiTva: boolean;
  emitterName: string | null;
  emitterAddress: string | null;
  siret: string | null;
  driverPhone: string | null;
  driverEmail: string | null;
  vatNumber: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  serviceDateStr: string | null;
  serviceTimeStr: string | null;
  prestationNotes: string | null;
  paymentMethod: string | null;
  paidAtStr: string | null;
  quoteId: string | null;
};

export function InvoicePDFDocument({ data }: { data: InvoicePDFData }) {
  const {
    invoiceNumber,
    issuedAt,
    totalTTC,
    totalHT,
    vatAmount,
    isAssujettiTva,
    emitterName,
    emitterAddress,
    siret,
    driverPhone,
    driverEmail,
    vatNumber,
    clientName,
    clientEmail,
    clientPhone,
    pickupAddress,
    dropoffAddress,
    serviceDateStr,
    serviceTimeStr,
    prestationNotes,
    paymentMethod,
    paidAtStr,
    quoteId,
  } = data;

  const hasClient = clientName || clientEmail || clientPhone;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: logo à droite comme la page */}
        <View style={styles.header}>
          <Text style={styles.backLink}>getcorail.com</Text>
          <View style={styles.logoWrap}>
            <Image src={LOGO_URL} style={styles.logo} />
          </View>
        </View>

        <Text style={styles.title}>FACTURE</Text>
        <Text style={[styles.muted, { fontSize: 8, marginBottom: 16 }]}>
          {invoiceNumber} · Émise le {issuedAt}
        </Text>

        {/* Montant */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Montant</Text>
          {isAssujettiTva ? (
            <>
              <View style={styles.row}>
                <Text style={styles.muted}>Total HT</Text>
                <Text>{totalHT.toFixed(2)} €</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.muted}>TVA (10 %)</Text>
                <Text>{vatAmount.toFixed(2)} €</Text>
              </View>
              <View style={[styles.row, { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }]}>
                <Text style={[styles.bold, { fontSize: 12, color: "#0d9488" }]}>Total TTC</Text>
                <Text style={[styles.bold, { fontSize: 12, color: "#0d9488" }]}>{totalTTC.toFixed(2)} €</Text>
              </View>
              {vatNumber && (
                <Text style={[styles.muted, { fontSize: 8, marginTop: 6 }]}>
                  N° TVA Intracommunautaire : {vatNumber}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.bold, { fontSize: 14 }]}>
                {totalTTC.toFixed(2)} €
              </Text>
              <Text style={[styles.muted, { fontSize: 8, marginTop: 4 }]}>
                TVA non applicable (art. 293 B du CGI)
              </Text>
              {vatNumber && (
                <Text style={[styles.muted, { fontSize: 8, marginTop: 4 }]}>
                  N° TVA Intracommunautaire : {vatNumber}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Chauffeur — Tél / Email sur une ligne en gris */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Chauffeur</Text>
          {emitterName && (
            <Text style={[styles.sectionContent, styles.bold]}>{emitterName}</Text>
          )}
          {emitterAddress && (
            <Text style={styles.sectionContent}>{emitterAddress}</Text>
          )}
          {siret && (
            <Text style={styles.sectionContent}>SIRET : {siret}</Text>
          )}
          {(driverPhone || driverEmail) && (
            <Text style={[styles.sectionContent, styles.driverPhone]}>
              {driverPhone && <>Tél : {driverPhone}</>}
              {driverPhone && driverEmail && " / "}
              {driverEmail && <>Email : {driverEmail}</>}
            </Text>
          )}
        </View>

        {/* Client — Tél / Email sur une ligne en gris */}
        {hasClient && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, styles.muted]}>Client</Text>
            {clientName && (
              <Text style={[styles.sectionContent, styles.bold]}>{clientName}</Text>
            )}
            {(clientPhone || clientEmail) && (
              <Text style={[styles.sectionContent, styles.muted]}>
                {clientPhone && <>Tél : {clientPhone}</>}
                {clientPhone && clientEmail && " / "}
                {clientEmail && <>Email : {clientEmail}</>}
              </Text>
            )}
          </View>
        )}

        {/* Prestation — date et heure avant Départ, puis notes/commentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Prestation</Text>
          {(serviceDateStr || serviceTimeStr) && (
            <Text style={[styles.sectionContent, styles.muted]}>
              {serviceDateStr}
              {serviceDateStr && serviceTimeStr && " à "}
              {serviceTimeStr}
            </Text>
          )}
          {pickupAddress && (
            <View style={styles.rowSingle}>
              <Text style={styles.muted}>Départ</Text>
              <Text style={styles.sectionContent}>{pickupAddress}</Text>
            </View>
          )}
          {dropoffAddress && (
            <View style={styles.rowSingle}>
              <Text style={styles.muted}>Arrivée</Text>
              <Text style={styles.sectionContent}>{dropoffAddress}</Text>
            </View>
          )}
          {prestationNotes && prestationNotes.trim() ? (
            <Text style={styles.sectionContent}>
              {prestationNotes.trim()}
            </Text>
          ) : null}
          {paymentMethod && (
            <Text style={styles.sectionContent}>
              Paiement : {paymentMethod}
            </Text>
          )}
          {paidAtStr && (
            <Text style={styles.sectionContent}>Payé le {paidAtStr}</Text>
          )}
        </View>

        {/* Footer : Facture + numéro, Réf. devis si présente */}
        <View style={styles.footer}>
          <Text>
            Facture {invoiceNumber}
            {quoteId ? ` · Réf. devis : ${quoteId}` : ""}
          </Text>
          <Text style={{ marginTop: 8 }}>— Corail · getcorail.com</Text>
        </View>
      </Page>
    </Document>
  );
}
