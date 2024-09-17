import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import mdx from "@mdx-js/rollup";

export default defineConfig(({ command, mode }) => {
  const env = {};
  if (mode === "production") {
    env["process.env.NODE_ENV"] = '"production"';
  }

  console.log("running in mode", mode);

  return {
    plugins: [
      { enforce: "pre", ...mdx() },
      react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
      svgrPlugin({ svgrOptions: { icon: true } }),
    ],
    define: env,
    build: {
      minify: true,
      lib: {
        entry: {
          audit: resolve(__dirname, "src/app/audit/index.tsx"),
          scan: resolve(__dirname, "src/app/scan/index.tsx"),
          tryit: resolve(__dirname, "src/app/tryit/index.tsx"),
          "data-dictionary": resolve(__dirname, "src/app/data-dictionary/index.tsx"),
          environment: resolve(__dirname, "src/app/environment/index.tsx"),
          config: resolve(__dirname, "src/app/config/index.tsx"),
          scanconf: resolve(__dirname, "src/app/scanconf/index.tsx"),
          signup: resolve(__dirname, "src/app/signup/index.tsx"),
          tags: resolve(__dirname, "src/app/tags/index.tsx"),
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
