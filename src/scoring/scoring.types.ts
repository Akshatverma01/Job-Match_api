export type WeightConfig = {
  skills: number;
  experience: number;
  location: number;
  salary: number;
};

export type CandidateForScoring = {
  skills: string[];
  yearsOfExperience: number;
  location: string;
  expectedSalary: number;
};

export type JobForScoring = {
  requiredSkills: Array<{
    name: string;
    type: "MUST_HAVE" | "NICE_TO_HAVE";
  }>;
  minYearsExperience: number;
  location: string;
  salaryMin: number;
  salaryMax: number;
  remoteAllowed: boolean;
};

export type ScoreBreakdown = {
  skills: { score: number; max: number };
  experience: { score: number; max: number };
  location: { score: number; max: number };
  salary: { score: number; max: number };
};

export type MatchResult = {
  eligible: boolean;
  score: number;
  breakdown: ScoreBreakdown;
  missingMustHaveSkills: string[];
  matchedSkills: string[];
  missingNiceToHaveSkills: string[];
};
