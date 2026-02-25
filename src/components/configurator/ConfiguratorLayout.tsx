import { useState, useRef, useEffect, useCallback } from "react";
import { useConfigurator } from "@/hooks/useConfigurator";
import { useInteriorImages } from "@/hooks/useInteriorImages";
import { PreviewPanel } from "./PreviewPanel";
import { UnitSelection } from "./steps/UnitSelection";
import { FloorPlanSection } from "./steps/FloorPlanSection";
import { ExteriorFacade } from "./steps/ExteriorFacade";
import { InteriorFinish } from "./steps/InteriorFinish";
import { LightingSection } from "./steps/LightingSection";
import { WindowsSection } from "./steps/WindowsSection";
import { ExtraOptions } from "./steps/ExtraOptions";
import { Transport } from "./steps/Transport";
import { ContactForm } from "./steps/ContactForm";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { X, MousePointerClick } from "lucide-react";
import { BlurredPrice } from "./BlurredPrice";

export function ConfiguratorLayout() {
  const { config, updateConfig, updateContact, totalPrice } = useConfigurator();
  const interiorImages = useInteriorImages(config);
  const [interiorInView, setInteriorInView] = useState(false);
  const [force3D, setForce3D] = useState(false);
  const [showPriceGate, setShowPriceGate] = useState(false);
  const interiorRef = useRef<HTMLDivElement>(null);

  // Reset force3D when interior leaves view
  useEffect(() => {
    const el = interiorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInteriorInView(entry.isIntersecting);
        if (!entry.isIntersecting) setForce3D(false);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keep showing interior images even when finish level changes, as long as we're in the interior section
  const showImages = !force3D && interiorInView && config.model === "start" && !!interiorImages;
  const priceRevealed = config.priceRevealed;

  const handleRevealPrice = useCallback(() => {
    const c = config.contact;
    if (!c.fullName.trim() || !c.email.trim()) return;
    updateConfig("priceRevealed", true);
    setShowPriceGate(false);
  }, [config.contact, updateConfig]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Preview panel - left side on desktop, top on mobile */}
      <div className="lg:w-[55%] lg:sticky lg:top-0 lg:h-screen h-[50vh] sticky top-0 z-20">
        <PreviewPanel
          config={config}
          currentStep={0}
          showInteriorImages={showImages}
          onToggleInteriorView={() => setForce3D((v) => !v)}
          interiorImages={interiorImages}
        />
      </div>

      {/* Configuration panel - right side, scrollable */}
      <div className="lg:w-[45%] flex flex-col bg-background min-h-0">
        {/* Scrollable content — all sections */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 sm:px-8 py-12 space-y-16">
            {/* 1. Unit */}
            <Section delay={0}>
              <UnitSelection config={config} updateConfig={updateConfig} onPriceClick={() => setShowPriceGate(true)} />
            </Section>

            <Divider />

            {/* 2. Indeling */}
            <Section delay={0.05}>
              <FloorPlanSection config={config} updateConfig={updateConfig} />
            </Section>

            <Divider />

            {/* 3. Exterieur */}
            <Section delay={0.1}>
              <ExteriorFacade config={config} updateConfig={updateConfig} />
            </Section>

            <Divider />

            {/* 4. Interieur */}
            <div ref={interiorRef}>
              <Section delay={0.15}>
                <InteriorFinish config={config} updateConfig={updateConfig} onPriceClick={() => setShowPriceGate(true)} />
              </Section>
            </div>

            <Divider />

            {/* 4b. Verlichting */}
            <Section delay={0.17}>
              <LightingSection config={config} updateConfig={updateConfig} onPriceClick={() => setShowPriceGate(true)} />
            </Section>

            <Divider />
            <Section delay={0.2}>
              <WindowsSection config={config} updateConfig={updateConfig} onPriceClick={() => setShowPriceGate(true)} />
            </Section>

            <Divider />

            {/* 6. Extra's */}
            <Section delay={0.25}>
              <ExtraOptions config={config} updateConfig={updateConfig} onPriceClick={() => setShowPriceGate(true)} />
            </Section>

            <Divider />

            {/* 7. Transport */}
            <Section delay={0.3}>
              <Transport config={config} updateConfig={updateConfig} onPriceClick={() => setShowPriceGate(true)} />
            </Section>

            <Divider />

            {/* 8. Contact */}
            <div id="contact-section">
              <Section delay={0.35}>
                <ContactForm config={config} updateContact={updateContact} totalPrice={totalPrice} onPriceClick={() => setShowPriceGate(true)} />
              </Section>
            </div>

            {/* Bottom spacer for sticky price bar */}
            <div className="h-32" />
          </div>
        </div>

        {/* Sticky price bar */}
        <div className="sticky bottom-0 z-30 flex justify-center py-3 pointer-events-none">
          <div className="relative pointer-events-auto">
            <button
              onClick={() => !priceRevealed && setShowPriceGate(true)}
              className="px-5 py-2.5 rounded-full bg-card/60 backdrop-blur-xl border border-border/50 shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-xl flicker-border"
            >
              <BlurredPrice
                text={totalPrice.toLocaleString("nl-NL")}
                revealed={priceRevealed}
                onClick={() => setShowPriceGate(true)}
                className="text-xl font-display font-bold text-foreground cursor-pointer"
                prefix="± €"
              />
              <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                {priceRevealed ? "excl. BTW" : "Klik om prijs te zien"}
              </p>
            </button>
            {!priceRevealed && (
              <MousePointerClick className="absolute right-[7.5rem] -bottom-3 w-8 h-8 text-accent animate-bounce pointer-events-none drop-shadow-md" />
            )}
          </div>
        </div>

        {/* Price gate modal */}
        <AnimatePresence>
          {showPriceGate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setShowPriceGate(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-display font-semibold">Ontdek je prijs</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {priceRevealed ? "Je prijs is zichtbaar. Vraag direct een offerte aan!" : "Vul je gegevens in om de live prijsindicatie te zien"}
                    </p>
                  </div>
                  <button onClick={() => setShowPriceGate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {!priceRevealed && (
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Volledige naam</label>
                      <input
                        type="text"
                        value={config.contact.fullName}
                        onChange={(e) => updateContact("fullName", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-base sm:text-sm"
                        placeholder="Jan Janssens"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">E-mailadres</label>
                      <input
                        type="email"
                        value={config.contact.email}
                        onChange={(e) => updateContact("email", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-base sm:text-sm"
                        placeholder="jan@voorbeeld.be"
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={priceRevealed ? () => { setShowPriceGate(false); document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" }); } : handleRevealPrice}
                  disabled={!priceRevealed && (!config.contact.fullName.trim() || !config.contact.email.trim())}
                  className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {priceRevealed ? "Offerte aanvragen" : "Toon mijn prijsindicatie"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.4, 0.6, 0.85, 1], isMobile ? [1, 1, 1, 1, 1, 1] : [0.1, 0.4, 1, 1, 0.4, 0.1]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], isMobile ? [0, 0, 0, 0, 0, 0] : [40, 16, 0, 0, -8, -20]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.5, 0.7, 1], isMobile ? [1, 1, 1, 1, 1] : [0.97, 1, 1, 1, 0.98]);

  return (
    <motion.div ref={ref} style={{ opacity, y, scale }}>
      {children}
    </motion.div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}
