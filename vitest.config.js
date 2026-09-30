import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/integration/**/*.test.{js,jsx}'],
    setupFiles: ['./tests/setup.js'],
    env: {
      VITE_SUPABASE_URL: 'https://integration.supabase.test',
      VITE_SUPABASE_ANON_KEY: 'test-public-key',
    },
  },
});
