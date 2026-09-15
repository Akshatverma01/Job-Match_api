import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";

export async function createCandidate(data: {
  name: string;
  skills: string[];
  yearsOfExperience: number;
  location: string;
  expectedSalary: number;
}) {
  return prisma.candidate.create({ data });
}

export async function getCandidate(id: number) {
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) throw new AppError(404, "Candidate not found");
  return candidate;
}
