import { WEEKDAY_LABEL, weekStart, weekdayOf, monthSchoolDays } from "./calendar";
import { formatWeekday } from "./format";
import { allocateFromTheStart } from "./calc";
import type { DeliveryDrop, DeliveryTrip, OrderLineSnapshot, Weekday } from "./types";

interface SchoolPlanInput {
  schoolId: string;
  schoolName: string;
  lines: OrderLineSnapshot[];
}

interface Slot {
  schoolId: string;
  schoolName: string;
  date: string;
  line: OrderLineSnapshot;
  packs: number;
  reason: string;
}

function consumptionDates(schoolDays: string[], days: Weekday[]): string[] {
  return schoolDays.filter((iso) => {
    const weekday = weekdayOf(iso);
    return weekday !== null && days.includes(weekday);
  });
}

function perishableReason(days: Weekday[]): string {
  const labels = days.map((day) => WEEKDAY_LABEL[day]).join(", ");
  return `Served on ${labels}. Delivered on the day it is eaten so it does not sit without a fridge.`;
}

function stapleReason(date: string, shared: boolean, firstServe: string): string {
  if (shared) {
    return `Dry stock for this week. It joins the ${formatWeekday(date)} delivery, which is on or before ${formatWeekday(firstServe)}, the first day it is eaten.`;
  }
  return `Dry stock for this week. It has to arrive by ${formatWeekday(firstServe)}, the first day it is eaten.`;
}

function splitPacks(packs: number, packWeightKg: number, capacityKg: number): Array<{ packs: number; weightKg: number }> {
  if (packs <= 0) return [];
  const weight = packWeightKg > 0 ? packWeightKg : 0;
  if (weight === 0) return [{ packs, weightKg: 0 }];
  if (weight > capacityKg) {
    return Array.from({ length: packs }, () => ({ packs: 1, weightKg: weight }));
  }
  const perTrip = Math.max(1, Math.floor(capacityKg / weight));
  const chunks: Array<{ packs: number; weightKg: number }> = [];
  let left = packs;
  while (left > 0) {
    const take = Math.min(perTrip, left);
    chunks.push({ packs: take, weightKg: take * weight });
    left -= take;
  }
  return chunks;
}

export function buildDeliveryPlan(options: {
  year: number;
  month: number;
  capacityKg: number;
  deliveryCostZar: number;
  schools: SchoolPlanInput[];
}): { trips: DeliveryTrip[]; notes: string[] } {
  const schoolDays = monthSchoolDays(options.year, options.month);
  const slots: Slot[] = [];
  const capacity = options.capacityKg > 0 ? options.capacityKg : 1;

  for (const school of options.schools) {
    const perishableDates = new Set<string>();
    for (const line of school.lines) {
      if (!line.perishable || line.packsToBuy <= 0) continue;
      for (const date of consumptionDates(schoolDays, line.consumptionDays)) perishableDates.add(date);
    }

    for (const line of school.lines) {
      if (line.packsToBuy <= 0) continue;
      const dates = consumptionDates(schoolDays, line.consumptionDays);
      if (dates.length === 0) continue;

      if (line.perishable) {
        const packs = allocateFromTheStart(line.packsToBuy, dates.map(() => 1));
        dates.forEach((date, index) => {
          if (packs[index] <= 0) return;
          slots.push({
            schoolId: school.schoolId,
            schoolName: school.schoolName,
            date,
            line,
            packs: packs[index],
            reason: perishableReason(line.consumptionDays),
          });
        });
        continue;
      }

      const weeks = new Map<string, string[]>();
      for (const date of dates) {
        const key = weekStart(date);
        weeks.set(key, [...(weeks.get(key) ?? []), date]);
      }
      const weekKeys = [...weeks.keys()].sort();
      const weekWeights = weekKeys.map((key) => weeks.get(key)?.length ?? 0);
      const weekPacks = allocateFromTheStart(line.packsToBuy, weekWeights);
      weekKeys.forEach((key, index) => {
        if (weekPacks[index] <= 0) return;
        const weekDates = weeks.get(key) ?? [];
        const firstServe = weekDates.slice().sort()[0];
        const shared = [...perishableDates]
          .filter((date) => weekStart(date) === key && date <= firstServe)
          .sort();
        const date = shared.length > 0 ? shared[shared.length - 1] : firstServe;
        slots.push({
          schoolId: school.schoolId,
          schoolName: school.schoolName,
          date,
          line,
          packs: weekPacks[index],
          reason: stapleReason(date, shared.length > 0, firstServe),
        });
      });
    }
  }

  const grouped = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = `${slot.schoolId}|${slot.date}`;
    grouped.set(key, [...(grouped.get(key) ?? []), slot]);
  }

  const trips: DeliveryTrip[] = [];
  let capacitySplit = false;
  let oversized = false;

  for (const group of grouped.values()) {
    const chunks: Array<Slot & { weightKg: number }> = [];
    for (const slot of group) {
      const pieces = splitPacks(slot.packs, slot.line.packWeightKg, capacity);
      if (slot.line.packWeightKg > capacity) oversized = true;
      if (pieces.length > 1) capacitySplit = true;
      for (const piece of pieces) {
        chunks.push({ ...slot, packs: piece.packs, weightKg: piece.weightKg });
      }
    }
    chunks.sort((a, b) => b.weightKg - a.weightKg);
    const bins: Array<Array<Slot & { weightKg: number }>> = [];
    for (const chunk of chunks) {
      const bin = bins.find((candidate) => {
        const load = candidate.reduce((sum, item) => sum + item.weightKg, 0);
        return load + chunk.weightKg <= capacity + 1e-9;
      });
      if (bin) bin.push(chunk);
      else bins.push([chunk]);
    }
    if (bins.length > 1) capacitySplit = true;
    bins.forEach((bin, index) => {
      const sample = bin[0];
      const drops: DeliveryDrop[] = bin.map((item) => ({
        itemId: item.line.itemId,
        itemName: item.line.itemName,
        perishable: item.line.perishable,
        packs: item.packs,
        weightKg: item.weightKg,
        reason: item.reason,
      }));
      trips.push({
        id: `${sample.schoolId}_${sample.date}_${index + 1}`,
        schoolId: sample.schoolId,
        schoolName: sample.schoolName,
        date: sample.date,
        drops,
        weightKg: drops.reduce((sum, drop) => sum + drop.weightKg, 0),
        capacityKg: capacity,
        cost: options.deliveryCostZar,
      });
    });
  }

  trips.sort((a, b) => a.date.localeCompare(b.date) || a.schoolName.localeCompare(b.schoolName) || a.id.localeCompare(b.id));

  const notes = [
    `${trips.length} ${trips.length === 1 ? "delivery" : "deliveries"}. Fresh food goes out on the day it is served. Dry stock joins a delivery that already happens on or before the first day it is eaten that week.`,
  ];
  if (capacitySplit) {
    notes.push(`Some days need more than one trip because the load is above ${capacity} kg.`);
  }
  if (oversized) {
    notes.push("At least one pack is heavier than the car. It is still scheduled on its own trip.");
  }
  if (options.deliveryCostZar <= 0) {
    notes.push("Delivery cost is R0 until a cost per trip is entered. The plan still keeps the number of trips as small as the menu and the car allow.");
  }
  if (trips.length === 0) {
    notes.splice(0, notes.length, "Nothing to deliver. Open a month with school days, portions, and a quantity that rounds to at least one pack.");
  }
  return { trips, notes };
}
