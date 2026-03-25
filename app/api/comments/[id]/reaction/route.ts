import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isMongoObjectId } from "@/lib/object-id";
import { prisma } from "@/lib/prisma";
import { getClientIp, normalizeIdentifierPart } from "@/lib/request";
import {
  drainRateLimit,
  getRetryAfterSeconds,
  rateLimit,
} from "@/lib/rate-limit";
import { commentReactionSchema } from "@/lib/validation/comment";
import { NextResponse } from "next/server";

async function getReactionSummary(commentId: string, userId: string) {
  const reactions = await prisma.commentReaction.findMany({
    where: { commentId },
    select: {
      userId: true,
      type: true,
    },
  });

  const likes = reactions.filter((reaction) => reaction.type === "LIKE").length;
  const dislikes = reactions.filter(
    (reaction) => reaction.type === "DISLIKE",
  ).length;
  const currentReaction =
    reactions.find((reaction) => reaction.userId === userId)?.type ?? null;

  return {
    like: likes,
    dislike: dislikes,
    currentReaction,
  };
}

export async function POST(
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

  const result = commentReactionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(
      "commentReaction",
      `${normalizeIdentifierPart(currentUser.id)}:${normalizeIdentifierPart(getClientIp(request))}`,
    );

    drainRateLimit(rateLimitResult);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many reactions in a short time. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(getRetryAfterSeconds(rateLimitResult.reset)),
          },
        },
      );
    }

    const comment = await prisma.movieComment.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.deletedAt) {
      return NextResponse.json(
        { error: "Deleted comments cannot be reacted to" },
        { status: 409 },
      );
    }

    const existingReaction = await prisma.commentReaction.findFirst({
      where: {
        commentId: id,
        userId: currentUser.id,
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (existingReaction?.type === result.data.type) {
      await prisma.commentReaction.delete({
        where: { id: existingReaction.id },
      });
    } else if (existingReaction) {
      await prisma.commentReaction.update({
        where: { id: existingReaction.id },
        data: { type: result.data.type },
      });
    } else {
      await prisma.commentReaction.create({
        data: {
          commentId: id,
          userId: currentUser.id,
          type: result.data.type,
        },
      });
    }

    const reactionSummary = await getReactionSummary(id, currentUser.id);

    return NextResponse.json({ reactionSummary }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/comments/[id]/reaction]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
