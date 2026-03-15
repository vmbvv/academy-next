import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isMongoObjectId } from "@/lib/object-id";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !isMongoObjectId(id)) {
    return NextResponse.json(
      { error: "Invalid comment ID format" },
      { status: 400 },
    );
  }

  void request;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await prisma.movieComment.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        deletedAt: true,
        updatedAt: true,
        movieId: true,
        userId: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (comment.deletedAt) {
      return NextResponse.json({ comment }, { status: 200 });
    }

    const updatedComment = await prisma.movieComment.update({
      where: { id },
      data: {
        text: null,
        deletedAt: new Date(),
      },
      select: {
        id: true,
        text: true,
        deletedAt: true,
        updatedAt: true,
        movieId: true,
        userId: true,
      },
    });

    return NextResponse.json({ comment: updatedComment }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error deleting comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
