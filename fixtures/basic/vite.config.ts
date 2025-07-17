import { createRequestListener } from "@mjackson/node-fetch-server";
import { defineConfig, RunnableDevEnvironment } from "vite";
import { nodeWorker } from "vite-node-worker";

export default defineConfig({
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments.server);
    },
    sharedConfigBuild: true,
    sharedPlugins: true,
  },
  environments: {
    server: {
      consumer: "server",
      build: {
        rollupOptions: {
          input: "./src/entry.ts",
        },
      },
    },
  },
  plugins: [
    nodeWorker(),
    {
      name: "dev-server",
      configureServer(server) {
        return () => {
          server.middlewares.use((req, res) => {
            req.url = req.originalUrl;
            createRequestListener(async (request) => {
              const ssr = server.environments.ssr as RunnableDevEnvironment;

              const mod = (await ssr.runner.import(
                "./src/entry.ts"
              )) as typeof import("./src/entry");

              return mod.default.fetch(request);
            })(req, res);
          });
        };
      },
    },
  ],
});
