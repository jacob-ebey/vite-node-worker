# vite-node-worker

Import Node.js workers with `?nodeWorker` in Vite. HMR support in dev, separate chunks in build.

```bash
npm install vite-node-worker
```

## Usage

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "types": ["node", "vite-node-worker/types"],
  },
}
```

```typescript
// vite.config.ts
import { nodeWorker } from "vite-node-worker";

export default defineConfig({
  plugins: [nodeWorker()],
});
```

```typescript
// worker.ts
import { parentPort } from "node:worker_threads";
parentPort?.on("message", (data) => {
  parentPort?.postMessage(`Processed: ${data}`);
});
```

```typescript
// main.ts
import Worker from "./worker?nodeWorker";
const worker = new Worker();
worker.postMessage("data");
worker.on("message", console.log);
```

Standard Node.js Worker constructor minus the script source. TypeScript support included.
