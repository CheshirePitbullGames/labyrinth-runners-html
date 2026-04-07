import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: Number(process.env.CLIENT_PORT ?? 5173),
  },
});
