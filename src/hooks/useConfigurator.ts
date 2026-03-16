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
  tiltTurnWindow: 0 | 1 | 2;
  hubDoorSwap: boolean;
  spotType: "spot-wit" | "spot-zwart" | "opbouw-spot-wit" | "opbouw-spot-zwart";
  railType: "rail-vast-wit" | "rail-vast-zwart" | "rail-wit-hangend" | "rail-zwart-hangend";
  toiletLamp: "wc-spot-wit" | "wc-spot-zwart";
  keukenLedStrip: boolean;
  kastLedStrip: boolean;
  lightingPackage: "base" | "full";
  extraCloset: boolean;
  heatPump: boolean;
  extraHeatPump: boolean;
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
  facade: "thermowood-natural",
  aluminiumColor: "#383e42",
  finishLevel: "shell",
  floorOption: "light-vinyl",
  shelfColor: "white",
  tiltTurnWindow: 0,
  hubDoorSwap: false,
  spotType: "spot-zwart",
  railType: "rail-vast-zwart",
  toiletLamp: "wc-spot-zwart",
  keukenLedStrip: false,
  kastLedStrip: false,
  lightingPackage: "base",
  extraCloset: true,
  heatPump: false,
  extraHeatPump: false,
  solarBattery: false,
  insulation: false,
  transportDistance: 0,
  contact: savedContact,
  priceRevealed: hasStoredContact,
};

// ── Per-model pricing tables ──
const basePrices: Record<string, Record<string, number>> = {
  start: { a: 16700, b: 18470 },
  flow:  { a: 22550, b: 29470 },
  hub:   { a: 31550, b: 32500 },
  base:  { a: 42000, b: 42000 }, // placeholder
};

const facadePricesByModel: Record<string, Record<string, number>> = {
  start: {
    "thermowood-natural": 0, "thermowood-black": 265,
    "composite-white": 335, "composite-black": 335,
    "aluminium": 935, "brick-grey": 1335,
  },
  flow: {
    "thermowood-natural": 0, "thermowood-black": 335,
    "composite-white": 335, "composite-black": 335,
    "aluminium": 935, "brick-grey": 1335,
  },
};

const finishPricesByModel: Record<string, Record<string, number>> = {
  start: { shell: 0, finished: 3780, "fully-finished": 7500 },
  flow:  { shell: 0, finished: 6600, "fully-finished": 16180 },
};

const shelfPricesByModel: Record<string, Record<string, number>> = {
  start: { brown: 160, "light-oak": 141, white: 0 },
  flow:  { brown: 330, "light-oak": 260, white: 0 },
};

const windowPriceByModel: Record<string, number> = {
  start: 180,
  flow: 300, // €150 × 2 windows
};

const insulationPriceByModel: Record<string, number> = {
  start: 900,
  flow: 1450,
};

const ledKeukenPriceByModel: Record<string, number> = {
  start: 350,
  flow: 150,
};

const ledKastPriceByModel: Record<string, number> = {
  start: 300,
  flow: 530,
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
  const [priceJustDecreased, setPriceJustDecreased] = useState(false);

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
    const m = config.model;
    const modelBase = basePrices[m] ?? basePrices.start;
    let price = modelBase[config.floorPlan] ?? modelBase.a;

    const facadeTable = facadePricesByModel[m] ?? facadePricesByModel.start;
    price += facadeTable[config.facade] ?? 0;

    const finishTable = finishPricesByModel[m] ?? finishPricesByModel.start;
    price += finishTable[config.finishLevel] ?? 0;

    // Shelf color only when fully-finished
    if (config.finishLevel === "fully-finished") {
      const shelfTable = shelfPricesByModel[m] ?? shelfPricesByModel.start;
      price += shelfTable[config.shelfColor] ?? 0;
    }

    if (config.roundedCorners) price += 1500;
    if (config.tiltTurnWindow > 0) {
      if (m === "flow") {
        price += config.tiltTurnWindow * 150;
      } else {
        price += 180;
      }
    }

    // Lighting
    if (config.lightingPackage === "full") {
      price += 1500;
      if (config.spotType === "opbouw-spot-wit" || config.spotType === "opbouw-spot-zwart") {
        price += 10;
      } else {
        price += 5;
      }
      price += 5;
    }
    if (config.keukenLedStrip) price += (ledKeukenPriceByModel[m] ?? 350);
    if (config.kastLedStrip) price += (ledKastPriceByModel[m] ?? 300);

    // Extras
    if (config.heatPump) price += 2500;
    if (config.solarBattery) price += 4500;
    if (config.insulation) price += (insulationPriceByModel[m] ?? 900);

    // Transport
    if (config.transportDistance > 0) {
      price += config.transportDistance * 8;
    }
    return price;
  }, [config]);

  // Detect price increase/decrease for animation
  useEffect(() => {
    if (prevPriceRef.current !== null) {
      if (totalPrice > prevPriceRef.current) {
        setPriceJustIncreased(true);
        setPriceJustDecreased(false);
        const t = setTimeout(() => setPriceJustIncreased(false), 1200);
        prevPriceRef.current = totalPrice;
        return () => clearTimeout(t);
      } else if (totalPrice < prevPriceRef.current) {
        setPriceJustDecreased(true);
        setPriceJustIncreased(false);
        const t = setTimeout(() => setPriceJustDecreased(false), 1200);
        prevPriceRef.current = totalPrice;
        return () => clearTimeout(t);
      }
    }
    prevPriceRef.current = totalPrice;
  }, [totalPrice]);

  return {
    config,
    updateConfig,
    updateContact,
    totalPrice,
    priceJustIncreased,
    priceJustDecreased,
  };
}
