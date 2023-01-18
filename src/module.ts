import { fileURLToPath } from "url";
import type { PublicConfig, PrivateConfig } from "./runtime/types";

import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImportsDir,
  addServerHandler,
} from "@nuxt/kit";

import { defu } from "defu";

export interface ModuleOptions extends PrivateConfig, PublicConfig {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@bg-dev/nuxt-auth",
    configKey: "auth",
  },

  defaults: {
    accessTokenSecret: "abc",
    refreshTokenSecret: "efg",
    accessTokenExpiresIn: "7s",
    refreshTokenMaxAge: 3600,

    oauth: {
      google: {
        clientId: "",
        clientSecret: "",
        scopes: "email profile",
        authorizeUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://accounts.google.com/o/oauth2/token",
        userUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      },
    },

    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",

    baseUrl: "http://localhost:3000",
    enableGlobalAuthMiddleware: false,
    refreshTokenCookieName: "auth_refresh_token",
    redirect: {
      login: "/auth/login",
      logout: "/auth/login",
      home: "/home",
      callback: "/auth/callback",
      passwordReset: "/auth/password-reset",
      emailVerify: "/auth/email-verify",
    },
  },

  setup(options, nuxt) {
    //Get the runtime directory
    const { resolve } = createResolver(import.meta.url);
    const runtimeDir = fileURLToPath(new URL("./runtime", import.meta.url));

    //Transpile the runtime directory
    nuxt.options.build.transpile.push(runtimeDir);

    //Add plugins
    const plugin = resolve(runtimeDir, "plugin");
    addPlugin(plugin);

    //Add composables directory
    const composables = resolve(runtimeDir, "composables");
    addImportsDir(composables);

    //Add server routes
    addServerHandler({
      route: "/api/auth/login",
      handler: resolve(runtimeDir, "server/api/auth/login/index.post"),
    });

    addServerHandler({
      route: "/api/auth/login/:provider",
      handler: resolve(runtimeDir, "server/api/auth/login/[provider].get"),
    });

    addServerHandler({
      route: "/api/auth/login/:provider/callback",
      handler: resolve(
        runtimeDir,
        "server/api/auth/login/[provider]/callback.get"
      ),
    });

    addServerHandler({
      route: "/api/auth/refresh",
      handler: resolve(runtimeDir, "server/api/auth/refresh.post"),
    });

    addServerHandler({
      route: "/api/auth/register",
      handler: resolve(runtimeDir, "server/api/auth/register.post"),
    });

    addServerHandler({
      route: "/api/auth/me",
      handler: resolve(runtimeDir, "server/api/auth/me.get"),
    });

    addServerHandler({
      route: "/api/auth/logout",
      handler: resolve(runtimeDir, "server/api/auth/logout.post"),
    });

    addServerHandler({
      route: "/api/auth/password/request",
      handler: resolve(runtimeDir, "server/api/auth/password/request.post"),
    });

    addServerHandler({
      route: "/api/auth/password/reset",
      handler: resolve(runtimeDir, "server/api/auth/password/reset.put"),
    });

    addServerHandler({
      route: "/api/auth/password/change",
      handler: resolve(runtimeDir, "server/api/auth/password/change.put"),
    });

    addServerHandler({
      route: "/api/auth/email/request",
      handler: resolve(runtimeDir, "server/api/auth/email/request.post"),
    });

    addServerHandler({
      route: "/api/auth/email/verify",
      handler: resolve(runtimeDir, "server/api/auth/email/verify.get"),
    });

    //Create virtual imports for server-side
    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {};

      // Inline module runtime in Nitro bundle
      nitroConfig.externals = defu(
        typeof nitroConfig.externals === "object" ? nitroConfig.externals : {},
        {
          inline: [resolve(runtimeDir)],
        }
      );
      nitroConfig.alias["#auth"] = resolve(runtimeDir, "server/utils");
    });

    //Initialize the module options
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      auth: {
        accessTokenSecret: options.accessTokenSecret,
        refreshTokenSecret: options.refreshTokenSecret,
        accessTokenExpiresIn: options.accessTokenExpiresIn,
        refreshTokenMaxAge: options.refreshTokenMaxAge,

        oauth: options.oauth,

        smtpHost: options.smtpHost,
        smtpPort: options.smtpPort,
        smtpUser: options.smtpUser,
        smtpPass: options.smtpPass,
        smtpFrom: options.smtpFrom,
      },
      public: {
        auth: {
          baseUrl: options.baseUrl,
          enableGlobalAuthMiddleware: options.enableGlobalAuthMiddleware,
          refreshTokenCookieName: options.refreshTokenCookieName,
          redirect: {
            login: options.redirect.login,
            logout: options.redirect.logout,
            home: options.redirect.home,
            callback: options.redirect.callback,
            passwordReset: options.redirect.passwordReset,
            emailVerify: options.redirect.emailVerify,
          },
        },
      },
    });
  },
});
