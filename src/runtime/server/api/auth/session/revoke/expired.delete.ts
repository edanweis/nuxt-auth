import { defineEventHandler, getRequestHeader } from 'h3'
import { getConfig, handleError, deleteManyRefreshTokenExpired } from '#auth'

export default defineEventHandler(async (event) => {
  const config = getConfig()

  try {
    const webhookKey = config.private.webhookKey

    if (getRequestHeader(event, 'Webhook-Key') !== webhookKey) {
      throw new Error('unauthorized')
    }

    await deleteManyRefreshTokenExpired(event)

    return 'ok'
  } catch (error) {
    await handleError(error)
  }
})
