import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const latestGrade = restaurant.grades[0] ?? null;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button asChild variant="outline">
          <Link href="/restaurants">
            <ArrowLeft size={16} />
            Back
          </Link>
        </Button>

        <section className="space-y-2">
          <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
          <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Borough</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{restaurant.borough}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{restaurant.addressText}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Restaurant ID</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {restaurant.restaurantId ?? "-"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Latest grade</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {latestGrade
                ? `${latestGrade.grade ?? "-"} / ${latestGrade.score ?? "-"} / ${formatDate(latestGrade.date)}`
                : "-"}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Grades</h2>
          {restaurant.grades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No grades.</p>
          ) : (
            <div className="space-y-2">
              {restaurant.grades.map((grade, index) => (
                <div
                  key={`${grade.date ?? "grade"}-${index}`}
                  className="rounded-lg border px-4 py-3 text-sm"
                >
                  {grade.grade ?? "-"} | {grade.score ?? "-"} |{" "}
                  {formatDate(grade.date)}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
