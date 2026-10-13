import type { AppState, MenuItem, Portion, PortionUnit, PriceCapture, PurchaseUom, Weekday } from "./types";

const allDays: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];

function item(
  id: string,
  name: string,
  unitSize: number,
  unitOfMeasure: PurchaseUom,
  perishable: boolean,
  consumptionDays: Weekday[],
): MenuItem {
  return {
    id,
    name,
    unitSize,
    unitOfMeasure,
    packWeightKg: unitOfMeasure === "box" ? 1 : unitSize,
    contentsPerPack: null,
    perishable,
    consumptionDays,
  };
}

const items: MenuItem[] = [
  item("beans", "Beans", 4, "kg", false, ["tue"]),
  item("cooking-oil", "Cooking Oil", 5, "L", false, ["mon", "tue", "thu", "fri"]),
  item("curry-powder", "Curry Powder", 1, "kg", false, ["mon", "thu"]),
  item("fruit", "Fruit", 1, "box", true, ["tue"]),
  item("gravy-powder", "Gravy Powder", 1, "kg", false, ["tue", "thu", "fri"]),
  item("green-vegetable", "Green Vegetable", 20, "kg", true, ["thu"]),
  item("instant-porridge", "Instant Porridge", 5, "kg", false, allDays),
  item("amasi", "Maas/Amasi", 4, "kg", true, ["wed"]),
  item("maize-meal", "Maize Meal", 10, "kg", false, ["wed", "fri"]),
  item("onions", "Onions", 10, "kg", false, ["mon", "tue", "thu", "fri"]),
  item("pilchards", "Pilchards", 4.8, "kg", false, ["thu"]),
  item("rice", "Rice", 10, "kg", false, ["mon", "thu"]),
  item("salt", "Salt", 0.5, "kg", false, ["mon", "tue", "wed", "thu", "fri"]),
  item("samp", "Samp", 10, "kg", false, ["tue", "thu"]),
  item("soya-mince", "Soya Mince", 5, "kg", false, ["mon"]),
  item("tomatoes", "Tomatoes", 3, "kg", true, ["thu"]),
  item("yellow-vegetable", "Yellow Vegetable", 7, "kg", true, ["tue", "fri"]),
];

const primaryPortions: Array<[string, number, PortionUnit]> = [
  ["beans", 30, "g"],
  ["cooking-oil", 1.5, "ml"],
  ["curry-powder", 0.5, "g"],
  ["fruit", 1, "each"],
  ["gravy-powder", 0.5, "g"],
  ["green-vegetable", 60, "g"],
  ["instant-porridge", 10, "g"],
  ["amasi", 200, "ml"],
  ["maize-meal", 40, "g"],
  ["onions", 5, "g"],
  ["pilchards", 40, "g"],
  ["rice", 35, "g"],
  ["salt", 1, "g"],
  ["samp", 40, "g"],
  ["soya-mince", 25, "g"],
  ["tomatoes", 3, "g"],
  ["yellow-vegetable", 60, "g"],
];

const portions: Portion[] = primaryPortions.map(([itemId, qtyPerLearner, unit]) => ({
  schoolTypeId: "primary",
  itemId,
  qtyPerLearner,
  unit,
}));

const sheetPrices: Array<[string, number]> = [
  ["beans", 99.99],
  ["cooking-oil", 129.99],
  ["curry-powder", 90],
  ["fruit", 90],
  ["gravy-powder", 0],
  ["green-vegetable", 0],
  ["instant-porridge", 64.99],
  ["amasi", 54.99],
  ["maize-meal", 74.99],
  ["onions", 120],
  ["pilchards", 224.99],
  ["rice", 109.99],
  ["salt", 2.75],
  ["samp", 79.99],
  ["soya-mince", 159.99],
  ["tomatoes", 60],
  ["yellow-vegetable", 65],
];

const prices: PriceCapture[] = sheetPrices.map(([itemId, price]) => {
  const menuItem = items.find((entry) => entry.id === itemId)!;
  return {
    id: `price_${itemId}`,
    supplierId: "opening-quote",
    itemId,
    price,
    unitSize: menuItem.unitSize,
    unitOfMeasure: menuItem.unitOfMeasure,
    contentsPerPack: null,
    notes: "Taken from the October planning sheet.",
    capturedOn: "2026-10-01",
  };
});

export function seedState(): AppState {
  return {
    schoolTypes: [
      { id: "primary", name: "Primary" },
      { id: "secondary", name: "Secondary" },
    ],
    items,
    portions,
    schools: [
      {
        id: "example-school",
        name: "Example School",
        schoolTypeId: "primary",
        learnerCount: 297,
        gasDeliveries: [],
      },
    ],
    suppliers: [
      {
        id: "opening-quote",
        name: "Opening quote",
        notes: "Prices copied from the October sheet. Capture a real supplier to replace them.",
      },
    ],
    prices,
    priceChoices: {},
    orders: [],
    plans: [],
    variations: [],
    settings: {
      vehicleCapacityKg: 800,
      deliveryCostZar: 0,
    },
  };
}
