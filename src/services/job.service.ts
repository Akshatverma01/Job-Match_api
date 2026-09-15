import { SkillType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";

export async function createJob(data: {
  title: string;
  requiredSkills: Array<{ name: string; type: "must-have" | "nice-to-have" }>;
  minYearsExperience: number;
  location: string;
  salaryRange: { min: number; max: number };
  remoteAllowed: boolean;
}) {
  const seen = new Set<string>();
  const normalizedSkills = data.requiredSkills.map((skill) => {
    const name = skill.name.trim();
    const key = name.toLowerCase();
    if (seen.has(key)) throw new AppError(400, `Duplicate required skill: ${name}`);
    seen.add(key);
    return {
      name,
      type: skill.type === "must-have" ? SkillType.MUST_HAVE : SkillType.NICE_TO_HAVE,
    };
  });

  return prisma.job.create({
    data: {
      title: data.title.trim(),
      minYearsExperience: data.minYearsExperience,
      location: data.location.trim(),
      salaryMin: data.salaryRange.min,
      salaryMax: data.salaryRange.max,
      remoteAllowed: data.remoteAllowed,
      requiredSkills: { create: normalizedSkills },
    },
    include: { requiredSkills: true },
  });
}

export async function getJob(id: number) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: { requiredSkills: true },
  });
  if (!job) throw new AppError(404, "Job not found");
  return job;
}
