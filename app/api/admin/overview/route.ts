import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  void request;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [movies, comments] = await Promise.all([
      prisma.movie.findMany({
        take: 12,
        orderBy: { id: "desc" },
        select: {
          id: true,
          title: true,
          year: true,
          released: true,
        },
      }),
      prisma.movieComment.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          text: true,
          deletedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          movie: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ movies, comments }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/admin/overview]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
