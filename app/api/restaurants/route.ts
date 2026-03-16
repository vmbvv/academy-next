import { NextResponse } from "next/server";

import { listRestaurants } from "@/lib/restaurants/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = 12;

  try {
    const { restaurants, totalItems } = await listRestaurants({
      page,
      pageSize,
    });

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json(
      {
        restaurants,
        pagination: {
          page,
          pageSize,
          totalRestaurants: totalItems,
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/restaurants]", error);
    return NextResponse.json(
      { error: "Failed to load restaurants" },
      { status: 500 },
    );
  }
}
