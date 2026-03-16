import { NextResponse } from "next/server";

import {
  DEFAULT_RESTAURANT_PAGE_SIZE,
  listRestaurants,
} from "@/lib/restaurants/queries";

function readPage(value: string | null) {
  const page = Number(value ?? "1");

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function readFilterValue(value: string | null) {
  return value?.trim() ?? "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = readPage(url.searchParams.get("page"));
  const search = readFilterValue(url.searchParams.get("search"));
  const cuisine = readFilterValue(url.searchParams.get("cuisine"));
  const borough = readFilterValue(url.searchParams.get("borough"));

  try {
    // console.log(url.searchParams.get("page"));

    const result = await listRestaurants({
      page,
      pageSize: DEFAULT_RESTAURANT_PAGE_SIZE,
      search,
      cuisine,
      borough,
    });

    return NextResponse.json(
      {
        restaurants: result.restaurants,
        filters: result.filters,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalRestaurants: result.totalItems,
          totalPages: result.totalPages,
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
