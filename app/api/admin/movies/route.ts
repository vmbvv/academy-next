import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listMovies } from "@/lib/movies/list-movies";
import { prisma } from "@/lib/prisma";
import { createMovieSchema } from "@/lib/validation/movie";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const sortParam = url.searchParams.get("sort") ?? "newest";
  const genre = url.searchParams.get("genre")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = 10;
  const sort =
    sortParam === "title" ||
    sortParam === "year" ||
    sortParam === "released" ||
    sortParam === "newest"
      ? sortParam
      : "newest";

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { movies, totalItems, genres } = await listMovies({
      search,
      genre,
      sort,
      page,
      pageSize,
      genreLimit: 24,
    });

    return NextResponse.json(
      {
        movies,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
        },
        filters: {
          search,
          sort,
          genre,
          genres,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/movies]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

  const result = createMovieSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const movie = await prisma.movie.create({
      data: {
        title: result.data.title,
        year: result.data.year,
        plot: result.data.plot,
        fullplot: result.data.fullplot,
        poster: result.data.poster,
        runtime: result.data.runtime,
        released: result.data.released
          ? new Date(result.data.released)
          : undefined,
        genres: result.data.genres,
        languages: result.data.languages,
        directors: result.data.directors,
        cast: result.data.cast,
      },
      select: {
        id: true,
        title: true,
        year: true,
        released: true,
      },
    });

    return NextResponse.json({ movie }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/movies]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
