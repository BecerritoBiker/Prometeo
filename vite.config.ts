import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const baseline = mode === "baseline";
  const providers = baseline ? "BaselineProviders" : "OptimizedProviders";
  return {
    base: baseline ? "/_base/" : "/",
    build: { outDir: baseline ? "dist-baseline" : "dist" },
    server: {
      port: 5173,
      proxy: { "/api": "http://127.0.0.1:8080" },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@page-providers": path.resolve(__dirname, `./src/perf/${providers}.tsx`),
      },
    },
  };
});
