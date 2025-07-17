import { cpus } from "node:os";
import type { Worker, WorkerOptions } from "node:worker_threads";
import { MessageChannel } from "node:worker_threads";

import type {
  InvokeWorkerPoolData,
  InvokeWorkerPoolResultData,
} from "./shared";

type AnyFunction = (...args: any[]) => any;

type PoolOptions = {
  maxWorkers?: number;
  idleTimeout?: number;
};

class WorkerPool<const T extends Record<string, AnyFunction>> {
  private WorkerConstructor: new (
    options?: WorkerOptions | undefined
  ) => Worker;
  private workers: Worker[] = [];
  private activeWorkers = new Set<Worker>();
  private options: Required<PoolOptions>;

  constructor(
    WorkerConstructor: new (options?: WorkerOptions | undefined) => Worker,
    options: PoolOptions = {}
  ) {
    this.WorkerConstructor = WorkerConstructor;
    this.options = {
      maxWorkers: options.maxWorkers ?? cpus().length,
      idleTimeout: options.idleTimeout ?? 30000,
    };
  }

  private getWorker(): Worker {
    // Try to find an available worker
    const availableWorker = this.workers.find(
      (w) => !this.activeWorkers.has(w)
    );
    if (availableWorker) {
      return availableWorker;
    }

    // Create a new worker if we haven't reached the limit
    if (this.workers.length < this.options.maxWorkers) {
      const worker = new this.WorkerConstructor();
      this.workers.push(worker);
      return worker;
    }

    // If all workers are busy and we're at the limit, wait for one to become available
    // For simplicity, we'll use the first worker (round-robin could be better)
    return this.workers[0];
  }

  private releaseWorker(worker: Worker): void {
    this.activeWorkers.delete(worker);
  }

  async callMethod(
    method: keyof T,
    ...args: Parameters<T[keyof T]>
  ): Promise<Awaited<ReturnType<T[keyof T]>>> {
    const worker = this.getWorker();
    this.activeWorkers.add(worker);

    try {
      const result = await this.invokeWorkerMethod(
        worker,
        method as string,
        args
      );
      return result as Awaited<ReturnType<T[keyof T]>>;
    } finally {
      this.releaseWorker(worker);
    }
  }

  private invokeWorkerMethod(
    worker: Worker,
    method: string,
    args: unknown[]
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      const data: InvokeWorkerPoolData = {
        type: "invoke-worker-pool",
        method,
        args,
        result: port2,
      };

      port1.on("message", (result: InvokeWorkerPoolResultData) => {
        port1.close();
        port2.close();

        if (result.type === "return") {
          resolve(result.result);
        } else if (result.type === "throw") {
          if (result.errorType === "error") {
            const error = new Error(result.message);
            if (result.stack) {
              error.stack = result.stack;
            }
            reject(error);
          } else {
            reject(result.value);
          }
        }
      });

      port1.on("error", (error) => {
        port1.close();
        port2.close();
        reject(error);
      });

      worker.postMessage(data, [port2]);
    });
  }

  terminate(): Promise<void[]> {
    const terminationPromises = this.workers.map(async (worker) => {
      await worker.terminate();
    });
    this.workers = [];
    this.activeWorkers.clear();
    return Promise.all(terminationPromises);
  }
}

export function createWorkerPool<const T extends Record<string, AnyFunction>>(
  Worker: new (options?: WorkerOptions | undefined) => Worker,
  options?: PoolOptions
): MakeAsync<T> {
  const pool = new WorkerPool<T>(Worker, options);

  return new Proxy({} as MakeAsync<T>, {
    get(target, prop) {
      if (typeof prop === "string") {
        return (...args: any[]) =>
          pool.callMethod(prop as keyof T, ...(args as Parameters<T[keyof T]>));
      }
      return undefined;
    },
  });
}

type MakeAsync<T extends Record<string, AnyFunction>> = {
  [K in keyof T]: AsyncFunction<T[K]>;
};

type AsyncFunction<F extends AnyFunction> = (
  ...args: Parameters<F>
) => Promise<Awaited<ReturnType<F>>>;
