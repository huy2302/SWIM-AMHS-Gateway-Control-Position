import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Định nghĩa @ tương đương với thư mục src
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
