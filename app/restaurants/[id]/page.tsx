import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import { isMongoObjectId } from "@/lib/object-id";
import { getRestaurantById } from "@/lib/restaurants/queries";

type RestaurantDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: string | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString();
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "R";
}

export default async function RestaurantDetailPage({
  params,
}: RestaurantDetailPageProps) {
  const { id } = await params;

  if (!isMongoObjectId(id)) {
    notFound();
  }

  const restaurant = await getRestaurantById(id);

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/restaurants"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to Restaurants
        </Link>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 font-serif text-2xl font-semibold text-rose-600">
                {getInitial(restaurant.name)}
              </div>

              <div className="space-y-3">
                <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-800">
                  {restaurant.name}
                </h1>

                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">
                    {restaurant.cuisine}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-slate-600">
                    <MapPin size={14} className="text-rose-500" />
                    {restaurant.borough}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                Address
              </p>
              <p className="mt-3 text-2xl text-slate-700">
                {restaurant.addressText}
              </p>
            </div>

            <div className="grid gap-3 border-t border-stone-200 pt-5 md:grid-cols-2">
              <div className="rounded-xl bg-stone-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Restaurant ID
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {restaurant.restaurantId ?? "-"}
                </p>
              </div>

              <div className="rounded-xl bg-stone-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Coordinates
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {restaurant.coordinates
                    ? `${restaurant.coordinates[1]}, ${restaurant.coordinates[0]}`
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-slate-800">
                Grades
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {restaurant.grades.length} entries
            </p>
          </div>

          {restaurant.grades.length === 0 ? (
            <p className="mt-6 rounded-xl bg-stone-50 px-4 py-5 text-sm text-slate-500">
              No grades available.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {restaurant.grades.map((grade, index) => (
                <div
                  key={`${grade.date ?? "grade"}-${index}`}
                  className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-slate-600 md:grid-cols-[110px_110px_1fr]"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-400">
                      Grade
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {grade.grade ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-400">
                      Score
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {grade.score ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-400">
                      Date
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formatDate(grade.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
