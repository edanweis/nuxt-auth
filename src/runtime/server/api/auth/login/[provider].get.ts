import { defineEventHandler, sendRedirect, getQuery } from 'h3'
import { resolveURL, withQuery } from 'ufo'
import { getConfig, handleError } from '#auth'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const provider = event.context.params!.provider

  if (!config.private.oauth || !config.private.oauth[provider]) {
    throw new Error('oauth-not-configured')
  }

  // The protected page the user has visited before redirect to login page
  const returnToPath = getQuery(event)?.redirect

  try {
    const redirectUri = resolveURL(
      config.public.baseUrl,
      '/api/auth/login',
      provider,
      'callback'
    )

    const authorizationUrl = withQuery(
      config.private.oauth[provider].authorizeUrl,
      {
        response_type: 'code',
        scope: config.private.oauth[provider].scopes,
        redirect_uri: redirectUri,
        client_id: config.private.oauth[provider].clientId,
        state: returnToPath
      }
    )

    await sendRedirect(event, authorizationUrl)
  } catch (error) {
    await handleError(error)
  }
})
