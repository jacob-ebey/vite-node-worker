import { parentPort } from "node:worker_threads";

import type {
  InvokeWorkerPoolData,
  InvokeWorkerPoolResultData,
} from "./shared";

type AnyFunction = (...args: any[]) => any;

const port = parentPort;
export function defineWorkerPool<const T extends Record<string, AnyFunction>>(
  methods: T
) {
  if (!port) {
    throw new Error("defineWorkerPool can only be called in a worker thread.");
  }

  port.on("message", async (data: InvokeWorkerPoolData) => {
    if (data.type !== "invoke-worker-pool") {
      console.warn(`[WorkerPool] Received unknown message type: ${data.type}`);
      return;
    }

    const method = methods[data.method];
    if (typeof method !== "function") {
      const error = new Error(
        `Method ${data.method} not found in worker pool.`
      );
      data.result.postMessage({
        type: "throw",
        errorType: "error",
        message: error.message,
        stack: error.stack,
      } satisfies InvokeWorkerPoolResultData);
      return;
    }

    try {
      const result = await method(...data.args);
      data.result.postMessage({
        type: "return",
        result,
      } satisfies InvokeWorkerPoolResultData);
    } catch (error) {
      if (error instanceof Error) {
        data.result.postMessage({
          type: "throw",
          errorType: "error",
          message: error.message,
          stack: error.stack,
        } satisfies InvokeWorkerPoolResultData);
      } else {
        data.result.postMessage({
          type: "throw",
          errorType: "unknown",
          value: error,
        } satisfies InvokeWorkerPoolResultData);
      }
    }
  });

  return methods;
}
