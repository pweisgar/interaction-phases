import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Removed: import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // In development mode, if you still need a similar plugin, you can add it here.
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
