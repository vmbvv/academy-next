import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock3 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { isMongoObjectId } from "@/lib/object-id";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MoviePageProps = {
  params: Promise<{ id: string }>;
};

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { id } = await params;

  if (!isMongoObjectId(id)) {
    notFound();
  }

  const movie = await prisma.movie.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      year: true,
      plot: true,
      fullplot: true,
      runtime: true,
      poster: true,
      released: true,
      languages: true,
      directors: true,
      genres: true,
      imdb: true,
    },
  });

  if (!movie) {
    notFound();
  }

  const description = movie.fullplot ?? movie.plot ?? "No plot available.";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="overflow-hidden border-slate-800 bg-slate-900/80">
          <div className="aspect-[2/3] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
            {movie.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={movie.poster}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl font-semibold text-slate-500">
                {movie.title.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-amber-300/80">
              Movie
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">
              {movie.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              {movie.year ? <span>{movie.year}</span> : null}
              {movie.runtime ? (
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={14} />
                  {movie.runtime} min
                </span>
              ) : null}
              {movie.released ? (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(movie.released).toLocaleDateString()}
                </span>
              ) : null}
              {typeof movie.imdb?.rating === "number" ? (
                <span>IMDb {movie.imdb.rating.toFixed(1)}</span>
              ) : null}
            </div>
          </div>

          <p className="max-w-3xl text-base leading-8 text-slate-300">
            {description}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                Directors
              </h2>
              <p className="mt-3 text-base text-slate-100">
                {movie.directors.length > 0
                  ? movie.directors.join(", ")
                  : "Unknown"}
              </p>
            </Card>

            <Card className="border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                Languages
              </h2>
              <p className="mt-3 text-base text-slate-100">
                {movie.languages.length > 0
                  ? movie.languages.join(", ")
                  : "Unknown"}
              </p>
            </Card>
          </div>

          <Card className="border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              Genres
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {movie.genres.length > 0 ? (
                movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-200"
                  >
                    {genre}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">No genres listed</span>
              )}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/">Back to movies</Link>
            </Button>
            <Button disabled>Comments soon</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
