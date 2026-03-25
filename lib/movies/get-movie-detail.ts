import "server-only";

import { deleteCacheValue, getCacheValue, setCacheValue } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

const MOVIE_DETAIL_CACHE_TTL_SECONDS = 60 * 15;

function getMovieDetailCacheKey(id: string) {
  return `movie:detail:${id}`;
}

async function fetchMovieDetailFromDatabase(id: string) {
  return prisma.movie.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      year: true,
      plot: true,
      fullplot: true,
      genres: true,
      runtime: true,
      poster: true,
      released: true,
      languages: true,
      directors: true,
      imdb: true,
      tomatoes: true,
    },
  });
}

export type MovieDetail = NonNullable<
  Awaited<ReturnType<typeof fetchMovieDetailFromDatabase>>
>;

export async function getMovieDetail(id: string) {
  const cacheKey = getMovieDetailCacheKey(id);
  const cachedMovie = await getCacheValue<MovieDetail>(cacheKey);

  if (cachedMovie) {
    return cachedMovie;
  }

  const movie = await fetchMovieDetailFromDatabase(id);

  if (movie) {
    await setCacheValue(cacheKey, movie, MOVIE_DETAIL_CACHE_TTL_SECONDS);
  }

  return movie;
}

export async function invalidateMovieDetailCache(id: string) {
  await deleteCacheValue(getMovieDetailCacheKey(id));
}
