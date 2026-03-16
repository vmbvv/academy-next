import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const movieRatingSchema = z.object({
  value: z.number().int().min(1).max(5),
});

export type MovieRatingInput = z.infer<typeof movieRatingSchema>;

export const createMovieSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  year: z.number().int().min(1888).max(2100).optional(),
  plot: optionalTrimmedString,
  fullplot: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  poster: optionalTrimmedString,
  runtime: z.number().int().min(1).max(1000).optional(),
  released: z
    .string()
    .datetime()
    .optional()
    .transform((value) => value ?? undefined),
  genres: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  languages: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  directors: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  cast: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
