import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgrPlugin({ svgrOptions: { icon: true } })],
  optimizeDeps: {
    include: ["react/jsx-runtime"],
  },
  build: {
    minify: true,
    lib: {
      name: "scan",
      entry: resolve(__dirname, "src/main.tsx"),
      fileName: (format) => "index.js",
      formats: ["iife"],
    },
  },
  server: {
    hmr: {
      host: "localhost",
    },
  },
  test: {},
});
