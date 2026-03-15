"use client";

import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MovieBrowserSection,
  type MovieSummary,
} from "@/components/movie/MovieBrowserSection";

export function MovieMain() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesError, setMoviesError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "year">("title");

  useEffect(() => {
    if (!isAuthenticated) {
      setMovies([]);
      setMoviesError("");
      setMoviesLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMovies() {
      setMoviesLoading(true);
      setMoviesError("");

      try {
        const response = await fetch("/api/movies", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const data: { error?: string } = await response.json();
          throw new Error(data.error ?? "Failed to load movies");
        }

        const data: { movies: MovieSummary[] } = await response.json();

        if (isMounted) {
          setMovies(data.movies);
        }
      } catch (error) {
        if (isMounted) {
          setMoviesError(
            error instanceof Error ? error.message : "Failed to load movies",
          );
        }
      } finally {
        if (isMounted) {
          setMoviesLoading(false);
        }
      }
    }

    void loadMovies();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const visibleMovies = useMemo(() => {
    const search = searchInput.trim().toLowerCase();

    const filtered = search
      ? movies.filter((movie) =>
          movie.title.toLowerCase().includes(search),
        )
      : movies;

    return [...filtered].sort((left, right) => {
      if (sortBy === "year") {
        return (right.year ?? 0) - (left.year ?? 0);
      }

      return left.title.localeCompare(right.title);
    });
  }, [movies, searchInput, sortBy]);

  const handleAddMovieClick = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(234,179,8,0.09),_transparent_45%)]" />
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1300px] px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-white md:text-6xl">
              Erxes Movie
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Badge variant="secondary">{user?.name}</Badge>
                <Button variant="outline" onClick={() => void logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setAuthOpen(true)}>
                Login / Sign up
              </Button>
            )}

            <Button
              type="button"
              onClick={handleAddMovieClick}
              className="inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Add Movie
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="mt-8 rounded-3xl border border-slate-800/90 bg-slate-900/70 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white">Loading session</h2>
          </div>
        ) : !isAuthenticated ? (
          <div className="mt-8 rounded-3xl border border-slate-800/90 bg-slate-900/70 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white">
              Sign in to browse movies
            </h2>
            <Button className="mt-6" onClick={() => setAuthOpen(true)}>
              Login / Sign up
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search title..."
              />

              <Button
                type="button"
                variant={sortBy === "title" ? "default" : "outline"}
                onClick={() => setSortBy("title")}
              >
                Title
              </Button>

              <Button
                type="button"
                variant={sortBy === "year" ? "default" : "outline"}
                onClick={() => setSortBy("year")}
              >
                Year
              </Button>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-800/90 bg-slate-900/70 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" className="inline-flex items-center gap-2">
                  <Clapperboard size={16} />
                  All Movies
                </Button>
              </div>
            </div>

            <MovieBrowserSection
              movies={visibleMovies}
              loading={moviesLoading}
              error={moviesError}
              onOpenMovie={(movieId) => router.push(`/movies/${movieId}`)}
            />
          </>
        )}
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
