import React from "react"
import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ScrollProgress } from '@/components/landing/ScrollProgress'
import './globals.css'

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const SITE_URL = 'https://getcorail.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Corail - Réservation transport avec chauffeur privé',
  description: 'Réseau de chauffeurs indépendants, 0% de commission. Réservez votre course ou rejoignez un réseau premium, structuré et gratuit. Mise en relation, transparence, confirmation par mail.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'Corail - Réserver une course | Réseau de chauffeurs privés',
    description: 'Réseau de chauffeurs indépendants, 0% de commission. Réservez votre course ou rejoignez un réseau premium, structuré et gratuit.',
    url: SITE_URL,
    siteName: 'Corail',
    images: [
      {
        url: '/images/corail-logo.png',
        width: 1200,
        height: 630,
        alt: 'Corail - Transport avec chauffeur privé',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Corail - Réserver une course | Réseau de chauffeurs privés',
    description: 'Réseau de chauffeurs indépendants, 0% de commission. Réservez votre course ou rejoignez un réseau premium, structuré et gratuit.',
    images: ['/images/corail-logo.png'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <ScrollProgress />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
