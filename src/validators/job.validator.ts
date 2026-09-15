import { z } from "zod";

const requiredSkillSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["must-have", "nice-to-have"]),
});

export const jobSchema = z.object({
  title: z.string().trim().min(1),
  requiredSkills: z.array(requiredSkillSchema).min(1),
  minYearsExperience: z.number().nonnegative(),
  location: z.string().trim().min(1),
  salaryRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }).refine((range) => range.max >= range.min, {
    message: "salaryRange.max must be greater than or equal to salaryRange.min",
    path: ["max"],
  }),
  remoteAllowed: z.boolean(),
});

export const limitSchema = z.coerce.number().int().min(1).max(100).default(5);
