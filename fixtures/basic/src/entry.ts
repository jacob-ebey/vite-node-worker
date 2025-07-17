import Worker from "./worker?nodeWorker";
import type WorkerType from "./worker";

import { createWorkerPool } from "./worker-pool/main";

const pool = createWorkerPool<typeof WorkerType>(Worker);

export default {
  async fetch(request: Request): Promise<Response> {
    const msg = await pool.echo("Hello from the worker pool!");

    return new Response(msg, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
};
