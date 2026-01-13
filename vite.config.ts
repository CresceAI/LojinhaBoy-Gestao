import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    process.env.NODE_ENV === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // Aumentado para lidar com bibliotecas grandes
    rollupOptions: {
      output: {
        // 🛡️ Agrupamento Seguro: Coloca todas as bibliotecas num único bundle vendor
        // Isso elimina o erro de "Cannot access 'A' before initialization"
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
}));