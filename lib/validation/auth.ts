import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "name cannot be empty")
    .max(60, "name must be 60 characters or fewer"),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8, "password must be 8 or more characters long")
    .max(100, "too many characters"),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1, "too short"),
});

export type LoginSchemaInput = z.infer<typeof loginSchema>;
