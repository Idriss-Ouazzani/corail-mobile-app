"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/60 shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/corail-logo.png"
            alt="Corail"
            width={320}
            height={107}
            className="h-20 sm:h-24 lg:h-28 w-auto"
          />
        </Link>

        <div className="hidden lg:flex lg:items-center lg:gap-1">
          <Link
            href="/#reserver"
            className="px-4 py-2.5 text-[15px] font-medium text-foreground/90 hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
          >
            Réserver
          </Link>
          <Link
            href="/#chauffeurs"
            className="px-4 py-2.5 text-[15px] font-medium text-foreground/90 hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
          >
            Chauffeurs
          </Link>
          <Link
            href="/#fonctionnalites"
            className="px-4 py-2.5 text-[15px] font-medium text-foreground/90 hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
          >
            Application
          </Link>
          <Link
            href="/#comment-ca-marche"
            className="px-4 py-2.5 text-[15px] font-medium text-foreground/90 hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
          >
            Comment ça marche
          </Link>
        </div>

        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-7 py-2.5 h-auto text-[15px] font-medium shadow-sm"
            asChild
          >
            <Link href="/devenir-chauffeur">Devenir chauffeur</Link>
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Ouvrir le menu</span>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-6 space-y-1">
            <Link
              href="/#reserver"
              className="block py-3.5 px-4 text-base font-medium text-foreground rounded-lg hover:bg-muted/60 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Réserver
            </Link>
            <Link
              href="/#chauffeurs"
              className="block py-3.5 px-4 text-base font-medium text-foreground rounded-lg hover:bg-muted/60 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Chauffeurs
            </Link>
            <Link
              href="/#fonctionnalites"
              className="block py-3.5 px-4 text-base font-medium text-foreground rounded-lg hover:bg-muted/60 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Application
            </Link>
            <Link
              href="/#comment-ca-marche"
              className="block py-3.5 px-4 text-base font-medium text-foreground rounded-lg hover:bg-muted/60 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Comment ça marche
            </Link>
            <div className="pt-6 flex flex-col gap-3">
              <Button className="w-full justify-center bg-primary text-primary-foreground rounded-full h-12 font-medium" asChild>
                <Link href="/devenir-chauffeur" onClick={() => setMobileMenuOpen(false)}>
                  Devenir chauffeur
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
