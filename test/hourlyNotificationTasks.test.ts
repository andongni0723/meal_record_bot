import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runHourlyNotificationTasks } from "../src/jobs/hourlyNotificationTasks.js";

describe("runHourlyNotificationTasks", () => {
  it("continues running later tasks when an earlier task fails", async () => {
    const calls: string[] = [];
    const errors: string[] = [];

    await runHourlyNotificationTasks(
      [
        {
          name: "first",
          run: async () => {
            calls.push("first");
            throw new Error("first failed");
          },
        },
        {
          name: "second",
          run: async () => {
            calls.push("second");
          },
        },
      ],
      (taskName, error) => {
        errors.push(`${taskName}:${error instanceof Error ? error.message : String(error)}`);
      },
    );

    assert.deepEqual(calls, ["first", "second"]);
    assert.deepEqual(errors, ["first:first failed"]);
  });
});
