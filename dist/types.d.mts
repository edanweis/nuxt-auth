
import type { ModuleOptions, ModuleHooks, RuntimeModuleHooks, ModuleRuntimeConfig, ModulePublicRuntimeConfig } from './module'

declare module '#app' {
  interface RuntimeNuxtHooks extends RuntimeModuleHooks {}
}

declare module '@nuxt/schema' {
  interface NuxtConfig { ['auth']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['auth']?: ModuleOptions }
  interface NuxtHooks extends ModuleHooks {}
  interface RuntimeConfig extends ModuleRuntimeConfig {}
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}

declare module 'nuxt/schema' {
  interface NuxtConfig { ['auth']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['auth']?: ModuleOptions }
  interface NuxtHooks extends ModuleHooks {}
  interface RuntimeConfig extends ModuleRuntimeConfig {}
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}


export type { default } from './module'
