import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DateTime } from "luxon";
import {
  buildWeekendExportStopButtonId,
  weekendExportStopButtonLabel,
  getWeekendStartDateString,
  isWeekendDate,
  parseWeekendExportStopButtonId,
} from "../src/utils/weekendExportReminder.js";

describe("weekend export reminder helpers", () => {
  it("treats Saturday and Sunday as the same weekend", () => {
    const saturday = DateTime.fromISO("2026-05-23T10:00:00", { zone: "Asia/Taipei" });
    const sunday = DateTime.fromISO("2026-05-24T10:00:00", { zone: "Asia/Taipei" });

    assert.equal(getWeekendStartDateString(saturday), "2026-05-23");
    assert.equal(getWeekendStartDateString(sunday), "2026-05-23");
  });

  it("does not classify weekdays as weekend dates", () => {
    const friday = DateTime.fromISO("2026-05-22T10:00:00", { zone: "Asia/Taipei" });
    const monday = DateTime.fromISO("2026-05-25T10:00:00", { zone: "Asia/Taipei" });

    assert.equal(isWeekendDate(friday), false);
    assert.equal(isWeekendDate(monday), false);
  });

  it("round-trips stop button ids with a user and weekend key", () => {
    const customId = buildWeekendExportStopButtonId({
      userId: "1234567890",
      weekendStartDate: "2026-05-23",
    });

    assert.equal(weekendExportStopButtonLabel, "停止通知");
    assert.deepEqual(parseWeekendExportStopButtonId(customId), {
      userId: "1234567890",
      weekendStartDate: "2026-05-23",
    });
    assert.equal(parseWeekendExportStopButtonId("quick-record:123:2026-05-23:BREAKFAST"), null);
  });
});
