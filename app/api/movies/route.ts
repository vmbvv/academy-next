import {
  getCacheValue,
  getCacheVersion,
  hashCacheKey,
  setCacheValue,
} from "@/lib/cache";
import { listMovies } from "@/lib/movies/list-movies";
import { NextResponse } from "next/server";

const MOVIE_LIST_CACHE_NAMESPACE = "movies:list";
const MOVIE_LIST_CACHE_TTL_SECONDS = 60;

type MoviesResponse = {
  movies: Awaited<ReturnType<typeof listMovies>>["movies"];
  pagination: {
    page: number;
    pageSize: number;
    totalMovies: number;
    totalPages: number;
  };
  filters: {
    search: string;
    sort: "latest" | "title" | "year";
    genre: string;
    genres: string[];
  };
};

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
    const cacheVersion = await getCacheVersion(MOVIE_LIST_CACHE_NAMESPACE);
    const cacheKey = `movies:list:v${cacheVersion}:${hashCacheKey(
      JSON.stringify({
        genre,
        page,
        pageSize,
        search,
        sort,
      }),
    )}`;
    const cachedPayload = await getCacheValue<MoviesResponse>(cacheKey);

    if (cachedPayload) {
      return NextResponse.json(cachedPayload, { status: 200 });
    }

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
    const payload: MoviesResponse = {
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
    };

    await setCacheValue(cacheKey, payload, MOVIE_LIST_CACHE_TTL_SECONDS);

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("[GET /api/movies]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
