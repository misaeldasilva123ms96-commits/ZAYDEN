import assert from "node:assert/strict";
import test from "node:test";

import { registerGracefulShutdown } from "../../runtime/host/bootstrap/graceful-shutdown.js";

interface FakeSignalProcess {
  on(signal: NodeJS.Signals, cb: () => void): void;
  off(signal: NodeJS.Signals, cb: () => void): void;
  emit(signal: NodeJS.Signals): void;
  listenerCount(signal: NodeJS.Signals): number;
}

function makeFakeSignalProcess(): FakeSignalProcess {
  const listeners = new Map<NodeJS.Signals, Set<() => void>>();
  return {
    on(signal, cb) {
      const set = listeners.get(signal) ?? new Set<() => void>();
      set.add(cb);
      listeners.set(signal, set);
    },
    off(signal, cb) {
      listeners.get(signal)?.delete(cb);
    },
    emit(signal) {
      const set = listeners.get(signal);
      if (!set) return;
      for (const cb of set) cb();
    },
    listenerCount(signal) {
      return listeners.get(signal)?.size ?? 0;
    },
  };
}

test("graceful shutdown registers hooks and closes server", async () => {
  const proc = makeFakeSignalProcess();
  let closeCalled = 0;
  let exitCode: number | null = null;
  const server = {
    listening: true,
    close(cb: (err?: Error | null) => void) {
      closeCalled += 1;
      cb(null);
    },
  };

  const hooks = registerGracefulShutdown({
    server: server as never,
    processRef: proc as never,
    exit: (code) => {
      exitCode = code;
    },
  });

  assert.equal(proc.listenerCount("SIGINT"), 1);
  assert.equal(proc.listenerCount("SIGTERM"), 1);
  await hooks.trigger("SIGINT");
  assert.equal(closeCalled, 1);
  assert.equal(exitCode, 0);
  hooks.dispose();
  assert.equal(proc.listenerCount("SIGINT"), 0);
});

test("repeated shutdown signal is handled safely", async () => {
  let closeCalled = 0;
  let exitCalls = 0;
  const server = {
    listening: true,
    close(cb: (err?: Error | null) => void) {
      closeCalled += 1;
      cb(null);
    },
  };

  const hooks = registerGracefulShutdown({
    server: server as never,
    processRef: makeFakeSignalProcess() as never,
    exit: () => {
      exitCalls += 1;
    },
  });

  await hooks.trigger("SIGTERM");
  await hooks.trigger("SIGINT");
  assert.equal(closeCalled, 1);
  assert.equal(exitCalls, 1);
});
