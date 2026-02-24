import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  produit: [
    { label: "Demande de course", href: "/#reserver" },
    { label: "Devenir chauffeur", href: "/devenir-chauffeur" },
    { label: "Réseau chauffeurs", href: "/#chauffeurs" },
    { label: "Application", href: "/#fonctionnalites" },
    { label: "Comment ça marche", href: "/#comment-ca-marche" },
  ],
  legal: [
    { label: "Confidentialité", href: "/confidentialite" },
    { label: "CGU", href: "/cgu" },
    { label: "Mentions légales", href: "/mentions-legales" },
  ],
};

export function Footer() {
  return (
    <footer className="py-16 border-t border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12">
          <div>
            <h4 className="font-medium text-foreground mb-6">Navigation</h4>
            <ul className="space-y-4">
              {footerLinks.produit.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/50 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-6">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/50 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            <Link href="/" className="shrink-0">
              <Image
                src="/images/corail-logo.png"
                alt="Corail"
                width={200}
                height={67}
                className="h-16 sm:h-20 w-auto"
              />
            </Link>
            <div className="text-center sm:text-left">
              <p className="text-sm text-foreground/55 leading-relaxed mb-3">
                Corail organise et structure un réseau national indépendant de transport privé.
                Une infrastructure pour aujourd&apos;hui. Un réseau pour demain.
              </p>
              <p className="text-xs text-foreground/45 leading-relaxed italic">
                Plateforme de mise en relation. Les prestations sont réalisées sous la responsabilité des chauffeurs indépendants.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground/40">
            © 2026 Corail. Tous droits réservés.
          </p>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-sm text-foreground/40 hover:text-foreground transition-colors">
              LinkedIn
            </Link>
            <Link href="#" className="text-sm text-foreground/40 hover:text-foreground transition-colors">
              Twitter
            </Link>
            <Link href="#" className="text-sm text-foreground/40 hover:text-foreground transition-colors">
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
