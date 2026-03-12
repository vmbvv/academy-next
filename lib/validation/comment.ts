import { isMongoObjectId } from "@/lib/object-id";
import { z } from "zod";

export const createCommentSchema = z.object({
  movieId: z.string().refine(isMongoObjectId, {
    message: "movieId is not a valid ObjectId",
  }),
  userId: z.string().refine(isMongoObjectId, {
    message: "userId is not a valid ObjectId",
  }),
  text: z
    .string()
    .trim()
    .min(1, "text cannot be empty")
    .max(600, "text must be 600 characters or fewer"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const deleteCommentSchema = z.object({
  userId: z.string().refine(isMongoObjectId, {
    message: "userId is not a valid ObjectId",
  }),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
