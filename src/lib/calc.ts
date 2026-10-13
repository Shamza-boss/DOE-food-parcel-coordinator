import type { OrderLineSnapshot, PortionUnit, PriceCapture, PurchaseUom, Weekday } from "./types";
import { WEEKDAY_ORDER } from "./calendar";

export function consumptionDayCount(counts: Record<Weekday, number>, days: Weekday[]): number {
  return days.reduce((sum, day) => sum + (counts[day] ?? 0), 0);
}

export function requiredQuantity(qtyPerLearner: number, learners: number, totalDays: number): number {
  return qtyPerLearner * learners * totalDays;
}

/** Grams become kilograms, and millilitres become kilograms or litres, by dividing by 1000. */
export function quantityInPurchaseUnit(
  requiredQty: number,
  portionUnit: PortionUnit,
  purchaseUom: PurchaseUom,
): number {
  if (portionUnit === "g" && purchaseUom === "kg") return requiredQty / 1000;
  if (portionUnit === "ml" && (purchaseUom === "kg" || purchaseUom === "L")) return requiredQty / 1000;
  return requiredQty;
}

export function packsToBuy(quantityInUnit: number, unitSize: number): number {
  if (unitSize <= 0 || quantityInUnit <= 0) return 0;
  return Math.round(quantityInUnit / unitSize);
}

/** Kilograms and litres already say what is inside the pack. A box does not. */
export function derivedContentsPerPack(
  portionUnit: PortionUnit,
  purchaseUom: PurchaseUom,
  unitSize: number,
): number | null {
  if (unitSize <= 0) return null;
  if (portionUnit === "g" && purchaseUom === "kg") return unitSize * 1000;
  if (portionUnit === "ml" && (purchaseUom === "L" || purchaseUom === "kg")) return unitSize * 1000;
  return null;
}

export function effectiveContentsPerPack(input: {
  portionUnit: PortionUnit;
  purchaseUom: PurchaseUom;
  unitSize: number;
  quotedContents: number | null;
  menuContents: number | null;
  menuUnitSize: number;
  menuUom: PurchaseUom;
}): number | null {
  if (input.quotedContents != null && input.quotedContents > 0) return input.quotedContents;
  const samePack = input.unitSize === input.menuUnitSize && input.purchaseUom === input.menuUom;
  if (samePack && input.menuContents != null && input.menuContents > 0) return input.menuContents;
  return derivedContentsPerPack(input.portionUnit, input.purchaseUom, input.unitSize);
}

export function learnersServedByPack(contentsPerPack: number | null, qtyPerLearner: number): number | null {
  if (contentsPerPack == null || qtyPerLearner <= 0) return null;
  return contentsPerPack / qtyPerLearner;
}

export function packsFromContents(requiredQty: number, contentsPerPack: number | null): number | null {
  if (requiredQty <= 0) return 0;
  if (contentsPerPack == null || contentsPerPack <= 0) return null;
  return Math.round(requiredQty / contentsPerPack);
}

export function pricePerBaseUnit(capture: Pick<PriceCapture, "price" | "unitSize">): number {
  if (capture.unitSize <= 0) return Number.POSITIVE_INFINITY;
  return capture.price / capture.unitSize;
}

export function latestCapturePerSupplier(prices: PriceCapture[], itemId: string): PriceCapture[] {
  const sorted = prices
    .filter((price) => price.itemId === itemId)
    .slice()
    .sort((a, b) => a.capturedOn.localeCompare(b.capturedOn) || a.id.localeCompare(b.id));
  const latest = new Map<string, PriceCapture>();
  for (const price of sorted) latest.set(price.supplierId, price);
  return [...latest.values()];
}

export function resolvePrice(
  prices: PriceCapture[],
  choices: Record<string, string>,
  itemId: string,
): { capture: PriceCapture | null; source: "cheapest" | "chosen" | "none" } {
  const chosenId = choices[itemId];
  if (chosenId) {
    const chosen = prices.find((price) => price.id === chosenId && price.itemId === itemId);
    if (chosen) return { capture: chosen, source: "chosen" };
  }
  const latest = latestCapturePerSupplier(prices, itemId);
  if (latest.length === 0) return { capture: null, source: "none" };
  const cheapest = latest.slice().sort((a, b) => pricePerBaseUnit(a) - pricePerBaseUnit(b) || a.id.localeCompare(b.id))[0];
  return { capture: cheapest, source: "cheapest" };
}

export function coveredDayCounts(
  monthCounts: Record<Weekday, number>,
  consumptionDays: Weekday[],
): Record<Weekday, number> {
  const counts = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 };
  for (const day of WEEKDAY_ORDER) {
    counts[day] = consumptionDays.includes(day) ? monthCounts[day] : 0;
  }
  return counts;
}

export function lineFoodCost(packs: number, price: number): number {
  return packs * price;
}

export function sumFoodCost(lines: OrderLineSnapshot[]): number {
  return lines.reduce((sum, line) => sum + line.lineCost, 0);
}

export function allocateInteger(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const safeTotal = Math.max(0, Math.round(total));
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  if (sum <= 0 || safeTotal === 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (safeTotal * weight) / sum);
  const floors = exact.map((value) => Math.floor(value));
  let remaining = safeTotal - floors.reduce((acc, value) => acc + value, 0);
  const order = exact
    .map((value, index) => ({ index, frac: value - floors[index] }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  for (const entry of order) {
    if (remaining <= 0) break;
    floors[entry.index] += 1;
    remaining -= 1;
  }
  return floors;
}

/** Keep stock from arriving after it is first needed when only a few packs are bought. */
export function allocateFromTheStart(total: number, weights: number[]): number[] {
  const amounts = allocateInteger(total, weights);
  for (let index = 0; index < amounts.length; index += 1) {
    if (weights[index] <= 0 || amounts[index] > 0) continue;
    const donor = amounts.findIndex((value, later) => later > index && value > 0);
    if (donor === -1) break;
    amounts[donor] -= 1;
    amounts[index] += 1;
  }
  return amounts;
}
