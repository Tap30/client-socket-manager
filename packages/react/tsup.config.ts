import { defineConfig } from "tsup";

const config = defineConfig({
  entry: ["./src/index.ts"],
  splitting: false,
  sourcemap: false,
  clean: true,
  format: ["cjs", "esm"],
  outDir: "dist",
  dts: true,
  minify: true,
});

export default config;
