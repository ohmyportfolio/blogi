import NextAuth, { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

export type ExtendedUser = DefaultSession["user"] & {
    role: "ADMIN" | "USER";
    isApproved: boolean;
};

declare module "next-auth" {
    interface Session {
        user: ExtendedUser;
    }
}
