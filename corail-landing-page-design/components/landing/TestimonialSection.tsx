import { Quote } from "lucide-react";

export function TestimonialSection() {
  return (
    <section className="py-24 lg:py-32 relative border-y border-border/60 bg-card/30">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <Quote className="w-10 h-10 text-primary/50 mx-auto mb-6" aria-hidden />
        <blockquote className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium text-foreground leading-snug tracking-tight mb-8">
          &ldquo;Enfin une solution qui respecte le chauffeur. Je garde ma liberté et ma clientèle. Les demandes arrivent, je confirme, c&apos;est réglé.&rdquo;
        </blockquote>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif text-xl font-semibold shrink-0">
            M.L.
          </div>
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">Marc L.</p>
            <p className="text-sm text-foreground/60">Chauffeur VTC, réseau Corail</p>
          </div>
        </div>
      </div>
    </section>
  );
}
