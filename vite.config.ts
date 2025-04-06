
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Add a complete process.env polyfill for the browser
    'process.env': {},
    'process.browser': true,
    'process.version': '"v16.0.0"',  // Add Node.js version
    'process': {
      env: {},
      browser: true,
      version: '"v16.0.0"'
    }
  }
}));
