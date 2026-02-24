import { useState, useCallback, useMemo } from "react";

export interface ConfigState {
  // Unit
  model: "start" | "flow" | "hub" | "base";
  roundedCorners: boolean;
  // Indeling
  floorPlan: "a" | "b";
  mirrorPlan: boolean;
  // Exterieur
  facade:
    | "thermowood-black"
    | "thermowood-natural"
    | "composite-white"
    | "composite-black"
    | "aluminium"
    | "brick-grey";
  aluminiumColor: string;
  // Interieur
  finishLevel: "shell" | "finished" | "fully-finished";
  floorOption: "light-vinyl" | "dark-vinyl" | "stone-vinyl";
  ledStrip: boolean;
  shelfColor: "brown" | "light-oak" | "white";
  // Ramen
  tiltTurnWindow: boolean;
  // Extra's
  awning: boolean;
  solarPanels: boolean;
  batterySystem: boolean;
  foundation: boolean;
  // Transport
  transportDistance: number;
  // Verlichting
  lightingPackage: "base" | "full";
  // Contact
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
  floorPlan: "a",
  mirrorPlan: false,
  facade: "thermowood-black",
  aluminiumColor: "#383a3b",
  finishLevel: "shell",
  floorOption: "light-vinyl",
  ledStrip: false,
  shelfColor: "brown",
  tiltTurnWindow: false,
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
  "aluminium": 2400,
  "brick-grey": 3200,
};

const finishPrices: Record<string, number> = {
  shell: 0,
  finished: 8500,
  "fully-finished": 16500,
};

/** Roof is auto-derived: white facades → white roof, else black */
export function getRoofColor(facade: ConfigState["facade"]) {
  return facade === "composite-white"
    ? "#e0deda"
    : "#0e0d0b";
}

export function useConfigurator() {
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
    if (config.ledStrip) price += 650;
    if (config.awning) price += 2400;
    if (config.solarPanels) price += 4800;
    if (config.batterySystem) price += 3200;
    if (config.foundation) price += 3500;
    price += config.transportDistance * 8;
    return price;
  }, [config]);

  return {
    config,
    updateConfig,
    updateContact,
    totalPrice,
  };
}
