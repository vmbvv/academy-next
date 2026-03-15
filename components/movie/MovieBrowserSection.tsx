"use client";

import { Calendar, Play, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type MovieSummary = {
  id: string;
  title: string;
  year: number | null;
  poster: string | null;
  released: string | null;
};

type MovieBrowserSectionProps = {
  movies: MovieSummary[];
  loading: boolean;
  error: string;
  onOpenMovie: (movieId: string) => void;
};

export function MovieBrowserSection({
  movies,
  loading,
  error,
  onOpenMovie,
}: MovieBrowserSectionProps) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-4xl font-semibold text-white">All Movies</h2>
        <span className="text-sm uppercase tracking-[0.2em] text-slate-400">
          {movies.length} showing
        </span>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`movie-skeleton-${index}`}
                className="h-[460px] animate-pulse rounded-3xl border border-slate-800 bg-slate-900/60"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-6 text-rose-100">
            {error}
          </div>
        ) : movies.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-slate-200">
            No movies found.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {movies.map((movie) => (
              <Card
                key={movie.id}
                className="group flex h-full flex-col overflow-hidden border-slate-800 bg-slate-900/70 transition hover:-translate-y-1 hover:border-amber-300/60"
              >
                <button
                  type="button"
                  onClick={() => onOpenMovie(movie.id)}
                  className="flex flex-1 flex-col text-left"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                    {movie.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                        <span className="text-3xl font-semibold text-slate-400">
                          {movie.title.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30">
                        <Play size={22} className="ml-0.5" />
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 rounded-full border border-slate-200/20 bg-black/40 px-2 py-1 text-xs text-slate-100">
                      {movie.year ?? "Classic"}
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-xl text-slate-100">
                      {movie.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="inline-flex items-center gap-2 text-sm text-slate-400">
                      <Calendar size={14} />
                      {movie.released
                        ? new Date(movie.released).toLocaleDateString()
                        : "Unknown release"}
                    </p>
                  </CardContent>
                </button>

                <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/40 px-4 py-4">
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                    <Star size={13} className="fill-current" />
                    Coming soon
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenMovie(movie.id)}
                  >
                    View details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
