import { prisma } from "@/lib/prisma";

export const needsAdminSetup = async (): Promise<boolean> => {
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  return adminCount === 0;
};
