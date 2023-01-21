import { defineEventHandler, createError, readBody } from "h3";
import {
  deleteManyRefreshToken,
  getAccessTokenFromHeader,
  verifyAccessToken,
  changePassword,
  findUser,
  verifyPassword,
} from "#auth";

export default defineEventHandler(async (event) => {
  try {
    const { oldPassword, newPassword } = await readBody(event);

    const accessToken = getAccessTokenFromHeader(event);

    if (!accessToken) {
      throw new Error("unauthorized");
    }

    const payload = verifyAccessToken(accessToken);

    const user = await findUser({ id: payload.userId });

    if (
      !user ||
      !user.password ||
      !verifyPassword(oldPassword, user.password)
    ) {
      throw new Error("wrong-password");
    }

    await changePassword(user.id, newPassword);

    await deleteManyRefreshToken(payload.userId);

    return {};
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error.message,
    });
  }
});
