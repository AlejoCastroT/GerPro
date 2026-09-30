import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

Object.assign(process.env, loadEnv('test', process.cwd(), ''));
const remoteURL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: remoteURL || 'http://127.0.0.1:4173',
    // Auth requests contain credentials; do not store network traces or videos.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: remoteURL ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort --mode test',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
