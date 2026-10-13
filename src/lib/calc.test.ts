import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allocateInteger, packsToBuy, quantityInPurchaseUnit, resolvePrice } from "./calc.ts";
import { buildLines } from "./order.ts";
import { seedState } from "./seed.ts";

describe("order quantities", () => {
  const state = seedState();
  const school = state.schools[0];
  const lines = buildLines(state, school, 2026, 10);
  const line = (id: string) => {
    const found = lines.find((entry) => entry.itemId === id);
    assert.ok(found, id);
    return found;
  };

  it("uses portion × learners × school days, then converts and rounds packs", () => {
    const beans = line("beans");
    assert.equal(beans.totalDays, 4);
    assert.equal(beans.requiredQty, 35640);
    assert.ok(Math.abs(beans.quantityInUnit - 35.64) < 1e-9);
    assert.equal(beans.packsToBuy, 9);

    const maize = line("maize-meal");
    assert.equal(maize.qtyPerLearner, 40);
    assert.equal(maize.totalDays, 8);
    assert.equal(maize.requiredQty, 95040);
    assert.ok(Math.abs(maize.quantityInUnit - 95.04) < 1e-9);
    assert.equal(maize.packsToBuy, 10);

    const oil = line("cooking-oil");
    assert.equal(oil.totalDays, 15);
    assert.equal(oil.requiredQty, 6682.5);
    assert.equal(oil.packsToBuy, 1);

    const salt = line("salt");
    assert.equal(salt.totalDays, 19);
    assert.equal(salt.requiredQty, 5643);
    assert.equal(salt.packsToBuy, 11);

    const amasi = line("amasi");
    assert.equal(amasi.requiredQty, 237600);
    assert.ok(Math.abs(amasi.quantityInUnit - 237.6) < 1e-9);
  });

  it("converts millilitres and grams into the purchase unit", () => {
    assert.equal(quantityInPurchaseUnit(1000, "g", "kg"), 1);
    assert.equal(quantityInPurchaseUnit(1500, "ml", "L"), 1.5);
    assert.equal(packsToBuy(35.64, 4), 9);
    assert.equal(packsToBuy(6.6825, 5), 1);
  });

  it("picks the cheapest price per purchase unit unless a quote is chosen", () => {
    const prices = [
      {
        id: "a",
        supplierId: "a",
        itemId: "rice",
        price: 100,
        unitSize: 10,
        unitOfMeasure: "kg" as const,
        notes: "",
        capturedOn: "2026-10-02",
      },
      {
        id: "b",
        supplierId: "b",
        itemId: "rice",
        price: 60,
        unitSize: 5,
        unitOfMeasure: "kg" as const,
        notes: "",
        capturedOn: "2026-10-02",
      },
    ];
    assert.equal(resolvePrice(prices, {}, "rice").capture?.id, "a");
    assert.equal(resolvePrice(prices, { rice: "b" }, "rice").source, "chosen");
  });

  it("gives earlier dates the extra pack when shares are equal", () => {
    assert.deepEqual(allocateInteger(2, [1, 1, 1, 1]), [1, 1, 0, 0]);
  });
});
