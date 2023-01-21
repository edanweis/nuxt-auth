import { defineNuxtRouteMiddleware, useRuntimeConfig, navigateTo } from "#app";
import useAuth from "../composables/useAuth";

export default defineNuxtRouteMiddleware((to) => {
  const publicConfig = useRuntimeConfig().public.auth;

  if (
    to.path === publicConfig.redirect.login ||
    to.path === publicConfig.redirect.callback
  ) {
    return;
  }

  if (publicConfig.enableGlobalAuthMiddleware === true) {
    if (to.meta.auth === false) {
      return;
    }
  }

  const { useAccessToken } = useAuth();

  const accessToken = useAccessToken();

  if (!accessToken.value) {
    return navigateTo(publicConfig.redirect.login);
  }
});
