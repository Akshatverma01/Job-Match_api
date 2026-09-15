import { prisma } from "../lib/prisma";
import { DEFAULT_WEIGHTS } from "../scoring/scoring.config";
import { scoreJob } from "../scoring/job-scorer";
import { WeightConfig } from "../scoring/scoring.types";
import { AppError } from "../utils/errors";

const toWeights = (overrides?: Partial<WeightConfig>): WeightConfig => ({
  ...DEFAULT_WEIGHTS,
  ...overrides,
});

const publicJob = (job: any) => ({
  id: job.id,
  title: job.title,
  location: job.location,
  remoteAllowed: job.remoteAllowed,
  salaryRange: { min: job.salaryMin, max: job.salaryMax },
  minYearsExperience: job.minYearsExperience,
});

export async function recommendJobs(
  candidateId: number,
  limit: number,
  overrides?: Partial<WeightConfig>
) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new AppError(404, "Candidate not found");

  const jobs = await prisma.job.findMany({ include: { requiredSkills: true } });
  const weights = toWeights(overrides);

  return jobs
    .map((job) => {
      const result = scoreJob(candidate, job, weights);
      return { job, result };
    })
    .filter(({ result }) => result.eligible)
    .sort((a, b) => b.result.score - a.result.score || a.job.id - b.job.id)
    .slice(0, limit)
    .map(({ job, result }) => ({
      job: publicJob(job),
      score: result.score,
      breakdown: result.breakdown,
      matchedSkills: result.matchedSkills,
      missingNiceToHaveSkills: result.missingNiceToHaveSkills,
    }));
}

export async function recommendCandidates(
  jobId: number,
  limit: number,
  overrides?: Partial<WeightConfig>
) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { requiredSkills: true },
  });
  if (!job) throw new AppError(404, "Job not found");

  const candidates = await prisma.candidate.findMany();
  const weights = toWeights(overrides);

  return candidates
    .map((candidate) => {
      const result = scoreJob(candidate, job, weights);
      return { candidate, result };
    })
    .filter(({ result }) => result.eligible)
    .sort((a, b) => b.result.score - a.result.score || a.candidate.id - b.candidate.id)
    .slice(0, limit)
    .map(({ candidate, result }) => ({
      candidate: {
        id: candidate.id,
        name: candidate.name,
        skills: candidate.skills,
        yearsOfExperience: candidate.yearsOfExperience,
        location: candidate.location,
        expectedSalary: candidate.expectedSalary,
      },
      score: result.score,
      breakdown: result.breakdown,
      matchedSkills: result.matchedSkills,
      missingNiceToHaveSkills: result.missingNiceToHaveSkills,
    }));
}
