import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import astroIcon from 'astro-icon';
/** @type {import('astro').AstroUserConfig} */
export default defineConfig({
  integrations: [tailwind(), astroIcon()]
});
