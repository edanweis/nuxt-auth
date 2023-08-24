import { ZodError } from "zod";
import { createError, H3Error, sendRedirect } from "h3";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { logger } from "@nuxt/kit";
import { withQuery } from "ufo";
import { Prisma } from "@prisma/client";
import type { H3Event } from "h3";

/**
 * Checks error type and set status code accordingly
 */
export async function handleError(
  error: any,
  redirect?: { event: H3Event; url: string }
) {
  const h3Error = new H3Error("");

  if (error instanceof Prisma.PrismaClientInitializationError) {
    h3Error.message = "Server error";
    h3Error.statusCode = 500;
    logger.error("[nuxt-auth] Database connection failed");
  }

  //
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    //Query engine related issues
    if (error.code.startsWith("P2")) {
      h3Error.message = error.message;
      h3Error.statusCode = 400;
      if (["P2021", "P2022"].includes(error.code)) {
        logger.error(
          "[nuxt-auth] Table or column not defined. Please make sure to run prisma migration"
        );
      }
    }
    //Other server side errors (db, migration, introspection.. )
    else {
      h3Error.message = "Server error";
      h3Error.statusCode = 500;
    }
  }

  //
  else if (error instanceof Prisma.PrismaClientValidationError) {
    h3Error.message = "Validation Error";
    h3Error.statusCode = 400;
    logger.error(`[nuxt-auth] ${error.message}`);
  }

  //
  else if (error instanceof ZodError) {
    h3Error.message = error.issues[0].path + " | " + error.issues[0].message;
    h3Error.statusCode = 400;
  }

  //
  else if (
    error instanceof JsonWebTokenError ||
    error instanceof TokenExpiredError ||
    error.message === "unauthorized"
  ) {
    h3Error.message = "unauthorized";
    h3Error.statusCode = 401;
  }

  //
  else {
    h3Error.message = error.message;
    h3Error.statusCode = 400;
  }

  if (redirect) {
    await sendRedirect(
      redirect.event,
      withQuery(redirect.url, { error: h3Error.message })
    );
    return;
  }

  throw createError(h3Error);
}
