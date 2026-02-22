import { useConfigurator } from "@/hooks/useConfigurator";
import { StepProgress } from "./StepProgress";
import { PriceSummary } from "./PriceSummary";
import { PreviewPanel } from "./PreviewPanel";
import { UnitSelection } from "./steps/UnitSelection";
import { ExteriorFacade } from "./steps/ExteriorFacade";
import { WindowsPlan } from "./steps/WindowsPlan";
import { InteriorFinish } from "./steps/InteriorFinish";
import { LightingElectrical } from "./steps/LightingElectrical";
import { ExtraOptions } from "./steps/ExtraOptions";
import { Transport } from "./steps/Transport";
import { ContactForm } from "./steps/ContactForm";
import { AnimatePresence, motion } from "framer-motion";

export function ConfiguratorLayout() {
  const {
    currentStep, config, updateConfig, updateContact,
    totalPrice, nextStep, prevStep, goToStep, stepLabels, totalSteps,
  } = useConfigurator();

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <UnitSelection config={config} updateConfig={updateConfig} />;
      case 1: return <ExteriorFacade config={config} updateConfig={updateConfig} />;
      case 2: return <WindowsPlan config={config} updateConfig={updateConfig} />;
      case 3: return <InteriorFinish config={config} updateConfig={updateConfig} />;
      case 4: return <LightingElectrical config={config} updateConfig={updateConfig} />;
      case 5: return <ExtraOptions config={config} updateConfig={updateConfig} />;
      case 6: return <Transport config={config} updateConfig={updateConfig} />;
      case 7: return <ContactForm config={config} updateContact={updateContact} totalPrice={totalPrice} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Preview panel - left side on desktop, top on mobile */}
      <div className="lg:w-[55%] lg:sticky lg:top-0 lg:h-screen h-[40vh] sticky top-0 z-20">
        <PreviewPanel config={config} currentStep={currentStep} />
      </div>

      {/* Configuration panel - right side */}
      <div className="lg:w-[45%] flex flex-col bg-background min-h-0 lg:h-screen">
        {/* Header with step progress */}
        <div className="border-b border-border px-4 sm:px-6 py-3">
          <StepProgress steps={stepLabels} currentStep={currentStep} onStepClick={goToStep} />
        </div>

        {/* Step content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Price summary & navigation - sticky bottom */}
        <PriceSummary
          totalPrice={totalPrice}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
        />
      </div>
    </div>
  );
}
