import { z } from "zod";

export const recommendationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(5),
});

export const weightsQuerySchema = z.object({
  skills: z.coerce.number().nonnegative().optional(),
  experience: z.coerce.number().nonnegative().optional(),
  location: z.coerce.number().nonnegative().optional(),
  salary: z.coerce.number().nonnegative().optional(),
}).refine((w) => {
  const values = [w.skills, w.experience, w.location, w.salary].filter(
    (v): v is number => v !== undefined
  );
  return values.length === 0 || (
    values.length === 4 &&
    Math.abs(values.reduce((a, b) => a + b, 0) - 100) < 0.000001
  );
}, {
  message: "Provide all four weights, and their total must equal 100",
});
