import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const config = defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    workspace: [
      {
        extends: true,
        test: {
          name: "core",
          environment: "node",
          include: [
            "packages/core/**/__tests__/**/*.[jt]s?(x)",
            "packages/core/**/?(*.)+(spec|test).[jt]s?(x)",
          ],
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          environment: "jsdom",
          name: "react",
          setupFiles: ["test-react.setup.ts"],
          include: [
            "packages/react/**/__tests__/**/*.[jt]s?(x)",
            "packages/react/**/?(*.)+(spec|test).[jt]s?(x)",
          ],
        },
      },
    ],
  },
});

export default config;
