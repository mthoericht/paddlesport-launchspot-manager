import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/vue3-vite';
import * as projectAnnotations from './preview';

// Vue-Compiler-Warnung in non-browser Builds ausblenden (Tests)
const originalWarn = console.warn;
console.warn = (...args: unknown[]) =>
{
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('decodeEntities') && msg.includes('non-browser'))
  {
    return;
  }
  originalWarn.apply(console, args);
};

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);