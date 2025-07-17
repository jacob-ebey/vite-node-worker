import { defineWorkerPool } from "./worker-pool/worker";
import { isMainThread } from "node:worker_threads";

async function simulateLongOperation(message: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return message;
}

const workerMethods = {
  echo(message: string) {
    return simulateLongOperation(message);
  },
  throw(message: string): never {
    throw new Error(message);
  },
};

// Only initialize worker pool when actually running in a worker context
if (!isMainThread) {
  defineWorkerPool(workerMethods);
}

export default workerMethods;
