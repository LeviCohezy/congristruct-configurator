import { useState, useCallback, useMemo } from "react";

export interface ConfigState {
  // Step 1
  model: "start" | "flow" | "hub" | "base";
  roundedCorners: boolean;
  // Step 2
  facade:
    | "thermowood-black"
    | "thermowood-natural"
    | "composite-white"
    | "composite-black"
    | "aluminium-anthracite"
    | "aluminium-bronze"
    | "aluminium-white"
    | "brick-grey";
  // Step 3
  floorPlan: "a" | "b";
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
  model: "flow",
  roundedCorners: false,
  facade: "thermowood-black",
  floorPlan: "a",
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
  "Exterieur",
  "Ramen",
  "Interieur",
  "Verlichting",
  "Extra's",
  "Transport",
  "Contact",
] as const;

// Pricing
const basePrices: Record<string, number> = {
  start: 29500,
  flow: 42000,
  hub: 58500,
  base: 79000,
};

const facadePrices: Record<string, number> = {
  "thermowood-black": 0,
  "thermowood-natural": 800,
  "composite-white": 1200,
  "composite-black": 1200,
  "aluminium-anthracite": 2400,
  "aluminium-bronze": 2800,
  "aluminium-white": 2400,
  "brick-grey": 3200,
};

const finishPrices: Record<string, number> = {
  shell: 0,
  finished: 8500,
  "fully-finished": 16500,
};

/** Roof is auto-derived: white facades → white roof, else black */
export function getRoofColor(facade: ConfigState["facade"]) {
  return facade === "composite-white" || facade === "aluminium-white"
    ? "#e0deda"
    : "#0e0d0b";
}

export function useConfigurator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<ConfigState>(defaultConfig);

  const updateConfig = useCallback(<K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
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
    if (config.tiltTurnWindow) price += 450;
    if (config.lightingPackage === "full") price += 1800;
    if (config.awning) price += 2400;
    if (config.solarPanels) price += 4800;
    if (config.batterySystem) price += 3200;
    if (config.foundation) price += 3500;
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
