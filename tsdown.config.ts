import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/vite-node-worker.ts"],
    outDir: "dist",
    clean: true,
    format: "esm",
    dts: true,
    platform: "node",
    target: "node24",
  },
  {
    entry: ["src/worker-entry.ts"],
    outDir: "dist",
    clean: true,
    format: "esm",
    platform: "node",
    target: "node24",
  },
  {
    entry: ["src/worker-runner.ts"],
    outDir: "dist",
    clean: true,
    format: "esm",
    platform: "node",
    target: "node24",
    noExternal: ["vite/module-runner"],
  },
]);
