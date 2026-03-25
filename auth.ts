import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { getClientIp, normalizeIdentifierPart } from "@/lib/request";
import {
  drainRateLimit,
  rateLimit,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth";

class RateLimitedCredentialsSignin extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;
        const rateLimitResult = await rateLimit(
          "login",
          `${normalizeIdentifierPart(getClientIp(request))}:${normalizeIdentifierPart(email)}`,
        );

        drainRateLimit(rateLimitResult);

        if (!rateLimitResult.success) {
          throw new RateLimitedCredentialsSignin();
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name ?? user.email ?? "User",
          email: user.email ?? "",
          role: user.role,
        };
      },
    }),
    GitHub({
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (
        account?.provider !== "credentials" &&
        (!user.email || user.email.trim().length === 0)
      ) {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = ("role" in user && user.role ? user.role : "USER") as Role;
        token.name = user.name ?? user.email ?? token.name;
        token.email = user.email ?? token.email;
        return token;
      }

      if ((!token.role || !token.name || !token.email) && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            name: true,
            email: true,
          },
        });

        if (dbUser) {
          token.id = token.sub;
          token.role = dbUser.role;
          token.name = dbUser.name ?? dbUser.email ?? token.name;
          token.email = dbUser.email ?? token.email;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.id === "string"
            ? token.id
            : typeof token.sub === "string"
              ? token.sub
              : "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
        session.user.name =
          session.user.name ??
          (typeof token.name === "string" ? token.name : null) ??
          (typeof token.email === "string" ? token.email : null) ??
          "User";
        session.user.email =
          session.user.email ??
          (typeof token.email === "string" ? token.email : null) ??
          "";
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      const updateData: {
        role?: Role;
        name?: string;
      } = {};

      if (!adminUser) {
        updateData.role = "ADMIN";
      }

      if (!user.name && user.email) {
        updateData.name = user.email;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    },
  },
});
