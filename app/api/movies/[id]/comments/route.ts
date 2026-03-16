import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isMongoObjectId } from "@/lib/object-id";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
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

    const movie = await prisma.movie.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const comments = await prisma.movieComment.findMany({
      where: { movieId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        text: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        movieId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        reactions: {
          select: {
            userId: true,
            type: true,
          },
        },
      },
    });

    const normalizedComments = comments.map((comment) => {
      const likeCount = comment.reactions.filter(
        (reaction) => reaction.type === "LIKE",
      ).length;
      const dislikeCount = comment.reactions.filter(
        (reaction) => reaction.type === "DISLIKE",
      ).length;
      const currentReaction =
        comment.reactions.find(
          (reaction) => reaction.userId === currentUser?.id,
        )?.type ?? null;

      return {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        deletedAt: comment.deletedAt,
        movieId: comment.movieId,
        userId: comment.userId,
        user: comment.user,
        reactionCounts: {
          like: likeCount,
          dislike: dislikeCount,
        },
        currentReaction,
      };
    });

    return NextResponse.json({ comments: normalizedComments }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/movies/[id]/comments]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
