import jwt from "jsonwebtoken";
import { getRequestHeader } from "h3";
import type { H3Event } from "h3";
import { getConfig } from "../config";
import type { AccessTokenPayload, User, Session } from "../../../types";
import Mustache from "mustache";

export function createAccessToken(
  event: H3Event,
  user: User,
  sessionId: Session["id"]
) {
  const config = getConfig(event);

  let customClaims = config.private.accessToken.customClaims || {};

  if (customClaims) {
    const output = Mustache.render(JSON.stringify(customClaims), user);
    customClaims = Object.assign(JSON.parse(output));
  }

  const payload: AccessTokenPayload = {
    sessionId,
    userId: user.id,
    userRole: user.role,
    ...customClaims,
  };

  const accessToken = jwt.sign(payload, config.private.accessToken.jwtSecret, {
    expiresIn: config.private.accessToken.maxAge,
  });

  return accessToken;
}

/**
 * Get the access token from Authorization header
 * @param event
 * @returns accessToken
 */
export function getAccessTokenFromHeader(event: H3Event) {
  const authorization = getRequestHeader(event, "Authorization");
  if (authorization) {
    const accessToken = authorization.split("Bearer ")[1];
    return accessToken;
  }
}

/**
 * Check if the access token is issued by the server and not expired
 * @param accessToken
 * @returns accessTokenPayload
 */
export function verifyAccessToken(event: H3Event, accessToken: string) {
  const config = getConfig(event);

  const payload = jwt.verify(
    accessToken,
    config.private.accessToken.jwtSecret
  ) as AccessTokenPayload;
  return payload;
}
