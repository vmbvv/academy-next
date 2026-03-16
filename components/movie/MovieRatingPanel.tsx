"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { useAuth } from "@/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RatingSummary = {
  averageRating: number | null;
  ratingsCount: number;
  userRating: number | null;
};

type MovieRatingPanelProps = {
  movieId: string;
};

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

export function MovieRatingPanel({ movieId }: MovieRatingPanelProps) {
  const { isAuthenticated, isLoading } = useAuth();

  const [summary, setSummary] = useState<RatingSummary>({
    averageRating: null,
    ratingsCount: 0,
    userRating: null,
  });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRatingSummary() {
      setLoadingSummary(true);
      setError("");

      try {
        const response = await fetch(`/api/movies/${movieId}/rating`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const data: { ratingSummary: RatingSummary } = await response.json();

        if (isMounted) {
          setSummary(data.ratingSummary);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load ratings",
          );
        }
      } finally {
        if (isMounted) {
          setLoadingSummary(false);
        }
      }
    }

    void loadRatingSummary();

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  const saveRating = async (value: number) => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/movies/${movieId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: { ratingSummary: RatingSummary } = await response.json();
      setSummary(data.ratingSummary);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save rating",
      );
    } finally {
      setPending(false);
    }
  };

  const clearRating = async () => {
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/movies/${movieId}/rating`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: { ratingSummary: RatingSummary } = await response.json();
      setSummary(data.ratingSummary);
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Failed to clear rating",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Card className="border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              Rating
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Rate this movie
            </h2>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold text-white">
              {loadingSummary
                ? "..."
                : summary.averageRating !== null
                  ? summary.averageRating.toFixed(1)
                  : "—"}
            </p>
            <p className="text-sm text-slate-400">
              {summary.ratingsCount} rating
              {summary.ratingsCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const isActive = summary.userRating === value;

            return (
              <Button
                key={value}
                type="button"
                variant={isActive ? "default" : "outline"}
                onClick={() =>
                  void (isActive ? clearRating() : saveRating(value))
                }
                disabled={pending || isLoading}
              >
                <Star size={14} className={isActive ? "fill-current" : ""} />
                {value}
              </Button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-slate-400">
          {isLoading
            ? "Checking session..."
            : isAuthenticated
              ? summary.userRating
                ? `Your rating: ${summary.userRating}/5`
                : "Choose a score from 1 to 5."
              : "Sign in to leave a rating."}
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </Card>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
