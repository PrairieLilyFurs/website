import { defineConfig } from 'astro/config';
import { execSync } from 'node:child_process';

// @ts-check

const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
const buildTime = new Date().toISOString();

// https://astro.build/config
export default defineConfig({
  integrations: [],
  vite: {
    define: {
      'import.meta.env.GIT_HASH': JSON.stringify(gitHash),
      'import.meta.env.BUILD_TIME': JSON.stringify(buildTime)
    }
  }
});
