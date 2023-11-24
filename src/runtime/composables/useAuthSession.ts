import { decodeJwt } from 'jose'
import Cookies from 'js-cookie'
import {
  deleteCookie,
  getCookie,
  setCookie,
  splitCookiesString,
  appendResponseHeader
} from 'h3'
import type { Ref } from 'vue'
import type {
  User,
  RefreshToken,
  Session
} from '../types'
import {
  useRequestEvent,
  useRuntimeConfig,
  useState,
  useRequestHeaders,
  navigateTo,
  useAuthFetch
} from '#imports'

export default function () {
  const event = useRequestEvent()
  const publicConfig = useRuntimeConfig().public.auth
  const privateConfig = useRuntimeConfig().auth
  const loggedInName = 'auth_logged_in'
  const accessTokenCookieName = publicConfig.accessTokenCookieName
  const refreshTokenCookieName = process.server
    ? privateConfig.refreshToken.cookieName!
    : ''
  const msRefreshBeforeExpires = 3000

  const _accessToken = {
    get: () =>
      process.server
        ? event.context[accessTokenCookieName] ||
          getCookie(event, accessTokenCookieName)
        : Cookies.get(accessTokenCookieName),
    set: (value: string) => {
      if (process.server) {
        event.context[accessTokenCookieName] = value
        setCookie(event, accessTokenCookieName, value, {
          sameSite: 'lax',
          secure: true
        })
      } else {
        Cookies.set(accessTokenCookieName, value, {
          sameSite: 'lax',
          secure: true
        })
      }
    },
    clear: () => {
      if (process.server) {
        deleteCookie(event, accessTokenCookieName)
      } else {
        Cookies.remove(accessTokenCookieName)
      }
    }
  }

  const _refreshToken = {
    get: () => process.server && getCookie(event, refreshTokenCookieName)
  }

  const _loggedIn = {
    get: () => process.client && localStorage.getItem(loggedInName),
    set: (value: boolean) =>
      process.client && localStorage.setItem(loggedInName, value.toString())
  }

  const user: Ref<Readonly<User | null | undefined>> = useState<
    User | null | undefined
  >('auth-user', () => null)

  function isTokenExpired (token: string) {
    const { exp } = decodeJwt(token)
    const expires = exp! * 1000 - msRefreshBeforeExpires
    return expires < Date.now()
  }

  async function _refresh () {
    const isRefreshOn = useState('auth-refresh-loading', () => false)

    if (isRefreshOn.value) {
      return
    }

    isRefreshOn.value = true

    const cookie = useRequestHeaders(['cookie']).cookie || ''

    await $fetch
      .raw<{ accessToken: string }>('/api/auth/session/refresh', {
        method: 'POST',
        headers: {
          cookie
        }
      })
      .then((res) => {
        const setCookie = res.headers.get('set-cookie') || ''

        const cookies = splitCookiesString(setCookie)

        for (const cookie of cookies) {
          appendResponseHeader(event, 'set-cookie', cookie)
        }

        if (res._data) {
          _accessToken.set(res._data.accessToken)
          _loggedIn.set(true)
        }
        isRefreshOn.value = false
        return res
      })
      .catch(async () => {
        isRefreshOn.value = false
        _accessToken.clear()
        _loggedIn.set(false)
        user.value = null
        if (process.client) {
          await navigateTo(publicConfig.redirect.logout)
        }
      })
  }

  /**
   * Async get access token
   * @returns Fresh access token (refreshed if expired)
   */
  async function getAccessToken () {
    const accessToken = _accessToken.get()

    if (accessToken && isTokenExpired(accessToken)) {
      await _refresh()
    }

    return _accessToken.get()
  }

  /**
   * Removes all stored sessions of the active user
   */
  async function revokeAllSessions (): Promise<void> {
    return await useAuthFetch<void>('/api/auth/session/revoke/all', {
      method: 'DELETE'
    })
  }

  /**
   * Removes a single stored session of the active user
   */
  async function revokeSession (id: Session['id']): Promise<void> {
    return await useAuthFetch<void>(`/api/auth/session/revoke/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get all stored sessions of the active user
   */
  async function getAllSessions (): Promise<Session[]> {
    const { refreshTokens, current } = await useAuthFetch<{
      refreshTokens: RefreshToken[];
      current: Session['id'];
    }>('/api/auth/session')

    const sessions: Session[] = refreshTokens.map((refreshToken) => {
      return {
        id: refreshToken.id,
        current: refreshToken.id === current,
        userId: refreshToken.userId,
        ua: refreshToken.userAgent,
        updatedAt: refreshToken.updatedAt,
        createdAt: refreshToken.createdAt
      }
    })

    return sessions
  }

  return {
    _accessToken,
    _refreshToken,
    _loggedIn,
    user,
    _refresh,
    getAccessToken,
    revokeAllSessions,
    revokeSession,
    getAllSessions
  }
}
