"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Shield, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminMovie = {
  id: string;
  title: string;
  year: number | null;
  released: string | null;
  genres: string[];
};

type AdminComment = {
  id: string;
  text: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  movie: {
    id: string;
    title: string;
  };
};

type MovieListResponse = {
  movies: AdminMovie[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search: string;
    sort: string;
    genre: string;
    genres: string[];
  };
};

type CommentListResponse = {
  comments: AdminComment[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search: string;
    status: string;
    sort: string;
  };
};

type MovieDraft = {
  title: string;
  year: string;
  plot: string;
  poster: string;
  runtime: string;
  genres: string;
  languages: string;
  directors: string;
  cast: string;
};

const initialMovieDraft: MovieDraft = {
  title: "",
  year: "",
  plot: "",
  poster: "",
  runtime: "",
  genres: "",
  languages: "",
  directors: "",
  cast: "",
};

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getErrorMessage(response: Response) {
  try {
    const data: unknown = await response.json();

    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  } catch {
    return "Request failed";
  }

  return "Request failed";
}

export function AdminPanel() {
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [movieGenres, setMovieGenres] = useState<string[]>([]);
  const [moviePage, setMoviePage] = useState(1);
  const [movieTotalPages, setMovieTotalPages] = useState(1);
  const [movieTotalItems, setMovieTotalItems] = useState(0);
  const [movieSearchInput, setMovieSearchInput] = useState("");
  const [movieSearch, setMovieSearch] = useState("");
  const [movieSort, setMovieSort] = useState<
    "newest" | "title" | "year" | "released"
  >("newest");
  const [movieGenre, setMovieGenre] = useState("");
  const [loadingMovies, setLoadingMovies] = useState(true);

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [commentTotalItems, setCommentTotalItems] = useState(0);
  const [commentSearchInput, setCommentSearchInput] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [commentStatus, setCommentStatus] = useState<
    "all" | "active" | "deleted"
  >("all");
  const [commentSort, setCommentSort] = useState<"newest" | "oldest">(
    "newest",
  );
  const [loadingComments, setLoadingComments] = useState(true);

  const [error, setError] = useState("");
  const [movieDraft, setMovieDraft] = useState<MovieDraft>(initialMovieDraft);
  const [submitPending, setSubmitPending] = useState(false);
  const [deletingMovieId, setDeletingMovieId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMovieSearch(movieSearchInput.trim());
      setMoviePage(1);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [movieSearchInput]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCommentSearch(commentSearchInput.trim());
      setCommentPage(1);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [commentSearchInput]);

  const loadMovies = useCallback(async () => {
    setLoadingMovies(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(moviePage),
        sort: movieSort,
      });

      if (movieSearch) {
        params.set("search", movieSearch);
      }

      if (movieGenre) {
        params.set("genre", movieGenre);
      }

      const response = await fetch(`/api/admin/movies?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: MovieListResponse = await response.json();
      setMovies(data.movies);
      setMovieGenres(data.filters.genres);
      setMovieTotalPages(data.pagination.totalPages);
      setMovieTotalItems(data.pagination.totalItems);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load movies",
      );
    } finally {
      setLoadingMovies(false);
    }
  }, [movieGenre, moviePage, movieSearch, movieSort]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(commentPage),
        sort: commentSort,
        status: commentStatus,
      });

      if (commentSearch) {
        params.set("search", commentSearch);
      }

      const response = await fetch(`/api/admin/comments?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: CommentListResponse = await response.json();
      setComments(data.comments);
      setCommentTotalPages(data.pagination.totalPages);
      setCommentTotalItems(data.pagination.totalItems);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load comments",
      );
    } finally {
      setLoadingComments(false);
    }
  }, [commentPage, commentSearch, commentSort, commentStatus]);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const refreshAll = async () => {
    await Promise.all([loadMovies(), loadComments()]);
  };

  const handleCreateMovie = async () => {
    setSubmitPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: movieDraft.title,
          year: movieDraft.year ? Number(movieDraft.year) : undefined,
          plot: movieDraft.plot,
          poster: movieDraft.poster,
          runtime: movieDraft.runtime ? Number(movieDraft.runtime) : undefined,
          genres: parseList(movieDraft.genres),
          languages: parseList(movieDraft.languages),
          directors: parseList(movieDraft.directors),
          cast: parseList(movieDraft.cast),
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setMovieDraft(initialMovieDraft);
      setMoviePage(1);
      setMovieSort("newest");
      setMovieSearchInput("");
      setMovieSearch("");
      setMovieGenre("");
      await Promise.all([loadMovies(), loadComments()]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create movie",
      );
    } finally {
      setSubmitPending(false);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    setDeletingMovieId(movieId);
    setError("");

    try {
      const response = await fetch(`/api/admin/movies/${movieId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      await Promise.all([loadMovies(), loadComments()]);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete movie",
      );
    } finally {
      setDeletingMovieId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    setError("");

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      await loadComments();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete comment",
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300/80">
              Admin
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-4xl font-semibold text-white">
              <Shield size={28} />
              Admin Panel
            </h1>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/">Back to movies</Link>
            </Button>
            <Button
              onClick={() => void refreshAll()}
              disabled={loadingMovies || loadingComments}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle>Add movie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-title">Title</Label>
                <Input
                  id="admin-title"
                  value={movieDraft.title}
                  onChange={(event) =>
                    setMovieDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-year">Year</Label>
                  <Input
                    id="admin-year"
                    value={movieDraft.year}
                    onChange={(event) =>
                      setMovieDraft((current) => ({
                        ...current,
                        year: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-runtime">Runtime</Label>
                  <Input
                    id="admin-runtime"
                    value={movieDraft.runtime}
                    onChange={(event) =>
                      setMovieDraft((current) => ({
                        ...current,
                        runtime: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-poster">Poster URL</Label>
                <Input
                  id="admin-poster"
                  value={movieDraft.poster}
                  onChange={(event) =>
                    setMovieDraft((current) => ({
                      ...current,
                      poster: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-plot">Plot</Label>
                <Textarea
                  id="admin-plot"
                  value={movieDraft.plot}
                  onChange={(event) =>
                    setMovieDraft((current) => ({
                      ...current,
                      plot: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-genres">Genres</Label>
                <Input
                  id="admin-genres"
                  placeholder="Drama, Thriller, Comedy"
                  value={movieDraft.genres}
                  onChange={(event) =>
                    setMovieDraft((current) => ({
                      ...current,
                      genres: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-languages">Languages</Label>
                <Input
                  id="admin-languages"
                  placeholder="English, French"
                  value={movieDraft.languages}
                  onChange={(event) =>
                    setMovieDraft((current) => ({
                      ...current,
                      languages: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-directors">Directors</Label>
                <Input
                  id="admin-directors"
                  placeholder="Director One, Director Two"
                  value={movieDraft.directors}
                  onChange={(event) =>
                    setMovieDraft((current) => ({
                      ...current,
                      directors: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-cast">Cast</Label>
                <Input
                  id="admin-cast"
                  placeholder="Actor One, Actor Two"
                  value={movieDraft.cast}
                  onChange={(event) =>
                    setMovieDraft((current) => ({
                      ...current,
                      cast: event.target.value,
                    }))
                  }
                />
              </div>

              <Button
                className="w-full"
                onClick={() => void handleCreateMovie()}
                disabled={submitPending || movieDraft.title.trim().length === 0}
              >
                {submitPending ? "Creating..." : "Create movie"}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-slate-800 bg-slate-900/70">
              <CardHeader>
                <CardTitle>Manage movies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                  <Input
                    placeholder="Search movies..."
                    value={movieSearchInput}
                    onChange={(event) => setMovieSearchInput(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant={movieSort === "newest" ? "default" : "outline"}
                    onClick={() => {
                      setMovieSort("newest");
                      setMoviePage(1);
                    }}
                  >
                    Newest
                  </Button>
                  <Button
                    type="button"
                    variant={movieSort === "title" ? "default" : "outline"}
                    onClick={() => {
                      setMovieSort("title");
                      setMoviePage(1);
                    }}
                  >
                    Title
                  </Button>
                  <Button
                    type="button"
                    variant={movieSort === "year" ? "default" : "outline"}
                    onClick={() => {
                      setMovieSort("year");
                      setMoviePage(1);
                    }}
                  >
                    Year
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={movieGenre === "" ? "default" : "outline"}
                    onClick={() => {
                      setMovieGenre("");
                      setMoviePage(1);
                    }}
                  >
                    All genres
                  </Button>
                  {movieGenres.map((genre) => (
                    <Button
                      key={genre}
                      type="button"
                      variant={movieGenre === genre ? "default" : "outline"}
                      onClick={() => {
                        setMovieGenre(genre);
                        setMoviePage(1);
                      }}
                    >
                      {genre}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>{movieTotalItems} movies</span>
                  <span>
                    Page {moviePage} of {movieTotalPages}
                  </span>
                </div>

                <div className="space-y-3">
                  {loadingMovies ? (
                    <div className="text-sm text-slate-400">Loading movies...</div>
                  ) : movies.length === 0 ? (
                    <div className="text-sm text-slate-400">No movies found.</div>
                  ) : (
                    movies.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-white">{movie.title}</p>
                          <p className="text-sm text-slate-400">
                            {movie.year ?? "Unknown year"}
                            {movie.genres.length > 0
                              ? ` · ${movie.genres.join(", ")}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/movies/${movie.id}`}>Open</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleDeleteMovie(movie.id)}
                            disabled={deletingMovieId === movie.id}
                          >
                            <Trash2 size={14} />
                            {deletingMovieId === movie.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setMoviePage((current) => Math.max(1, current - 1))
                    }
                    disabled={moviePage === 1 || loadingMovies}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setMoviePage((current) =>
                        Math.min(movieTotalPages, current + 1),
                      )
                    }
                    disabled={moviePage >= movieTotalPages || loadingMovies}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/70">
              <CardHeader>
                <CardTitle>Moderate comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                  <Input
                    placeholder="Search comments, movie title, user..."
                    value={commentSearchInput}
                    onChange={(event) =>
                      setCommentSearchInput(event.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant={commentStatus === "all" ? "default" : "outline"}
                    onClick={() => {
                      setCommentStatus("all");
                      setCommentPage(1);
                    }}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant={commentStatus === "active" ? "default" : "outline"}
                    onClick={() => {
                      setCommentStatus("active");
                      setCommentPage(1);
                    }}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={commentStatus === "deleted" ? "default" : "outline"}
                    onClick={() => {
                      setCommentStatus("deleted");
                      setCommentPage(1);
                    }}
                  >
                    Deleted
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={commentSort === "newest" ? "default" : "outline"}
                    onClick={() => {
                      setCommentSort("newest");
                      setCommentPage(1);
                    }}
                  >
                    Newest
                  </Button>
                  <Button
                    type="button"
                    variant={commentSort === "oldest" ? "default" : "outline"}
                    onClick={() => {
                      setCommentSort("oldest");
                      setCommentPage(1);
                    }}
                  >
                    Oldest
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>{commentTotalItems} comments</span>
                  <span>
                    Page {commentPage} of {commentTotalPages}
                  </span>
                </div>

                <div className="space-y-3">
                  {loadingComments ? (
                    <div className="text-sm text-slate-400">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-sm text-slate-400">
                      No comments found.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">
                              {comment.user.name} on {comment.movie.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleDeleteComment(comment.id)}
                            disabled={
                              deletingCommentId === comment.id ||
                              comment.deletedAt !== null
                            }
                          >
                            <Trash2 size={14} />
                            {comment.deletedAt
                              ? "Deleted"
                              : deletingCommentId === comment.id
                                ? "Deleting..."
                                : "Delete"}
                          </Button>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-slate-300">
                          {comment.deletedAt || comment.text === null
                            ? "This comment was deleted."
                            : comment.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setCommentPage((current) => Math.max(1, current - 1))
                    }
                    disabled={commentPage === 1 || loadingComments}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setCommentPage((current) =>
                        Math.min(commentTotalPages, current + 1),
                      )
                    }
                    disabled={
                      commentPage >= commentTotalPages || loadingComments
                    }
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
