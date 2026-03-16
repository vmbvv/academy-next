import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_RESTAURANT_PAGE_SIZE,
  listRestaurants,
} from "@/lib/restaurants/queries";
import { type RestaurantListFilters } from "@/lib/restaurants/types";

type RestaurantsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    cuisine?: string;
    borough?: string;
  }>;
};

function readPage(value: string | undefined) {
  const page = Number(value ?? "1");

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function readFilterValue(value: string | undefined) {
  return value?.trim() ?? "";
}

function buildPageLink(page: number, filters: RestaurantListFilters) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.cuisine) {
    params.set("cuisine", filters.cuisine);
  }

  if (filters.borough) {
    params.set("borough", filters.borough);
  }

  return `/restaurants?${params.toString()}`;
}

export default async function RestaurantsPage({
  searchParams,
}: RestaurantsPageProps) {
  const { page: rawPage, search, cuisine, borough } = await searchParams;
  const requestedPage = readPage(rawPage);

  const result = await listRestaurants({
    page: requestedPage,
    pageSize: DEFAULT_RESTAURANT_PAGE_SIZE,
    search: readFilterValue(search),
    cuisine: readFilterValue(cuisine),
    borough: readFilterValue(borough),
  });

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-slate-800">
            Restaurants
          </h1>
          <p className="text-sm text-slate-500">
            {result.totalItems.toLocaleString()} results
          </p>
        </header>

        <form className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Name
            </Label>
            <Input
              id="search"
              name="search"
              defaultValue={result.filters.search}
              placeholder="Search by name..."
              className="h-11 rounded-xl border-stone-200 bg-white px-4 text-sm text-slate-700 placeholder:text-stone-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisine" className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Cuisine
            </Label>
            <Input
              id="cuisine"
              name="cuisine"
              defaultValue={result.filters.cuisine}
              placeholder="Filter by cuisine..."
              className="h-11 rounded-xl border-stone-200 bg-white px-4 text-sm text-slate-700 placeholder:text-stone-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="borough" className="text-xs uppercase tracking-[0.18em] text-stone-500">
              Borough
            </Label>
            <Input
              id="borough"
              name="borough"
              defaultValue={result.filters.borough}
              placeholder="Filter by borough..."
              className="h-11 rounded-xl border-stone-200 bg-white px-4 text-sm text-slate-700 placeholder:text-stone-400"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="submit"
              className="h-11 rounded-xl bg-[rgb(92,61,44)] px-5 text-sm text-white hover:bg-[rgb(81,54,39)]"
            >
              Search
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-xl border-stone-200 bg-white px-5 text-sm text-slate-600 hover:bg-stone-50"
            >
              <Link href="/restaurants">Clear</Link>
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>
            Page {result.page} of {result.totalPages}
          </p>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-stone-200 bg-white px-4 text-slate-600 hover:bg-stone-50"
              >
                <Link href={buildPageLink(result.page - 1, result.filters)}>
                  Prev
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled
                className="h-10 rounded-xl border-stone-200 bg-white px-4 text-slate-400"
              >
                Prev
              </Button>
            )}

            {result.page < result.totalPages ? (
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-stone-200 bg-white px-4 text-slate-600 hover:bg-stone-50"
              >
                <Link href={buildPageLink(result.page + 1, result.filters)}>
                  Next
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled
                className="h-10 rounded-xl border-stone-200 bg-white px-4 text-slate-400"
              >
                Next
              </Button>
            )}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="hidden md:block">
            <table className="min-w-full border-collapse">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-5 py-4 text-left text-lg font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-5 py-4 text-left text-lg font-semibold text-slate-700">
                    Cuisine
                  </th>
                  <th className="px-5 py-4 text-left text-lg font-semibold text-slate-700">
                    Borough
                  </th>
                  <th className="px-5 py-4 text-left text-lg font-semibold text-slate-700">
                    Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.restaurants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-14 text-center text-sm text-slate-500"
                    >
                      No restaurants matched your filters.
                    </td>
                  </tr>
                ) : (
                  result.restaurants.map((restaurant) => (
                    <tr key={restaurant.id} className="border-t border-stone-100">
                      <td className="px-5 py-4 align-top">
                        <Link
                          href={`/restaurants/${restaurant.id}`}
                          className="font-serif text-[1.75rem] leading-none text-[#2459f2] hover:text-[#1943be]"
                        >
                          {restaurant.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-slate-600">
                        {restaurant.cuisine}
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-slate-600">
                        {restaurant.borough}
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-slate-500">
                        {restaurant.addressText}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {result.restaurants.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-6 text-sm text-slate-500">
                No restaurants matched your filters.
              </div>
            ) : (
              result.restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.id}`}
                  className="block rounded-xl border border-stone-200 bg-white px-4 py-4"
                >
                  <div className="space-y-1.5">
                    <h2 className="font-serif text-3xl leading-none text-slate-800">
                      {restaurant.name}
                    </h2>
                    <p className="text-sm text-slate-500">{restaurant.cuisine}</p>
                    <p className="text-sm text-slate-500">{restaurant.borough}</p>
                    <p className="text-sm text-slate-400">{restaurant.addressText}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
