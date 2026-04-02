import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../frontend/tests/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs'
  ],
  framework: '@storybook/vue3-vite',
  viteFinal: async (config) =>
  {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': resolve(__dirname, '../frontend/src')
        }
      },
      plugins: [tailwindcss()],
      css: {
        devSourcemap: true
      }
    });
  }
};
export default config;