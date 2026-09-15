import { z } from "zod";

export const candidateSchema = z.object({
  name: z.string().trim().min(1),
  skills: z.array(z.string().trim().min(1)),
  yearsOfExperience: z.number().nonnegative(),
  location: z.string().trim().min(1),
  expectedSalary: z.number().nonnegative(),
});

export const idSchema = z.coerce.number().int().positive();
