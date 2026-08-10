export interface PressDrainScheduler {
  request: (reason: string) => Promise<void>;
  stop: () => void;
  isRunning: () => boolean;
}

export function createPressDrainScheduler(input: {
  drain: (reason: string) => Promise<void>;
  onError: (error: unknown) => void;
}): PressDrainScheduler {
  let stopped = false;
  let requested = false;
  let latestReason = "startup";
  let running: Promise<void> | null = null;

  const request = async (reason: string): Promise<void> => {
    if (stopped) return;
    requested = true;
    latestReason = reason;
    if (running) return running;

    running = (async () => {
      try {
        while (requested && !stopped) {
          requested = false;
          await input.drain(latestReason);
        }
      } catch (error) {
        input.onError(error);
      } finally {
        running = null;
        if (requested && !stopped) void request("latched");
      }
    })();
    return running;
  };

  return {
    request,
    stop() {
      stopped = true;
      requested = false;
    },
    isRunning: () => running !== null,
  };
}
