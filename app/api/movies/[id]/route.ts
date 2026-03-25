import { isMongoObjectId } from "@/lib/object-id";
import { getMovieDetail } from "@/lib/movies/get-movie-detail";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  //reject invalid Mongo ObjectId format with 400
  if (!id || !isMongoObjectId(id)) {
    return NextResponse.json(
      { error: "Invalid movie ID format" },
      { status: 400 },
    );
  }

  try {
    const movie = await getMovieDetail(id);

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json({ movie }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch movie", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
