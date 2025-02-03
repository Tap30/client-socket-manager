import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  root: "./client",
  publicDir: "./client/public",
  plugins: [tsconfigPaths()],
});
