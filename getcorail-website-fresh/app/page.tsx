import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { DifferentiationSection } from "@/components/landing/differentiation-section";
import { BookingForm } from "@/components/landing/booking-form";
import { DriversSection } from "@/components/landing/drivers-section";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustSection } from "@/components/landing/trust-section";
import { CTA } from "@/components/landing/cta";
import { VisionSection } from "@/components/landing/vision-section";
import { Footer } from "@/components/landing/footer";
import { SectionReveal } from "@/components/landing/SectionReveal";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <SectionReveal><DifferentiationSection /></SectionReveal>
        <SectionReveal delay={80}><BookingForm /></SectionReveal>
        <SectionReveal delay={120}><DriversSection /></SectionReveal>
        <SectionReveal delay={160}><Features /></SectionReveal>
        <SectionReveal delay={200}><HowItWorks /></SectionReveal>
        <SectionReveal delay={80}><TrustSection /></SectionReveal>
        <SectionReveal delay={80}><CTA /></SectionReveal>
        <SectionReveal delay={80}><VisionSection /></SectionReveal>
      </main>
      <Footer />
    </div>
  );
}
