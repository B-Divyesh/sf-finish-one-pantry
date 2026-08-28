import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type StaticWebAppConfig = {
  globalHeaders: Record<string, string>;
  routes: Array<{ route: string; headers: Record<string, string> }>;
  mimeTypes: Record<string, string>;
};

const configPath = resolve(process.cwd(), 'public/staticwebapp.config.json');

async function readDeploymentPolicy(): Promise<StaticWebAppConfig> {
  return JSON.parse(await readFile(configPath, 'utf8')) as StaticWebAppConfig;
}

describe('static deployment response policy', () => {
  it('keeps documents protected and revalidating', async () => {
    const config = await readDeploymentPolicy();
    expect(config.globalHeaders['Cache-Control']).toBe('public, max-age=0, must-revalidate');
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain("worker-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Permissions-Policy']).toBe('accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  });

  it('makes fingerprinted assets immutable without caching the service worker', async () => {
    const config = await readDeploymentPolicy();
    const assetRoute = config.routes.find((route) => route.route === '/assets/*');
    const workerRoute = config.routes.find((route) => route.route === '/sw.js');
    expect(assetRoute?.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(workerRoute?.headers['Cache-Control']).toBe('public, max-age=0, must-revalidate');
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  });
});
