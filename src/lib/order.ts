import { countWeekdays, monthSchoolDays } from "./calendar";
import {
  coveredDayCounts,
  consumptionDayCount,
  effectiveContentsPerPack,
  learnersServedByPack,
  lineFoodCost,
  packsFromContents,
  quantityInPurchaseUnit,
  requiredQuantity,
  resolvePrice,
  sumFoodCost,
} from "./calc";
import type { AppState, OrderLineSnapshot, School } from "./types";

export function buildLines(state: AppState, school: School, year: number, month: number): OrderLineSnapshot[] {
  const dayCounts = countWeekdays(monthSchoolDays(year, month));
  const schoolType = state.schoolTypes.find((type) => type.id === school.schoolTypeId);
  const lines: OrderLineSnapshot[] = [];

  for (const item of state.items) {
    const portion = state.portions.find(
      (entry) => entry.schoolTypeId === school.schoolTypeId && entry.itemId === item.id,
    );
    if (!portion || portion.qtyPerLearner <= 0) continue;
    const counts = coveredDayCounts(dayCounts, item.consumptionDays);
    const totalDays = consumptionDayCount(dayCounts, item.consumptionDays);
    const requiredQty = requiredQuantity(portion.qtyPerLearner, school.learnerCount, totalDays);
    const resolved = resolvePrice(state.prices, state.priceChoices, item.id);
    const capture = resolved.capture;
    const unitSize = capture?.unitSize || item.unitSize;
    const unitOfMeasure = capture?.unitOfMeasure || item.unitOfMeasure;
    const quantity = quantityInPurchaseUnit(requiredQty, portion.unit, unitOfMeasure);
    const contentsPerPack = effectiveContentsPerPack({
      portionUnit: portion.unit,
      purchaseUom: unitOfMeasure,
      unitSize,
      quotedContents: capture?.contentsPerPack ?? null,
      menuContents: item.contentsPerPack,
      menuUnitSize: item.unitSize,
      menuUom: item.unitOfMeasure,
    });
    const packs = packsFromContents(requiredQty, contentsPerPack);
    const supplier = capture ? state.suppliers.find((entry) => entry.id === capture.supplierId) : undefined;
    lines.push({
      itemId: item.id,
      itemName: item.name,
      unitSize,
      unitOfMeasure,
      packWeightKg: item.packWeightKg,
      price: capture?.price ?? 0,
      supplierId: capture?.supplierId ?? null,
      supplierName: supplier?.name ?? null,
      priceSource: resolved.source,
      qtyPerLearner: portion.qtyPerLearner,
      portionUnit: portion.unit,
      learnerCount: school.learnerCount,
      consumptionDays: item.consumptionDays,
      perishable: item.perishable,
      dayCounts: counts,
      totalDays,
      requiredQty,
      quantityInUnit: quantity,
      contentsPerPack,
      learnersPerPack: learnersServedByPack(contentsPerPack, portion.qtyPerLearner),
      contentsMissing: packs == null,
      packsToBuy: packs ?? 0,
      lineCost: lineFoodCost(packs ?? 0, capture?.price ?? 0),
    });
  }

  return lines;
}

export function foodCostFor(state: AppState, school: School, year: number, month: number): number {
  return sumFoodCost(buildLines(state, school, year, month));
}

export function orderId(schoolId: string, year: number, month: number): string {
  return `order_${schoolId}_${year}_${String(month).padStart(2, "0")}`;
}

export function schoolTypeName(state: AppState, school: School): string {
  return state.schoolTypes.find((type) => type.id === school.schoolTypeId)?.name ?? "Unknown type";
}
