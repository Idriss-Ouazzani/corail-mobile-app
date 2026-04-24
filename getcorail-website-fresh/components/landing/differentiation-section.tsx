export function DifferentiationSection() {
  return (
    <section className="py-20 lg:py-28 relative bg-gradient-to-b from-background via-muted/10 to-background overflow-hidden">
      {/* Réseau de nœuds / neurones animé (orange, thème) */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <svg
          className="w-full h-full text-primary/30"
          viewBox="0 0 800 400"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="node-glow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Lignes du réseau */}
          <g stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.25">
            <line x1="80" y1="120" x2="220" y2="80" className="network-line" style={{ animationDelay: "0s" }} />
            <line x1="220" y1="80" x2="380" y2="100" className="network-line" style={{ animationDelay: "0.5s" }} />
            <line x1="380" y1="100" x2="520" y2="140" className="network-line" style={{ animationDelay: "1s" }} />
            <line x1="520" y1="140" x2="680" y2="100" className="network-line" style={{ animationDelay: "1.5s" }} />
            <line x1="80" y1="200" x2="200" y2="200" className="network-line" style={{ animationDelay: "0.2s" }} />
            <line x1="200" y1="200" x2="400" y2="200" className="network-line" style={{ animationDelay: "0.7s" }} />
            <line x1="400" y1="200" x2="600" y2="200" className="network-line" style={{ animationDelay: "1.2s" }} />
            <line x1="600" y1="200" x2="720" y2="180" className="network-line" style={{ animationDelay: "1.7s" }} />
            <line x1="80" y1="280" x2="240" y2="320" className="network-line" style={{ animationDelay: "0.4s" }} />
            <line x1="240" y1="320" x2="400" y2="300" className="network-line" style={{ animationDelay: "0.9s" }} />
            <line x1="400" y1="300" x2="560" y2="260" className="network-line" style={{ animationDelay: "1.4s" }} />
            <line x1="560" y1="260" x2="720" y2="280" className="network-line" style={{ animationDelay: "1.9s" }} />
            <line x1="220" y1="80" x2="200" y2="200" />
            <line x1="380" y1="100" x2="400" y2="200" />
            <line x1="520" y1="140" x2="400" y2="200" />
            <line x1="200" y1="200" x2="240" y2="320" />
            <line x1="400" y1="200" x2="400" y2="300" />
            <line x1="600" y1="200" x2="560" y2="260" />
          </g>
          {/* Nœuds */}
          <g fill="currentColor" filter="url(#glow)">
            {[
              [80, 120], [220, 80], [380, 100], [520, 140], [680, 100],
              [80, 200], [200, 200], [400, 200], [600, 200], [720, 180],
              [80, 280], [240, 320], [400, 300], [560, 260], [720, 280],
            ].map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={i % 3 === 0 ? 5 : 3.5}
                className="network-node"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </g>
        </svg>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl lg:text-4xl xl:text-5xl font-medium text-foreground mb-10 lg:mb-12 tracking-tight">
          Un modèle différent
        </h2>
        <p className="text-foreground/80 text-lg lg:text-xl font-medium mb-8">
          Une infrastructure, pas un intermédiaire financier.
        </p>
        <div className="space-y-6 text-foreground/70 text-lg lg:text-xl leading-relaxed">
          <p>
            Corail ne prélève aucune commission sur les courses.
            <br />
            Le tarif est librement défini et convenu entre le client et le chauffeur.
          </p>
          <p>
            Nous fournissons la structure.
            <br />
            Les chauffeurs restent indépendants.
          </p>
          <p className="text-foreground/90 font-medium">
            Un réseau organisé.
            <br />
            Sans pression tarifaire.
            <br />
            Sans dépendance à une plateforme.
          </p>
        </div>
      </div>
    </section>
  );
}
