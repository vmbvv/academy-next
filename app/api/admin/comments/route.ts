import { type Prisma } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const status = url.searchParams.get("status") ?? "all";
  const sort = url.searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = 10;

  const where: Prisma.MovieCommentWhereInput = {};

  if (status === "active") {
    where.deletedAt = null;
  } else if (status === "deleted") {
    where.NOT = { deletedAt: null };
  }

  if (search) {
    where.OR = [
      {
        text: {
          contains: search,
        },
      },
      {
        user: {
          is: {
            name: {
              contains: search,
            },
          },
        },
      },
      {
        movie: {
          is: {
            title: {
              contains: search,
            },
          },
        },
      },
    ];
  }

  const orderBy: Prisma.MovieCommentOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [comments, totalComments] = await Promise.all([
      prisma.movieComment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          text: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
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
      prisma.movieComment.count({ where }),
    ]);

    return NextResponse.json(
      {
        comments,
        pagination: {
          page,
          pageSize,
          totalItems: totalComments,
          totalPages: Math.max(1, Math.ceil(totalComments / pageSize)),
        },
        filters: {
          search,
          status,
          sort,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/comments]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
