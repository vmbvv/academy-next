import { prisma } from "@/lib/prisma";
import { deleteCommentSchema } from "@/lib/validation/comment";
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or missing JSON body" },
      { status: 400 },
    );
  }

  const result = deleteCommentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  const { userId } = result.data;

  try {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (comment.userId !== user.id && user.role !== "ADMIN") {
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
