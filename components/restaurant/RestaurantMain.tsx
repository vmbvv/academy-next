"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type RestaurantSummary } from "@/lib/restaurants/types";

type RestaurantsResponse = {
  restaurants: RestaurantSummary[];
  pagination: {
    page: number;
    totalPages: number;
    totalRestaurants: number;
  };
};

export function RestaurantMain() {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRestaurants, setTotalRestaurants] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRestaurants() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/restaurants?page=${page}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          const data: { error?: string } = await response.json();
          throw new Error(data.error ?? "Failed to load restaurants");
        }

        const data: RestaurantsResponse = await response.json();
        setRestaurants(data.restaurants);
        setTotalPages(data.pagination.totalPages);
        setTotalRestaurants(data.pagination.totalRestaurants);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load restaurants",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRestaurants();

    return () => {
      controller.abort();
    };
  }, [page]);

  function goToPreviousPage() {
    setPage((currentPage) => Math.max(1, currentPage - 1));
  }

  function goToNextPage() {
    setPage((currentPage) => Math.min(totalPages, currentPage + 1));
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Restaurants</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${totalRestaurants} results`}
          </p>
        </header>

        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Page {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousPage}
              disabled={page === 1 || loading}
            >
              Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={goToNextPage}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>

        <section>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`restaurant-skeleton-${index}`}
                  className="h-40 animate-pulse rounded-lg border bg-muted/40"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="rounded-lg border px-4 py-6 text-sm text-muted-foreground">
              No results.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="py-0">
                  <CardHeader className="pb-2">
                    <CardTitle>{restaurant.name}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2 pb-4 text-sm text-muted-foreground">
                    <p>{restaurant.cuisine}</p>
                    <p>{restaurant.borough}</p>
                    <p>{restaurant.addressText}</p>
                  </CardContent>

                  <CardFooter className="justify-end">
                    <Button asChild variant="outline">
                      <Link href={`/restaurants/${restaurant.id}`}>Open</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
