import "server-only";

import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type RawMovieListItem = {
  _id?: { $oid?: string };
  title?: unknown;
  year?: unknown;
  poster?: unknown;
  released?: { $date?: string } | string | null;
  genres?: unknown;
};

type MovieListSort = "latest" | "newest" | "released" | "title" | "year";

type ListMoviesOptions = {
  search: string;
  genre: string;
  sort: MovieListSort;
  page: number;
  pageSize: number;
  genreLimit: number;
  includePoster?: boolean;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseRawMovie(rawMovie: RawMovieListItem) {
  const id = rawMovie._id?.$oid ?? "";
  const title = typeof rawMovie.title === "string" ? rawMovie.title : "Untitled";
  const year = typeof rawMovie.year === "number" ? rawMovie.year : null;
  const poster = typeof rawMovie.poster === "string" ? rawMovie.poster : null;
  const released =
    rawMovie.released &&
    typeof rawMovie.released === "object" &&
    "$date" in rawMovie.released &&
    typeof rawMovie.released.$date === "string"
      ? rawMovie.released.$date
      : typeof rawMovie.released === "string"
        ? rawMovie.released
        : null;
  const genres = Array.isArray(rawMovie.genres)
    ? rawMovie.genres.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id,
    title,
    year,
    poster,
    released,
    genres,
  };
}

function buildSortStage(sort: MovieListSort): Prisma.InputJsonObject {
  if (sort === "title") {
    return { title: 1 as const, _id: -1 as const };
  }

  if (sort === "year") {
    return {
      normalizedYear: -1 as const,
      title: 1 as const,
      _id: -1 as const,
    };
  }

  if (sort === "released") {
    return {
      normalizedReleased: -1 as const,
      title: 1 as const,
      _id: -1 as const,
    };
  }

  return { _id: -1 as const };
}

export async function listMovies(options: ListMoviesOptions) {
  const matchFilters: Record<string, unknown> = {};

  if (options.search) {
    matchFilters.title = {
      $regex: escapeRegex(options.search),
      $options: "i",
    };
  }

  if (options.genre) {
    matchFilters.genres = options.genre;
  }

  const matchStage: Prisma.InputJsonObject = {
    $match: matchFilters as Prisma.InputJsonObject,
  };

  const addFieldsStage: Prisma.InputJsonObject = {
    normalizedYear: {
      $convert: {
        input: "$year",
        to: "int",
        onError: null,
        onNull: null,
      },
    },
    normalizedReleased: {
      $convert: {
        input: "$released",
        to: "date",
        onError: null,
        onNull: null,
      },
    },
  };

  const movieProjectStage: Prisma.InputJsonObject = {
    _id: 1,
    title: 1,
    year: "$normalizedYear",
    released: "$normalizedReleased",
    genres: 1,
    ...(options.includePoster ? { poster: 1 } : {}),
  };

  const moviePipeline: Prisma.InputJsonObject[] = [
    ...(Object.keys(matchFilters).length > 0 ? [matchStage] : []),
    { $addFields: addFieldsStage },
    {
      $facet: {
        items: [
          { $sort: buildSortStage(options.sort) },
          { $skip: (options.page - 1) * options.pageSize },
          { $limit: options.pageSize },
          { $project: movieProjectStage },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [rawMovieListResult, rawGenres] = await Promise.all([
    prisma.movie.aggregateRaw({
      pipeline: moviePipeline,
    }),
    prisma.movie.aggregateRaw({
      pipeline: [
        { $unwind: "$genres" },
        { $group: { _id: "$genres" } },
        { $sort: { _id: 1 } },
        { $limit: options.genreLimit },
      ],
    }),
  ]);

  const movieListResult = Array.isArray(rawMovieListResult)
    ? rawMovieListResult
    : [];
  const firstFacet =
    movieListResult.length > 0 &&
    movieListResult[0] &&
    typeof movieListResult[0] === "object"
      ? movieListResult[0]
      : null;

  const rawMovies =
    firstFacet &&
    "items" in firstFacet &&
    Array.isArray(firstFacet.items)
      ? (firstFacet.items as RawMovieListItem[])
      : [];
  const totalItems =
    firstFacet &&
    "totalCount" in firstFacet &&
    Array.isArray(firstFacet.totalCount) &&
    firstFacet.totalCount[0] &&
    typeof firstFacet.totalCount[0] === "object" &&
    "count" in firstFacet.totalCount[0] &&
    typeof firstFacet.totalCount[0].count === "number"
      ? firstFacet.totalCount[0].count
      : 0;

  const movies = rawMovies
    .map(parseRawMovie)
    .filter((movie) => movie.id.length > 0);

  const genreEntries = Array.isArray(rawGenres) ? rawGenres : [];
  const genres = genreEntries
    .map((entry) =>
      entry && typeof entry === "object" && "_id" in entry ? entry._id : null,
    )
    .filter((value): value is string => typeof value === "string");

  return {
    movies,
    totalItems,
    genres,
  };
}
