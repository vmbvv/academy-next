import { getCurrentUser } from "@/lib/auth/get-current-user";
import { deleteCacheValue, getCacheValue, setCacheValue } from "@/lib/cache";
import { isMongoObjectId } from "@/lib/object-id";
import { prisma } from "@/lib/prisma";
import { getClientIp, normalizeIdentifierPart } from "@/lib/request";
import {
  drainRateLimit,
  getRetryAfterSeconds,
  rateLimit,
} from "@/lib/rate-limit";
import { movieRatingSchema } from "@/lib/validation/movie";
import { NextResponse } from "next/server";

const MOVIE_RATING_CACHE_TTL_SECONDS = 60;

type SharedRatingAggregate = {
  averageRating: number | null;
  ratingsCount: number;
};

function getMovieRatingAggregateCacheKey(movieId: string) {
  return `movie:rating:aggregate:${movieId}`;
}

async function getSharedRatingAggregate(movieId: string) {
  const cacheKey = getMovieRatingAggregateCacheKey(movieId);
  const cachedAggregate = await getCacheValue<SharedRatingAggregate>(cacheKey);

  if (cachedAggregate) {
    return cachedAggregate;
  }

  const aggregate = await prisma.movieRating.aggregate({
    where: { movieId },
    _avg: { value: true },
    _count: { _all: true },
  });
  const sharedAggregate = {
    averageRating:
      typeof aggregate._avg.value === "number"
        ? Number(aggregate._avg.value.toFixed(1))
        : null,
    ratingsCount: aggregate._count._all,
  };

  await setCacheValue(
    cacheKey,
    sharedAggregate,
    MOVIE_RATING_CACHE_TTL_SECONDS,
  );

  return sharedAggregate;
}

async function invalidateSharedRatingAggregate(movieId: string) {
  await deleteCacheValue(getMovieRatingAggregateCacheKey(movieId));
}

async function getRatingSummary(movieId: string, userId?: string) {
  const [sharedAggregate, currentUserRating] = await Promise.all([
    getSharedRatingAggregate(movieId),
    userId
      ? prisma.movieRating.findFirst({
          where: { movieId, userId },
          select: { value: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    averageRating: sharedAggregate.averageRating,
    ratingsCount: sharedAggregate.ratingsCount,
    userRating: currentUserRating?.value ?? null,
  };
}

async function ensureMovieExists(movieId: string) {
  return prisma.movie.findUnique({
    where: { id: movieId },
    select: { id: true },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  void request;

  if (!id || !isMongoObjectId(id)) {
    return NextResponse.json(
      { error: "Invalid movie ID format" },
      { status: 400 },
    );
  }

  try {
    const currentUser = await getCurrentUser();
    const movie = await ensureMovieExists(id);

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const ratingSummary = await getRatingSummary(id, currentUser?.id);

    return NextResponse.json({ ratingSummary }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/movies/[id]/rating]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !isMongoObjectId(id)) {
    return NextResponse.json(
      { error: "Invalid movie ID format" },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or missing JSON body" },
      { status: 400 },
    );
  }

  const result = movieRatingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(
      "ratingWrite",
      `${normalizeIdentifierPart(currentUser.id)}:${normalizeIdentifierPart(getClientIp(request))}`,
    );

    drainRateLimit(rateLimitResult);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many rating requests. Please wait a minute and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(getRetryAfterSeconds(rateLimitResult.reset)),
          },
        },
      );
    }

    const movie = await ensureMovieExists(id);

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const existingRating = await prisma.movieRating.findFirst({
      where: {
        movieId: id,
        userId: currentUser.id,
      },
      select: {
        id: true,
      },
    });

    if (existingRating) {
      await prisma.movieRating.update({
        where: { id: existingRating.id },
        data: { value: result.data.value },
      });
    } else {
      await prisma.movieRating.create({
        data: {
          movieId: id,
          userId: currentUser.id,
          value: result.data.value,
        },
      });
    }

    await invalidateSharedRatingAggregate(id);

    const ratingSummary = await getRatingSummary(id, currentUser.id);

    return NextResponse.json({ ratingSummary }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/movies/[id]/rating]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  void request;

  if (!id || !isMongoObjectId(id)) {
    return NextResponse.json(
      { error: "Invalid movie ID format" },
      { status: 400 },
    );
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(
      "ratingWrite",
      `${normalizeIdentifierPart(currentUser.id)}:${normalizeIdentifierPart(getClientIp(request))}`,
    );

    drainRateLimit(rateLimitResult);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many rating requests. Please wait a minute and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(getRetryAfterSeconds(rateLimitResult.reset)),
          },
        },
      );
    }

    const movie = await ensureMovieExists(id);

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    await prisma.movieRating.deleteMany({
      where: {
        movieId: id,
        userId: currentUser.id,
      },
    });

    await invalidateSharedRatingAggregate(id);

    const ratingSummary = await getRatingSummary(id, currentUser.id);

    return NextResponse.json({ ratingSummary }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/movies/[id]/rating]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
