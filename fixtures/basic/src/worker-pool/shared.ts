import type { MessagePort } from "node:worker_threads";

export type InvokeWorkerPoolData = {
  type: "invoke-worker-pool";
  method: string;
  args: unknown[];
  result: MessagePort;
};

export type InvokeWorkerPoolResultData =
  | {
      type: "return";
      result: unknown;
    }
  | {
      type: "throw";
      errorType: "error";
      message: string;
      stack?: string;
    }
  | {
      type: "throw";
      errorType: "unknown";
      value: unknown;
    };
