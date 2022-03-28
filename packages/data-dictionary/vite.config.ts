import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgrPlugin({ svgrOptions: { icon: true } })],
  resolve: {
    alias: {
      "react/jsx-runtime": "react/jsx-runtime.js",
    },
  },
  build: {
    minify: true,
    lib: {
      name: "datadictionary",
      entry: resolve(__dirname, "src/main.tsx"),
      fileName: (format) => "index.js",
      formats: ["iife"],
    },
  },
});
