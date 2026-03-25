import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClientIp, normalizeIdentifierPart } from "@/lib/request";
import {
  drainRateLimit,
  getRetryAfterSeconds,
  rateLimit,
} from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or missing JSON body" },
      { status: 400 },
    );
  }

  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  const { name, email, password } = result.data;

  try {
    const rateLimitResult = await rateLimit(
      "register",
      normalizeIdentifierPart(getClientIp(request)),
    );

    drainRateLimit(rateLimitResult);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many sign-up attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(getRetryAfterSeconds(rateLimitResult.reset)),
          },
        },
      );
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: adminUser ? "USER" : "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
