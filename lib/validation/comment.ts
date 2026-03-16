import { isMongoObjectId } from "@/lib/object-id";
import { z } from "zod";

export const createCommentSchema = z.object({
  movieId: z.string().refine(isMongoObjectId, {
    message: "movieId is not a valid ObjectId",
  }),
  text: z
    .string()
    .trim()
    .min(1, "text cannot be empty")
    .max(600, "text must be 600 characters or fewer"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentReactionSchema = z.object({
  type: z.enum(["LIKE", "DISLIKE"]),
});

export type CommentReactionInput = z.infer<typeof commentReactionSchema>;
