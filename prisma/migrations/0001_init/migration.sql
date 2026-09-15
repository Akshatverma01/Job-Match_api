CREATE TYPE "SkillType" AS ENUM ('MUST_HAVE', 'NICE_TO_HAVE');

CREATE TABLE "Candidate" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "skills" TEXT[] NOT NULL,
  "yearsOfExperience" DOUBLE PRECISION NOT NULL,
  "location" TEXT NOT NULL,
  "expectedSalary" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Job" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "minYearsExperience" DOUBLE PRECISION NOT NULL,
  "location" TEXT NOT NULL,
  "salaryMin" DOUBLE PRECISION NOT NULL,
  "salaryMax" DOUBLE PRECISION NOT NULL,
  "remoteAllowed" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequiredSkill" (
  "id" SERIAL NOT NULL,
  "jobId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "type" "SkillType" NOT NULL,
  CONSTRAINT "RequiredSkill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Candidate_location_idx" ON "Candidate"("location");
CREATE INDEX "Job_location_idx" ON "Job"("location");
CREATE INDEX "RequiredSkill_jobId_idx" ON "RequiredSkill"("jobId");
CREATE INDEX "RequiredSkill_name_idx" ON "RequiredSkill"("name");
CREATE UNIQUE INDEX "RequiredSkill_jobId_name_key" ON "RequiredSkill"("jobId", "name");
ALTER TABLE "RequiredSkill" ADD CONSTRAINT "RequiredSkill_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
