import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { getClientIp, normalizeIdentifierPart } from "@/lib/request";
import {
  drainRateLimit,
  getRetryAfterSeconds,
  rateLimit,
} from "@/lib/rate-limit";
import { createCommentSchema } from "@/lib/validation/comment";
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

  const result = createCommentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  const { movieId, text } = result.data;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(
      "commentCreate",
      `${normalizeIdentifierPart(currentUser.id)}:${normalizeIdentifierPart(getClientIp(request))}`,
    );

    drainRateLimit(rateLimitResult);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many comments in a short time. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(getRetryAfterSeconds(rateLimitResult.reset)),
          },
        },
      );
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const comment = await prisma.movieComment.create({
      data: {
        movieId,
        userId: currentUser.id,
        text,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        movieId: true,
        userId: true,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
