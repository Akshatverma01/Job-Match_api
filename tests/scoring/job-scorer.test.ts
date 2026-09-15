import { DEFAULT_WEIGHTS } from "../../src/scoring/scoring.config";
import { scoreJob } from "../../src/scoring/job-scorer";

const job = {
  requiredSkills: [
    { name: "React", type: "MUST_HAVE" as const },
    { name: "TypeScript", type: "MUST_HAVE" as const },
    { name: "Next.js", type: "NICE_TO_HAVE" as const },
  ],
  minYearsExperience: 2,
  location: "Noida",
  salaryMin: 600000,
  salaryMax: 900000,
  remoteAllowed: true,
};

test("hard-filters a candidate missing a must-have skill", () => {
  const result = scoreJob(
    {
      skills: ["React"],
      yearsOfExperience: 5,
      location: "Noida",
      expectedSalary: 500000,
    },
    job,
    DEFAULT_WEIGHTS
  );

  expect(result.eligible).toBe(false);
  expect(result.missingMustHaveSkills).toEqual(["TypeScript"]);
});

test("matches skills case-insensitively", () => {
  const result = scoreJob(
    {
      skills: ["react", "typescript", "next.js"],
      yearsOfExperience: 2,
      location: "Noida",
      expectedSalary: 600000,
    },
    job,
    DEFAULT_WEIGHTS
  );

  expect(result.eligible).toBe(true);
  expect(result.breakdown.skills.score).toBe(50);
});

test("nice-to-have skills boost the score without excluding the candidate", () => {
  const withoutNiceToHave = scoreJob(
    {
      skills: ["React", "TypeScript"],
      yearsOfExperience: 2,
      location: "Noida",
      expectedSalary: 600000,
    },
    job,
    DEFAULT_WEIGHTS
  );
  const withNiceToHave = scoreJob(
    {
      skills: ["React", "TypeScript", "Next.js"],
      yearsOfExperience: 2,
      location: "Noida",
      expectedSalary: 600000,
    },
    job,
    DEFAULT_WEIGHTS
  );

  expect(withoutNiceToHave.eligible).toBe(true);
  expect(withNiceToHave.eligible).toBe(true);
  expect(withNiceToHave.score).toBeGreaterThan(withoutNiceToHave.score);
  expect(withoutNiceToHave.missingNiceToHaveSkills).toEqual(["Next.js"]);
});

test("penalizes but does not exclude lower experience", () => {
  const result = scoreJob(
    {
      skills: ["React", "TypeScript"],
      yearsOfExperience: 1,
      location: "Noida",
      expectedSalary: 600000,
    },
    job,
    DEFAULT_WEIGHTS
  );

  expect(result.eligible).toBe(true);
  expect(result.breakdown.experience.score).toBe(10);
});

test("gives full experience score when requirement is met", () => {
  const result = scoreJob(
    {
      skills: ["React", "TypeScript"],
      yearsOfExperience: 3,
      location: "Noida",
      expectedSalary: 600000,
    },
    job,
    DEFAULT_WEIGHTS
  );

  expect(result.breakdown.experience.score).toBe(20);
});

test("location ranks exact above remote and mismatch", () => {
  const exact = scoreJob(
    { skills: ["React", "TypeScript"], yearsOfExperience: 2, location: "Noida", expectedSalary: 600000 },
    job, DEFAULT_WEIGHTS
  );
  const remote = scoreJob(
    { skills: ["React", "TypeScript"], yearsOfExperience: 2, location: "Delhi", expectedSalary: 600000 },
    job, DEFAULT_WEIGHTS
  );
  const mismatch = scoreJob(
    { skills: ["React", "TypeScript"], yearsOfExperience: 2, location: "Delhi", expectedSalary: 600000 },
    { ...job, remoteAllowed: false }, DEFAULT_WEIGHTS
  );

  expect(exact.breakdown.location.score).toBeGreaterThan(remote.breakdown.location.score);
  expect(remote.breakdown.location.score).toBeGreaterThan(mismatch.breakdown.location.score);
});

test("scores salary continuously within the range", () => {
  const result = scoreJob(
    { skills: ["React", "TypeScript"], yearsOfExperience: 2, location: "Noida", expectedSalary: 750000 },
    job, DEFAULT_WEIGHTS
  );

  expect(result.breakdown.salary.score).toBe(7.5);
});

test("gives near-zero salary score when max is below expectation", () => {
  const result = scoreJob(
    { skills: ["React", "TypeScript"], yearsOfExperience: 2, location: "Noida", expectedSalary: 1000000 },
    job, DEFAULT_WEIGHTS
  );

  expect(result.breakdown.salary.score).toBe(0);
});

test("a job comfortably above expectation receives full salary score", () => {
  const result = scoreJob(
    { skills: ["React", "TypeScript"], yearsOfExperience: 2, location: "Noida", expectedSalary: 500000 },
    job, DEFAULT_WEIGHTS
  );

  expect(result.breakdown.salary.score).toBe(15);
});

test("keeps the final score between 0 and 100", () => {
  const result = scoreJob(
    { skills: ["React", "TypeScript", "Next.js"], yearsOfExperience: 10, location: "Noida", expectedSalary: 0 },
    job, DEFAULT_WEIGHTS
  );

  expect(result.score).toBeGreaterThanOrEqual(0);
  expect(result.score).toBeLessThanOrEqual(100);
});
