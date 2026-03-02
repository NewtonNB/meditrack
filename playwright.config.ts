import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	retries: 0,
	workers: undefined,
	reporter: [['list']],
	use: {
		baseURL: process.env.E2E_BASE_URL || 'http://localhost',
		headless: true,
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
	],
});


