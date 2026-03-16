import { NextResponse } from "next/server";

import { isMongoObjectId } from "@/lib/object-id";
import { getRestaurantById } from "@/lib/restaurants/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !isMongoObjectId(id)) {
    return NextResponse.json(
      { error: "Invalid restaurant ID format" },
      { status: 400 },
    );
  }

  try {
    const restaurant = await getRestaurantById(id);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ restaurant }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/restaurants/:id]", error);
    return NextResponse.json(
      { error: "Failed to load restaurant" },
      { status: 500 },
    );
  }
}
