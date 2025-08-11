import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = {};
  if (mode === "production") {
    env["process.env.NODE_ENV"] = '"production"';
  }

  console.log("running in mode", mode);

  return {
    plugins: [react({ include: /\.(jsx|js|tsx|ts)$/ })],
    define: env,
    build: {
      minify: true,
      lib: {
        entry: {
          main: resolve(__dirname, "index.tsx"),
        },
        fileName: (format, name) => {
          return `${name}.js`;
        },
        formats: ["es"],
      },
      rollupOptions: {
        output: {
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].[hash].js`,
        },
      },
    },
    server: {
      hmr: {
        host: "localhost",
      },
      port: 3000,
    },
    test: {},
  };
});
