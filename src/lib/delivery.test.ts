import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDeliveryPlan } from "./delivery.ts";
import type { OrderLineSnapshot } from "./types.ts";

function line(partial: Partial<OrderLineSnapshot> & Pick<OrderLineSnapshot, "itemId" | "itemName" | "perishable" | "consumptionDays" | "packsToBuy" | "packWeightKg">): OrderLineSnapshot {
  return {
    unitSize: 1,
    unitOfMeasure: "kg",
    price: 0,
    supplierId: null,
    supplierName: null,
    priceSource: "none",
    qtyPerLearner: 1,
    portionUnit: "g",
    learnerCount: 10,
    dayCounts: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 },
    totalDays: 1,
    requiredQty: 1,
    quantityInUnit: 1,
    lineCost: 0,
    ...partial,
  };
}

describe("weekly delivery plan", () => {
  it("keeps perishable food on the day it is served and dry stock on or before its first day", () => {
    const { trips } = buildDeliveryPlan({
      year: 2026,
      month: 10,
      capacityKg: 800,
      deliveryCostZar: 100,
      schools: [
        {
          schoolId: "example",
          schoolName: "Example",
          lines: [
            line({
              itemId: "soya",
              itemName: "Soya Mince",
              perishable: false,
              consumptionDays: ["mon"],
              packsToBuy: 3,
              packWeightKg: 5,
            }),
            line({
              itemId: "fruit",
              itemName: "Fruit",
              perishable: true,
              consumptionDays: ["tue"],
              packsToBuy: 2,
              packWeightKg: 1,
            }),
          ],
        },
      ],
    });
    const fruitDates = trips.filter((trip) => trip.drops.some((drop) => drop.itemId === "fruit")).map((trip) => trip.date);
    const soyaDates = trips.filter((trip) => trip.drops.some((drop) => drop.itemId === "soya")).map((trip) => trip.date);
    assert.deepEqual(fruitDates, ["2026-10-06", "2026-10-13"]);
    assert.deepEqual(soyaDates, ["2026-10-12", "2026-10-19", "2026-10-26"]);
  });

  it("delivers the only pack before the first day that item is eaten", () => {
    const { trips } = buildDeliveryPlan({
      year: 2026,
      month: 10,
      capacityKg: 800,
      deliveryCostZar: 0,
      schools: [
        {
          schoolId: "example",
          schoolName: "Example",
          lines: [
            line({
              itemId: "cooking-oil",
              itemName: "Cooking Oil",
              perishable: false,
              consumptionDays: ["mon", "tue", "thu", "fri"],
              packsToBuy: 1,
              packWeightKg: 5,
            }),
          ],
        },
      ],
    });
    assert.deepEqual(trips.map((trip) => trip.date), ["2026-10-06"]);
  });

  it("splits a day when the load is over the car capacity", () => {
    const { trips, notes } = buildDeliveryPlan({
      year: 2026,
      month: 10,
      capacityKg: 500,
      deliveryCostZar: 50,
      schools: [
        {
          schoolId: "example",
          schoolName: "Example",
          lines: [
            line({
              itemId: "rice",
              itemName: "Rice",
              perishable: false,
              consumptionDays: ["mon"],
              packsToBuy: 9,
              packWeightKg: 200,
            }),
          ],
        },
      ],
    });
    const monday = trips.filter((trip) => trip.date === "2026-10-12");
    assert.equal(monday.length, 2);
    assert.equal(monday.reduce((sum, trip) => sum + trip.drops.reduce((inner, drop) => inner + drop.packs, 0), 0), 3);
    assert.ok(notes.some((note) => note.includes("more than one trip")));
  });
});
