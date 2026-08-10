import { describe, expect, it, vi } from "vitest";
import { createPressDrainScheduler } from "@/scripts/press/worker-scheduler";

describe("Press worker drain scheduler", () => {
  it("never runs concurrent drains and coalesces events received during work", async () => {
    let releaseFirst: () => void = () => undefined;
    let active = 0;
    let maxActive = 0;
    let calls = 0;
    const firstDrain = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const scheduler = createPressDrainScheduler({
      drain: async () => {
        calls += 1;
        active += 1;
        maxActive = Math.max(maxActive, active);
        if (calls === 1) await firstDrain;
        active -= 1;
      },
      onError: vi.fn(),
    });

    const startup = scheduler.request("startup");
    const events = Array.from({ length: 10 }, () => scheduler.request("realtime"));
    releaseFirst();
    await Promise.all([startup, ...events]);

    expect(maxActive).toBe(1);
    expect(calls).toBe(2);
  });

  it("stays available after a failed drain and stops future work when asked", async () => {
    const onError = vi.fn();
    const drain = vi.fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValue(undefined);
    const scheduler = createPressDrainScheduler({ drain, onError });

    await scheduler.request("startup");
    await scheduler.request("recovery");
    expect(onError).toHaveBeenCalledOnce();
    expect(drain).toHaveBeenCalledTimes(2);

    scheduler.stop();
    await scheduler.request("ignored");
    expect(drain).toHaveBeenCalledTimes(2);
  });
});
