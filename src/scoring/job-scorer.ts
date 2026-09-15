import {
  CandidateForScoring,
  JobForScoring,
  MatchResult,
  WeightConfig,
} from "./scoring.types";

const normalize = (value: string) => value.trim().toLowerCase();

const round = (value: number) => Math.round(value * 100) / 100;

export function scoreJob(
  candidate: CandidateForScoring,
  job: JobForScoring,
  weights: WeightConfig
): MatchResult {
  const candidateSkills = new Set(candidate.skills.map(normalize));

  const mustHave = job.requiredSkills.filter((skill) => skill.type === "MUST_HAVE");
  const niceToHave = job.requiredSkills.filter((skill) => skill.type === "NICE_TO_HAVE");

  const missingMustHaveSkills = mustHave
    .filter((skill) => !candidateSkills.has(normalize(skill.name)))
    .map((skill) => skill.name);

  const matchedSkills = job.requiredSkills
    .filter((skill) => candidateSkills.has(normalize(skill.name)))
    .map((skill) => skill.name);

  const missingNiceToHaveSkills = niceToHave
    .filter((skill) => !candidateSkills.has(normalize(skill.name)))
    .map((skill) => skill.name);

  if (missingMustHaveSkills.length > 0) {
    return {
      eligible: false,
      score: 0,
      breakdown: {
        skills: { score: 0, max: weights.skills },
        experience: { score: 0, max: weights.experience },
        location: { score: 0, max: weights.location },
        salary: { score: 0, max: weights.salary },
      },
      missingMustHaveSkills,
      matchedSkills,
      missingNiceToHaveSkills,
    };
  }

  // All required skills are considered for the skill dimension.
  // Nice-to-have skills contribute to the same dimension but never gate eligibility.
  const skillMatchRatio =
    job.requiredSkills.length === 0
      ? 1
      : matchedSkills.length / job.requiredSkills.length;
  const skillScore = skillMatchRatio * weights.skills;

  const experienceScore =
    job.minYearsExperience === 0
      ? weights.experience
      : Math.min(
          candidate.yearsOfExperience / job.minYearsExperience,
          1
        ) * weights.experience;

  const candidateLocation = normalize(candidate.location);
  const jobLocation = normalize(job.location);

  const locationScore =
    candidateLocation === jobLocation
      ? weights.location
      : job.remoteAllowed
        ? weights.location * (2 / 3)
        : 0;

  let salaryScore: number;
  if (candidate.expectedSalary <= job.salaryMin) {
    salaryScore = weights.salary;
  } else if (candidate.expectedSalary > job.salaryMax) {
    salaryScore = 0;
  } else if (job.salaryMax === job.salaryMin) {
    salaryScore = weights.salary;
  } else {
    // At the minimum: full score. At the maximum: zero.
    const fit = (job.salaryMax - candidate.expectedSalary) /
      (job.salaryMax - job.salaryMin);
    salaryScore = Math.max(0, fit) * weights.salary;
  }

  const breakdown = {
    skills: { score: round(skillScore), max: weights.skills },
    experience: { score: round(experienceScore), max: weights.experience },
    location: { score: round(locationScore), max: weights.location },
    salary: { score: round(salaryScore), max: weights.salary },
  };

  const score = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        breakdown.skills.score +
        breakdown.experience.score +
        breakdown.location.score +
        breakdown.salary.score
      )
    )
  );

  return {
    eligible: true,
    score,
    breakdown,
    missingMustHaveSkills,
    matchedSkills,
    missingNiceToHaveSkills,
  };
}
