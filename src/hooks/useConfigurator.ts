import { useState, useCallback, useMemo, useRef, useEffect } from "react";

export interface ConfigState {
  model: "start" | "flow" | "hub" | "base";
  roundedCorners: boolean;
  floorPlan: "a" | "b";
  mirrorPlan: boolean;
  facade:
    | "thermowood-black"
    | "thermowood-natural"
    | "composite-white"
    | "composite-black"
    | "aluminium"
    | "brick-grey";
  aluminiumColor: string;
  finishLevel: "shell" | "finished" | "fully-finished";
  floorOption: "light-vinyl" | "dark-vinyl" | "stone-vinyl";
  shelfColor: "brown" | "light-oak" | "white";
  tiltTurnWindow: boolean;
  spotType: "spot-wit" | "spot-zwart" | "opbouw-spot-wit" | "opbouw-spot-zwart";
  railType: "rail-vast-wit" | "rail-vast-zwart" | "rail-wit-hangend" | "rail-zwart-hangend";
  toiletLamp: "wc-spot-wit" | "wc-spot-zwart";
  keukenLedStrip: boolean;
  kastLedStrip: boolean;
  lightingPackage: "base" | "full";
  heatPump: boolean;
  solarBattery: boolean;
  insulation: boolean;
  transportDistance: number;
  contact: {
    fullName: string;
    email: string;
    phone: string;
  };
  priceRevealed: boolean;
}

const CONTACT_STORAGE_KEY = "configurator-contact";

function loadContactFromStorage(): ConfigState["contact"] {
  try {
    const stored = localStorage.getItem(CONTACT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        fullName: parsed.fullName || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
      };
    }
  } catch {}
  return { fullName: "", email: "", phone: "" };
}

function saveContactToStorage(contact: ConfigState["contact"]) {
  try {
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contact));
  } catch {}
}

const savedContact = loadContactFromStorage();
const hasStoredContact = !!(savedContact.fullName && savedContact.email);

const defaultConfig: ConfigState = {
  model: "start",
  roundedCorners: false,
  floorPlan: "a",
  mirrorPlan: false,
  facade: "thermowood-black",
  aluminiumColor: "#383a3b",
  finishLevel: "shell",
  floorOption: "light-vinyl",
  shelfColor: "brown",
  tiltTurnWindow: false,
  spotType: "spot-zwart",
  railType: "rail-vast-zwart",
  toiletLamp: "wc-spot-zwart",
  keukenLedStrip: false,
  kastLedStrip: false,
  lightingPackage: "base",
  heatPump: false,
  solarBattery: false,
  insulation: false,
  transportDistance: 0,
  contact: savedContact,
  priceRevealed: hasStoredContact,
};

// ── START model pricing ──
const startBasePrices: Record<string, number> = {
  a: 16700, // without WC
  b: 18470, // with WC
};

const facadePrices: Record<string, number> = {
  "thermowood-black": 0,
  "thermowood-natural": 135,
  "composite-white": 335,
  "composite-black": 335,
  "aluminium": 935,
  "brick-grey": 1335,
};

const finishPrices: Record<string, number> = {
  shell: 0,
  finished: 3780,
  "fully-finished": 7500,
};

const shelfPrices: Record<string, number> = {
  brown: 160,
  "light-oak": 141,
  white: 0,
};

/** Roof is auto-derived: white facades → white roof, else black */
export function getRoofColor(facade: ConfigState["facade"]) {
  return facade === "composite-white"
    ? "#e0deda"
    : "#0e0d0b";
}

export function useConfigurator() {
  const [config, setConfig] = useState<ConfigState>(defaultConfig);
  const prevPriceRef = useRef<number | null>(null);
  const [priceJustIncreased, setPriceJustIncreased] = useState(false);

  const updateConfig = useCallback(<K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateContact = useCallback((field: keyof ConfigState["contact"], value: string) => {
    setConfig((prev) => {
      const newContact = { ...prev.contact, [field]: value };
      saveContactToStorage(newContact);
      return { ...prev, contact: newContact };
    });
  }, []);

  const totalPrice = useMemo(() => {
    // Base price depends on plan (WC or not) for START
    let price = config.model === "start"
      ? (startBasePrices[config.floorPlan] ?? 16700)
      : 42000; // placeholder for other models

    price += facadePrices[config.facade] ?? 0;
    price += finishPrices[config.finishLevel] ?? 0;

    // Shelf color only when fully-finished
    if (config.finishLevel === "fully-finished") {
      price += shelfPrices[config.shelfColor] ?? 0;
    }

    if (config.roundedCorners) price += 1500;
    if (config.tiltTurnWindow) price += 180;

    // Lighting
    if (config.lightingPackage === "full") price += 1500;
    // Opbouw spots cost €5 extra
    if (config.spotType === "opbouw-spot-wit" || config.spotType === "opbouw-spot-zwart") price += 5;
    if (config.keukenLedStrip) price += 350;
    if (config.kastLedStrip) price += 300;

    // Extras
    if (config.heatPump) price += 2500;
    if (config.solarBattery) price += 4500;
    if (config.insulation) price += 900;

    // Transport
    price += config.transportDistance * 8;
    return price;
  }, [config]);

  // Detect price increase for animation
  useEffect(() => {
    if (prevPriceRef.current !== null && totalPrice > prevPriceRef.current) {
      setPriceJustIncreased(true);
      const t = setTimeout(() => setPriceJustIncreased(false), 1200);
      return () => clearTimeout(t);
    }
    prevPriceRef.current = totalPrice;
  }, [totalPrice]);

  return {
    config,
    updateConfig,
    updateContact,
    totalPrice,
    priceJustIncreased,
  };
}
