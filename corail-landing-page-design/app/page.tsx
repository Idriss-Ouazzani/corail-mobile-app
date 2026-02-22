import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { BookingForm } from "@/components/landing/booking-form";
import { DriversSection } from "@/components/landing/drivers-section";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustSection } from "@/components/landing/trust-section";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <BookingForm />
        <DriversSection />
        <Features />
        <HowItWorks />
        <TrustSection />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
