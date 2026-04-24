import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { DifferentiationSection } from "@/components/landing/differentiation-section";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { BookingForm } from "@/components/landing/booking-form";
import { TrustLogosSection } from "@/components/landing/TrustLogosSection";
import { DriversSection } from "@/components/landing/drivers-section";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { StatsCounter } from "@/components/landing/StatsCounter";
import { TrustSection } from "@/components/landing/trust-section";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { CTA } from "@/components/landing/cta";
import { VisionSection } from "@/components/landing/vision-section";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/footer";
import { SectionReveal } from "@/components/landing/SectionReveal";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <SectionReveal><DifferentiationSection /></SectionReveal>
        <SectionReveal delay={80}><ProblemSolutionSection /></SectionReveal>
        <SectionReveal delay={80}><BookingForm /></SectionReveal>
        <div className="hidden" aria-hidden>
          <TrustLogosSection />
        </div>
        <SectionReveal delay={120}><DriversSection /></SectionReveal>
        <SectionReveal delay={160}><Features /></SectionReveal>
        <SectionReveal delay={200}><HowItWorks /></SectionReveal>
        <div className="hidden" aria-hidden>
          <SectionReveal delay={80}><StatsCounter /></SectionReveal>
        </div>
        <SectionReveal delay={80}><TrustSection /></SectionReveal>
        <div className="hidden" aria-hidden>
          <SectionReveal delay={80}><TestimonialSection /></SectionReveal>
        </div>
        <SectionReveal delay={80}><CTA /></SectionReveal>
        <SectionReveal delay={80}><VisionSection /></SectionReveal>
        <SectionReveal delay={80}><FinalCTA /></SectionReveal>
      </main>
      <Footer />
    </div>
  );
}
