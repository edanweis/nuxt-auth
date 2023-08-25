// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ["@bg-dev/nuxt-auth"],

  nitro: { preset: process.env.NITRO_PRESET },
});
