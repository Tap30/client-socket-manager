import reactPlugin from "@vitejs/plugin-react";
import tsconfigPathsPlugin from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

const config = defineConfig({
  plugins: [tsconfigPathsPlugin(), reactPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: ["./setup-tests.ts"],
    include: [
      "src/**/__tests__/**/*.[jt]s?(x)",
      "src/**/?(*.)+(spec|test).[jt]s?(x)",
    ],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "clover", "json-summary"],
      include: ["src/**"],
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        "src/types.ts",
        "src/index.ts",
      ],
      thresholds: {
        "100": true,
      },
    },
  },
});

export default config;
