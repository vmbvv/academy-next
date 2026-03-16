import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isMongoObjectId } from "@/lib/object-id";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  void request;

  if (!id || !isMongoObjectId(id)) {
    return NextResponse.json(
      { error: "Invalid movie ID format" },
      { status: 400 },
    );
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const movie = await prisma.movie.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
      },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    await prisma.movie.delete({
      where: { id },
    });

    return NextResponse.json({ movie }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/admin/movies/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
