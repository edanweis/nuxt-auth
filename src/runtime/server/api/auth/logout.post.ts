import { defineEventHandler } from "h3";
import {
  deleteRefreshTokenCookie,
  getRefreshTokenFromCookie,
  verifyRefreshToken,
  deleteRefreshToken,
  handleError,
} from "#auth";

export default defineEventHandler(async (event) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(event);

    const payload = await verifyRefreshToken(refreshToken);

    await deleteRefreshToken(payload.id);

    deleteRefreshTokenCookie(event);

    return "ok";
  } catch (error) {
    deleteRefreshTokenCookie(event);

    await handleError(error);
  }
});
