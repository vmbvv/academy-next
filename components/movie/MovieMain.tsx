"use client";

import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";
import Link from "next/link";
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
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "title" | "year">("latest");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  useEffect(() => {
    let isMounted = true;

    async function loadMovies() {
      setMoviesLoading(true);
      setMoviesError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          sort: sortBy,
        });

        if (search) {
          params.set("search", search);
        }

        if (selectedGenre) {
          params.set("genre", selectedGenre);
        }

        const response = await fetch(`/api/movies?${params.toString()}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const data: { error?: string } = await response.json();
          throw new Error(data.error ?? "Failed to load movies");
        }

        const data: {
          movies: MovieSummary[];
          pagination: {
            page: number;
            totalPages: number;
          };
          filters: {
            genres: string[];
          };
        } = await response.json();

        if (isMounted) {
          setMovies(data.movies);
          setAvailableGenres(data.filters.genres);
          setTotalPages(data.pagination.totalPages);
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
  }, [page, search, selectedGenre, sortBy]);

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
                {user?.role === "ADMIN" ? (
                  <Button asChild variant="outline">
                    <Link href="/admin">Admin</Link>
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => void logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setAuthOpen(true)}>
                Login / Sign up
              </Button>
            )}
          </div>
        </header>

        {!isAuthenticated && !isLoading ? (
          <div className="mt-8 rounded-3xl border border-slate-800/90 bg-slate-900/70 p-6 text-slate-200">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Guest mode
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Browse the catalog freely. Sign in when you want to comment and
                manage your activity.
              </p>
              <Button onClick={() => setAuthOpen(true)}>Login / Sign up</Button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title..."
          />

          <Button
            type="button"
            variant={sortBy === "latest" ? "default" : "outline"}
            onClick={() => {
              setSortBy("latest");
              setPage(1);
            }}
          >
            Latest
          </Button>

          <Button
            type="button"
            variant={sortBy === "year" ? "default" : "outline"}
            onClick={() => {
              setSortBy("year");
              setPage(1);
            }}
          >
            Year
          </Button>

          <Button
            type="button"
            variant={sortBy === "title" ? "default" : "outline"}
            onClick={() => {
              setSortBy("title");
              setPage(1);
            }}
          >
            Title
          </Button>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800/90 bg-slate-900/70 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="inline-flex items-center gap-2"
              onClick={() => {
                setSelectedGenre("");
                setPage(1);
              }}
            >
              <Clapperboard size={16} />
              All Movies
            </Button>

            {availableGenres.map((genre) => (
              <Button
                key={genre}
                type="button"
                variant={selectedGenre === genre ? "default" : "outline"}
                onClick={() => {
                  setSelectedGenre(genre);
                  setPage(1);
                }}
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        <MovieBrowserSection
          movies={movies}
          loading={moviesLoading}
          error={moviesError}
          onOpenMovie={(movieId) => router.push(`/movies/${movieId}`)}
        />

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1 || moviesLoading}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages || moviesLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
