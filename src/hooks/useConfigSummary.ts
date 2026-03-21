import type { ConfigState } from "./useConfigurator";

export interface LineItem {
  name: string;
  option: string;
  price: number | null; // null = info row, no price
}

const modelLabels: Record<string, string> = {
  start: "BLOQ Start",
  flow: "BLOQ Flow",
  hub: "BLOQ Hub",
  base: "BLOQ Base",
};

const planLabels: Record<string, string> = { a: "Plan A", b: "Plan B" };

const facadeLabels: Record<string, string> = {
  "thermowood-natural": "Thermowood Ayous",
  "thermowood-black": "Thermowood Zwart",
  "composite-white": "Composite Wit",
  "composite-black": "Composite Zwart",
  aluminium: "Aluminium",
  "brick-grey": "Baksteen Grijs",
};

const finishLabels: Record<string, string> = {
  shell: "Casco",
  finished: "Afgewerkt",
  "fully-finished": "Bemeubeld",
};

const floorLabels: Record<string, string> = {
  "light-vinyl": "Licht vinyl",
  "dark-vinyl": "Donker vinyl",
  "stone-vinyl": "Steen vinyl",
};

const shelfLabels: Record<string, string> = {
  white: "Wit",
  "light-oak": "Eik",
  brown: "Donker",
};

const spotLabels: Record<string, string> = {
  "spot-wit": "Inbouw spot wit",
  "spot-zwart": "Inbouw spot zwart",
  "opbouw-spot-wit": "Opbouw spot wit",
  "opbouw-spot-zwart": "Opbouw spot zwart",
};

const railLabels: Record<string, string> = {
  "rail-vast-wit": "Rail vast wit",
  "rail-vast-zwart": "Rail vast zwart",
  "rail-wit-hangend": "Rail hangend wit",
  "rail-zwart-hangend": "Rail hangend zwart",
};

const toiletLampLabels: Record<string, string> = {
  "wc-spot-wit": "WC spot wit",
  "wc-spot-zwart": "WC spot zwart",
};

// ── Pricing tables (mirrored from useConfigurator) ──
const basePrices: Record<string, Record<string, number>> = {
  start: { a: 16700, b: 18470 },
  flow: { a: 22550, b: 29470 },
  hub: { a: 31550, b: 32500 },
  base: { a: 40985, b: 40985 },
};

const facadePricesByModel: Record<string, Record<string, number>> = {
  start: { "thermowood-natural": 0, "thermowood-black": 265, "composite-white": 335, "composite-black": 335, aluminium: 935, "brick-grey": 1335 },
  flow: { "thermowood-natural": 0, "thermowood-black": 335, "composite-white": 335, "composite-black": 335, aluminium: 935, "brick-grey": 1335 },
  hub: { "thermowood-natural": 0, "thermowood-black": 475, "composite-white": 335, "composite-black": 335, aluminium: 935, "brick-grey": 1335 },
  base: { "thermowood-natural": 0, "thermowood-black": 880, "composite-white": 335, "composite-black": 335, aluminium: 935, "brick-grey": 1335 },
};

const finishPricesByModel: Record<string, Record<string, number>> = {
  start: { shell: 0, finished: 3780, "fully-finished": 7500 },
  flow: { shell: 0, finished: 6600, "fully-finished": 16180 },
  hub: { shell: 0, finished: 9900, "fully-finished": 16860 },
  base: { shell: 0, finished: 12520, "fully-finished": 23420 },
};

const shelfPricesByModel: Record<string, Record<string, number>> = {
  start: { brown: 160, "light-oak": 141, white: 0 },
  flow: { brown: 330, "light-oak": 260, white: 0 },
  hub: { brown: 350, "light-oak": 200, white: 0 },
  base: { brown: 590, "light-oak": 520, white: 0 },
};

const insulationPriceByModel: Record<string, number> = { start: 900, flow: 1450, hub: 1145, base: 3050 };
const ledKeukenPriceByModel: Record<string, number> = { start: 350, flow: 150, hub: 150, base: 150 };
const ledKastPriceByModel: Record<string, number> = { start: 300, flow: 530, base: 50 };
const lightingPackagePriceByModel: Record<string, number> = { start: 1500, flow: 1500, hub: 1990, base: 3500 };
const heatPumpPriceByModel: Record<string, number> = { start: 2500, flow: 2500, hub: 3150, base: 4400 };
const kitchenPriceByModel: Record<string, number> = { base: 595 };
const extraHeatPumpPriceByModel: Record<string, number> = { start: 1050, flow: 1050, hub: 1050, base: 1095 };

export function getConfigLineItems(config: ConfigState): LineItem[] {
  const m = config.model;
  const items: LineItem[] = [];

  // ── Structure ──
  const basePrice = (basePrices[m] ?? basePrices.start)[config.floorPlan] ?? 0;
  items.push({ name: "Model", option: `${modelLabels[m] || m} — ${planLabels[config.floorPlan]}`, price: basePrice });

  items.push({ name: "Indeling", option: planLabels[config.floorPlan], price: null });
  items.push({ name: "Gespiegeld", option: config.mirrorPlan ? "Ja" : "Nee", price: null });

  if (config.roundedCorners) {
    items.push({ name: "Afgeronde hoeken", option: "Ja", price: 1500 });
  } else {
    items.push({ name: "Afgeronde hoeken", option: "Nee", price: null });
  }

  // ── Exterior ──
  const facadePrice = (facadePricesByModel[m] ?? {})[config.facade] ?? 0;
  items.push({ name: "Gevel", option: facadeLabels[config.facade] || config.facade, price: facadePrice > 0 ? facadePrice : null });

  if (config.facade === "aluminium" && config.aluminiumColor) {
    items.push({ name: "RAL kleur", option: config.aluminiumColor, price: null });
  }

  // ── Interior ──
  const finishPrice = (finishPricesByModel[m] ?? {})[config.finishLevel] ?? 0;
  items.push({ name: "Afwerking", option: finishLabels[config.finishLevel] || config.finishLevel, price: finishPrice > 0 ? finishPrice : null });

  if (config.finishLevel !== "shell") {
    items.push({ name: "Vloer", option: floorLabels[config.floorOption] || config.floorOption, price: null });
  }

  if (config.finishLevel === "fully-finished") {
    const shelfPrice = (shelfPricesByModel[m] ?? {})[config.shelfColor] ?? 0;
    items.push({ name: "Kastkleur", option: shelfLabels[config.shelfColor] || config.shelfColor, price: shelfPrice > 0 ? shelfPrice : null });
  }

  // ── Windows ──
  if (config.tiltTurnWindow > 0) {
    let winPrice = 0;
    if (m === "flow") winPrice = config.tiltTurnWindow * 150;
    else if (m === "hub") winPrice = config.tiltTurnWindow * 180;
    else winPrice = 180;
    items.push({ name: "Kiepraam", option: `${config.tiltTurnWindow}x`, price: winPrice });
  }

  // ── Lighting ──
  if (config.lightingPackage === "full") {
    const lightPrice = lightingPackagePriceByModel[m] ?? 1500;
    const spotExtra = (config.spotType === "opbouw-spot-wit" || config.spotType === "opbouw-spot-zwart") ? 10 : 5;
    items.push({ name: "Verlichtingspakket", option: "Volledig", price: lightPrice + spotExtra + 5 });
    items.push({ name: "  Spots", option: spotLabels[config.spotType] || config.spotType, price: null });
    items.push({ name: "  Railverlichting", option: railLabels[config.railType] || config.railType, price: null });
    items.push({ name: "  Toiletlamp", option: toiletLampLabels[config.toiletLamp] || config.toiletLamp, price: null });
  }

  if (config.keukenLedStrip) {
    items.push({ name: "LED-strip keuken", option: "Ja", price: ledKeukenPriceByModel[m] ?? 350 });
  }
  if (config.kastLedStrip) {
    items.push({ name: "LED-strip nis", option: "Ja", price: ledKastPriceByModel[m] ?? 300 });
  }

  // ── Extras ──
  if (config.extraCloset && m === "hub" && config.floorPlan === "b") {
    items.push({ name: "6-deurs kast", option: "Ja", price: 4000 });
  }

  if (config.hasKitchen) {
    const kitchenPrice = kitchenPriceByModel[m] ?? 0;
    if (kitchenPrice > 0) items.push({ name: "Keuken", option: "Ja", price: kitchenPrice });
  }

  if (config.heatPump) {
    items.push({ name: "Warmtepomp", option: "Lucht-water", price: heatPumpPriceByModel[m] ?? 2500 });
  }
  if (config.extraHeatPump) {
    items.push({ name: "Extra warmtepomp", option: "Ja", price: extraHeatPumpPriceByModel[m] ?? 1050 });
  }
  if (config.solarBattery) {
    items.push({ name: "Zonnepanelen", option: "Ja", price: 4500 });
  }
  if (config.insulation) {
    items.push({ name: "Houtvezelplaat", option: "Ja", price: insulationPriceByModel[m] ?? 900 });
  }

  // ── Transport ──
  if (config.transportDistance > 0) {
    items.push({ name: "Transport", option: `${config.transportDistance} km`, price: config.transportDistance * 8 });
  }

  return items;
}
