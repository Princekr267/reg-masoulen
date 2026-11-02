import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mockApiPlugin } from './vite-mock-plugin';

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
});
