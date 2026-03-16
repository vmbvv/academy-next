"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";

import { useAuth } from "@/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type CommentItem = {
  id: string;
  text: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  movieId: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  reactionCounts: {
    like: number;
    dislike: number;
  };
  currentReaction: "LIKE" | "DISLIKE" | null;
};

type MovieCommentsProps = {
  movieId: string;
};

async function getErrorMessage(response: Response) {
  try {
    const data: unknown = await response.json();

    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  } catch {
    return "Request failed";
  }

  return "Request failed";
}

export function MovieComments({ movieId }: MovieCommentsProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [text, setText] = useState("");
  const [submitPending, setSubmitPending] = useState(false);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [reactionPendingId, setReactionPendingId] = useState<string | null>(
    null,
  );
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      setCommentsLoading(true);
      setCommentsError("");

      try {
        const response = await fetch(`/api/movies/${movieId}/comments`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const data: { comments: CommentItem[] } = await response.json();

        if (isMounted) {
          setComments(data.comments);
        }
      } catch (error) {
        if (isMounted) {
          setCommentsError(
            error instanceof Error ? error.message : "Failed to load comments",
          );
        }
      } finally {
        if (isMounted) {
          setCommentsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  const reloadComments = async () => {
    setCommentsLoading(true);
    setCommentsError("");

    try {
      const response = await fetch(`/api/movies/${movieId}/comments`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: { comments: CommentItem[] } = await response.json();
      setComments(data.comments);
    } catch (error) {
      setCommentsError(
        error instanceof Error ? error.message : "Failed to load comments",
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    setSubmitPending(true);
    setCommentsError("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          movieId,
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setText("");
      await reloadComments();
    } catch (error) {
      setCommentsError(
        error instanceof Error ? error.message : "Failed to create comment",
      );
    } finally {
      setSubmitPending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletePendingId(commentId);
    setCommentsError("");

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      await reloadComments();
    } catch (error) {
      setCommentsError(
        error instanceof Error ? error.message : "Failed to delete comment",
      );
    } finally {
      setDeletePendingId(null);
    }
  };

  const handleReaction = async (
    commentId: string,
    type: "LIKE" | "DISLIKE",
  ) => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    setReactionPendingId(commentId);
    setCommentsError("");

    try {
      const response = await fetch(`/api/comments/${commentId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      await reloadComments();
    } catch (error) {
      setCommentsError(
        error instanceof Error ? error.message : "Failed to react to comment",
      );
    } finally {
      setReactionPendingId(null);
    }
  };

  return (
    <>
      <Card className="border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-slate-400">
              <MessageSquare size={14} />
              Comments
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Join the discussion
            </h2>
          </div>

          <Badge variant="secondary">{comments.length} total</Badge>
        </div>

        <Separator className="my-5 bg-slate-800" />

        <div className="space-y-3">
          <Textarea
            placeholder={
              isAuthenticated
                ? "Share what you thought about this movie..."
                : "Sign in to leave a comment"
            }
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={!isAuthenticated || submitPending}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              {isLoading
                ? "Checking session..."
                : isAuthenticated
                  ? `Commenting as ${user?.name}`
                  : "You need an account to comment."}
            </p>

            <div className="flex gap-2">
              {!isAuthenticated ? (
                <Button variant="outline" onClick={() => setAuthOpen(true)}>
                  Login / Sign up
                </Button>
              ) : null}

              <Button
                onClick={() => void handleCreateComment()}
                disabled={
                  !isAuthenticated || submitPending || text.trim().length === 0
                }
              >
                {submitPending ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </div>
        </div>

        {commentsError ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {commentsError}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {commentsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`comment-skeleton-${index}`}
                className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/50"
              />
            ))
          ) : comments.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-6 text-center text-slate-300">
              No comments yet.
            </div>
          ) : (
            comments.map((comment) => {
              const canDelete =
                !!user &&
                (user.id === comment.userId || user.role === "ADMIN") &&
                !comment.deletedAt;

              return (
                <Card
                  key={comment.id}
                  className="border-slate-800 bg-slate-950/40 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{comment.user.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {canDelete ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleDeleteComment(comment.id)}
                        disabled={deletePendingId === comment.id}
                      >
                        <Trash2 size={14} />
                        {deletePendingId === comment.id ? "Deleting..." : "Delete"}
                      </Button>
                    ) : null}
                  </div>

                  <p
                    className={`mt-4 text-sm leading-7 ${
                      comment.deletedAt
                        ? "italic text-slate-400"
                        : "text-slate-200"
                    }`}
                  >
                    {comment.deletedAt || comment.text === null
                      ? "This comment was deleted."
                      : comment.text}
                  </p>

                  {!comment.deletedAt ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          comment.currentReaction === "LIKE"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => void handleReaction(comment.id, "LIKE")}
                        disabled={reactionPendingId === comment.id}
                      >
                        <ThumbsUp
                          size={14}
                          className={
                            comment.currentReaction === "LIKE" ? "fill-current" : ""
                          }
                        />
                        {comment.reactionCounts.like}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={
                          comment.currentReaction === "DISLIKE"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          void handleReaction(comment.id, "DISLIKE")
                        }
                        disabled={reactionPendingId === comment.id}
                      >
                        <ThumbsDown
                          size={14}
                          className={
                            comment.currentReaction === "DISLIKE"
                              ? "fill-current"
                              : ""
                          }
                        />
                        {comment.reactionCounts.dislike}
                      </Button>
                    </div>
                  ) : null}
                </Card>
              );
            })
          )}
        </div>
      </Card>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
