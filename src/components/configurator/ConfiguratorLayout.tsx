import { useState, useRef, useEffect } from "react";
import { useConfigurator } from "@/hooks/useConfigurator";
import { PreviewPanel } from "./PreviewPanel";
import { UnitSelection } from "./steps/UnitSelection";
import { FloorPlanSection } from "./steps/FloorPlanSection";
import { ExteriorFacade } from "./steps/ExteriorFacade";
import { InteriorFinish } from "./steps/InteriorFinish";
import { WindowsSection } from "./steps/WindowsSection";
import { ExtraOptions } from "./steps/ExtraOptions";
import { Transport } from "./steps/Transport";
import { ContactForm } from "./steps/ContactForm";
import { motion } from "framer-motion";

export function ConfiguratorLayout() {
  const { config, updateConfig, updateContact, totalPrice } = useConfigurator();
  const [interiorInView, setInteriorInView] = useState(false);
  const [force3D, setForce3D] = useState(false);
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
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showImages = !force3D && interiorInView && config.model === "start" && !(config.finishLevel === "shell" && config.floorPlan === "a");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Preview panel - left side on desktop, top on mobile */}
      <div className="lg:w-[55%] lg:sticky lg:top-0 lg:h-screen h-[40vh] sticky top-0 z-20">
        <PreviewPanel
          config={config}
          currentStep={0}
          showInteriorImages={showImages}
          onToggleInteriorView={() => setForce3D((v) => !v)}
        />
      </div>

      {/* Configuration panel - right side, scrollable */}
      <div className="lg:w-[45%] flex flex-col bg-background min-h-0">
        {/* Scrollable content — all sections */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 sm:px-8 py-8 space-y-10">
            {/* 1. Unit */}
            <Section delay={0}>
              <UnitSelection config={config} updateConfig={updateConfig} />
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
                <InteriorFinish config={config} updateConfig={updateConfig} />
              </Section>
            </div>

            <Divider />

            {/* 5. Ramen */}
            <Section delay={0.2}>
              <WindowsSection config={config} updateConfig={updateConfig} />
            </Section>

            <Divider />

            {/* 6. Extra's */}
            <Section delay={0.25}>
              <ExtraOptions config={config} updateConfig={updateConfig} />
            </Section>

            <Divider />

            {/* 7. Transport */}
            <Section delay={0.3}>
              <Transport config={config} updateConfig={updateConfig} />
            </Section>

            <Divider />

            {/* 8. Contact */}
            <Section delay={0.35}>
              <ContactForm config={config} updateContact={updateContact} totalPrice={totalPrice} />
            </Section>

            {/* Bottom spacer for sticky price bar */}
            <div className="h-24" />
          </div>
        </div>

        {/* Sticky price bar */}
        <div className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md px-5 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prijsindicatie</p>
              <p className="text-2xl font-display font-bold text-foreground">
                €{totalPrice.toLocaleString("nl-NL")}
              </p>
              <p className="text-[11px] text-muted-foreground">excl. BTW · indicatief</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}
