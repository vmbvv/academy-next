import { listMovies } from "@/lib/movies/list-movies";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const genre = url.searchParams.get("genre")?.trim() ?? "";
  const sortParam = url.searchParams.get("sort") ?? "latest";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = 12;
  const sort =
    sortParam === "title" || sortParam === "year" || sortParam === "latest"
      ? sortParam
      : "latest";

  try {
    const { movies, totalItems, genres } = await listMovies({
      search,
      genre,
      sort,
      page,
      pageSize,
      genreLimit: 18,
      includePoster: true,
    });

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json(
      {
        movies,
        pagination: {
          page,
          pageSize,
          totalMovies: totalItems,
          totalPages,
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
    console.error("[GET /api/movies]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
