import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "popup.html"),
        dashboard: resolve(import.meta.dirname, "dashboard.html"),
      },
    },
  },
});
