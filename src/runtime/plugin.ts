import common from './middleware/common'
import auth from './middleware/auth'
import guest from './middleware/guest'

import type { PublicConfig } from './types'
import {
  defineNuxtPlugin,
  addRouteMiddleware,
  useRuntimeConfig,
  useState,
  useAuth,
  useRoute,
  useAuthSession,
  useNuxtApp,
  useCookie
} from '#imports'

export default defineNuxtPlugin(async () => {
  try {
    const publicConfig = useRuntimeConfig().public.auth

    addRouteMiddleware('common', common, { global: true })

    addRouteMiddleware('auth', auth, {
      global: publicConfig.enableGlobalAuthMiddleware
    })

    addRouteMiddleware('guest', guest)

    const initialized = useState('auth-initialized', () => false)

    const { _loggedIn } = useAuthSession()

    if (initialized.value === false) {
      const { path } = useRoute()

      const { fetchUser } = useAuth()
      const { _refreshToken, _accessToken, _refresh } = useAuthSession()

      if (_accessToken.get()) {
        await fetchUser()
      } else {
        const isCallback = path === publicConfig.redirect.callback
        const isLoggedIn = _loggedIn.get() === 'true'

        if (isCallback || isLoggedIn || _refreshToken.get()) {
          await _refresh()
          if (_accessToken.get()) {
            await fetchUser()
          }
        }
      }
    }

    initialized.value = true

    const { user } = useAuthSession()

    if (user.value) {
      _loggedIn.set(true)
      const { callHook } = useNuxtApp()
      await callHook('auth:loggedIn', true)
    } else {
      _loggedIn.set(false)
    }

    if (process.client) {
      const { _onLogout } = useAuth()
      const { user } = useAuthSession()
      const accessTokenCookieName = publicConfig.accessTokenCookieName

      const accessTokenCookie = useCookie(accessTokenCookieName)

      watch(accessTokenCookie, (newValue, oldValue) => {
        if (user.value && !newValue && oldValue) {
          _onLogout()
        }
      })
    }
  } catch (e) {
    // console.error(e)
  }
})
