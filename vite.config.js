import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "dev"),
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      clientPort: 5173,
    },
  },
  test: {
    environment: "node",
  },
});
