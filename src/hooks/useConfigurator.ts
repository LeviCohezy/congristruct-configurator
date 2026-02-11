import { useState, useCallback, useMemo } from "react";

export interface ConfigState {
  // Step 1
  model: "compact" | "standard" | "large";
  layout: "office" | "studio" | "living";
  // Step 2
  facade: "thermowood-black" | "thermowood-natural" | "composite-white" | "composite-black" | "aluminium-anthracite" | "aluminium-bronze";
  roofEdge: "black" | "white";
  roundedCorners: boolean;
  // Step 3
  windowType: "standard" | "panoramic" | "minimal";
  tiltTurnWindow: boolean;
  mirrorPlan: boolean;
  // Step 4
  finishLevel: "shell" | "finished" | "fully-finished";
  floorOption: "light-vinyl" | "dark-vinyl" | "stone-vinyl";
  // Step 5
  lightingPackage: "base" | "full";
  // Step 6
  awning: boolean;
  solarPanels: boolean;
  batterySystem: boolean;
  foundation: boolean;
  // Step 7
  transportDistance: number;
  // Step 8
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    address: string;
  };
}

const defaultConfig: ConfigState = {
  model: "standard",
  layout: "office",
  facade: "thermowood-black",
  roofEdge: "black",
  roundedCorners: false,
  windowType: "standard",
  tiltTurnWindow: false,
  mirrorPlan: false,
  finishLevel: "shell",
  floorOption: "light-vinyl",
  lightingPackage: "base",
  awning: false,
  solarPanels: false,
  batterySystem: false,
  foundation: false,
  transportDistance: 50,
  contact: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  },
};

const STEP_LABELS = [
  "Unit",
  "Exterior",
  "Windows",
  "Interior",
  "Lighting",
  "Extras",
  "Transport",
  "Contact",
] as const;

// Mock pricing
const basePrices: Record<string, number> = {
  compact: 29500,
  standard: 42000,
  large: 58500,
};

const facadePrices: Record<string, number> = {
  "thermowood-black": 0,
  "thermowood-natural": 800,
  "composite-white": 1200,
  "composite-black": 1200,
  "aluminium-anthracite": 2400,
  "aluminium-bronze": 2800,
};

const finishPrices: Record<string, number> = {
  shell: 0,
  finished: 8500,
  "fully-finished": 16500,
};

export function useConfigurator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<ConfigState>(defaultConfig);

  const updateConfig = useCallback(<K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-rule: white facade → white roof edge
      if (key === "facade" && value === "composite-white") {
        next.roofEdge = "white";
      }
      return next;
    });
  }, []);

  const updateContact = useCallback((field: keyof ConfigState["contact"], value: string) => {
    setConfig((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  }, []);

  const totalPrice = useMemo(() => {
    let price = basePrices[config.model] ?? 42000;
    price += facadePrices[config.facade] ?? 0;
    price += finishPrices[config.finishLevel] ?? 0;
    if (config.roundedCorners) price += 1500;
    if (config.windowType === "panoramic") price += 2200;
    if (config.windowType === "minimal") price += 1600;
    if (config.tiltTurnWindow) price += 450;
    if (config.lightingPackage === "full") price += 1800;
    if (config.awning) price += 2400;
    if (config.solarPanels) price += 4800;
    if (config.batterySystem) price += 3200;
    if (config.foundation) price += 3500;
    // Transport: €8/km
    price += config.transportDistance * 8;
    return price;
  }, [config]);

  const nextStep = useCallback(() => setCurrentStep((s) => Math.min(s + 1, 7)), []);
  const prevStep = useCallback(() => setCurrentStep((s) => Math.max(s - 1, 0)), []);
  const goToStep = useCallback((step: number) => setCurrentStep(step), []);

  return {
    currentStep,
    config,
    updateConfig,
    updateContact,
    totalPrice,
    nextStep,
    prevStep,
    goToStep,
    stepLabels: STEP_LABELS,
    totalSteps: STEP_LABELS.length,
  };
}
