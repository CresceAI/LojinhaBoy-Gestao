import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  // Mantém sua configuração original de base e servidor
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
  // ⚡ NOVA SEÇÃO: OTIMIZAÇÃO DE BUILD (FINTECH PRO)
  build: {
    chunkSizeWarningLimit: 1000, // Aumenta o limite para o aviso sumir
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa as bibliotecas em pedaços menores para carregar mais rápido no mobile
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react') || id.includes('@radix-ui')) return 'vendor-ui';
            if (id.includes('date-fns')) return 'vendor-utils';
            return 'vendor-libs'; // Outras bibliotecas
          }
        },
      },
    },
  },
}));