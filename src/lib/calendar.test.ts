import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countWeekdays, isSchoolDay, monthSchoolDays } from "./calendar.ts";

describe("KZN learner calendar", () => {
  it("matches the October 2026 weekday counts on the planning sheet", () => {
    const counts = countWeekdays(monthSchoolDays(2026, 10));
    assert.deepEqual(counts, { mon: 3, tue: 4, wed: 4, thu: 4, fri: 4 });
  });

  it("excludes educator-only days, term breaks, and declared holidays", () => {
    assert.equal(isSchoolDay("2026-01-12"), false);
    assert.equal(isSchoolDay("2026-01-14"), true);
    assert.equal(isSchoolDay("2026-06-15"), false);
    assert.equal(isSchoolDay("2026-06-16"), false);
    assert.equal(isSchoolDay("2026-08-10"), false);
    assert.equal(isSchoolDay("2026-11-04"), false);
    assert.equal(isSchoolDay("2026-12-09"), true);
    assert.equal(isSchoolDay("2026-12-10"), false);
  });
});
