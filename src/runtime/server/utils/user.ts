import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

export async function findUser(where: Prisma.UserWhereUniqueInput) {
  const user = await prisma.user.findUniqueOrThrow({
    where,
  });
  return user;
}

export async function createUser(input: Prisma.UserCreateInput) {
  const hashedPassword = input.password
    ? bcrypt.hashSync(input.password, 12)
    : undefined;

  const user = await prisma.user.create({
    data: { ...input, password: hashedPassword },
  });

  return user;
}

export async function changePassword(userId: number, password: string) {
  const hashedPassword = bcrypt.hashSync(password, 12);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
}

export async function setUserEmailVerified(userId: number) {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      verified: true,
    },
  });
}

export function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compareSync(password, hashedPassword);
}
