# Job Recommendation Engine — Job Match API

A small REST API that recommends jobs to candidates using a transparent, explainable rule-based scoring model.

## Tech Stack

- Node.js + TypeScript
- Express
- PostgreSQL
- Prisma ORM
- Zod validation
- Jest + Supertest
- Docker + Docker Compose

## Requirements

- Node.js 20+ (22 recommended)
- PostgreSQL 14+ for local development
- Docker Desktop if using Docker

## Run locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` in `.env`.

### 3. Generate Prisma client and migrate

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Optional seed data

```bash
npm run prisma:seed
```

### 5. Start the API

Development:

```bash
npm run dev
```

Production-style local run:

```bash
npm run build
npm start
```

The API runs on `http://localhost:3000`.

## Run with Docker

```bash
docker compose up --build
```

The API container waits for PostgreSQL to become healthy and runs:

```bash
prisma migrate deploy
```

before starting the API.

To stop:

```bash
docker compose down
```

To remove the database volume too:

```bash
docker compose down -v
```

## API endpoints

### Create candidate

`POST /candidates`

```json
{
  "name": "Akshat",
  "skills": ["React", "JavaScript", "TypeScript"],
  "yearsOfExperience": 1.5,
  "location": "Noida",
  "expectedSalary": 700000
}
```

### Create job

`POST /jobs`

```json
{
  "title": "Frontend Developer",
  "requiredSkills": [
    { "name": "React", "type": "must-have" },
    { "name": "JavaScript", "type": "must-have" },
    { "name": "Next.js", "type": "nice-to-have" }
  ],
  "minYearsExperience": 2,
  "location": "Noida",
  "salaryRange": {
    "min": 600000,
    "max": 900000
  },
  "remoteAllowed": true
}
```

### Job recommendations

`GET /candidates/:id/recommendations?limit=5`

Example:

```text
GET /candidates/1/recommendations?limit=5
```

Optional configurable weights:

```text
GET /candidates/1/recommendations?limit=5&skills=50&experience=20&location=15&salary=15
```

If any weight override is supplied, all four weights must add up to 100.

### Reverse recommendation view (bonus)

`GET /jobs/:id/recommendations?limit=5`

Returns the best-fit candidates for the selected job.

### Health

`GET /health`

## Recommendation response

Example shape:

```json
{
  "candidateId": 1,
  "recommendations": [
    {
      "job": {
        "id": 1,
        "title": "Frontend Developer",
        "location": "Noida",
        "remoteAllowed": true,
        "salaryRange": {
          "min": 600000,
          "max": 900000
        },
        "minYearsExperience": 2
      },
      "score": 90,
      "breakdown": {
        "skills": { "score": 50, "max": 50 },
        "experience": { "score": 15, "max": 20 },
        "location": { "score": 15, "max": 15 },
        "salary": { "score": 10, "max": 15 }
      },
      "matchedSkills": ["React", "JavaScript", "Next.js"],
      "missingNiceToHaveSkills": ["TypeScript"]
    }
  ]
}
```

## Scoring formula and rationale

The default score is out of 100:

| Dimension | Weight |
|---|---:|
| Skills | 50 |
| Experience | 20 |
| Location | 15 |
| Salary | 15 |
| **Total** | **100** |

### 1. Must-have skills — hard eligibility filter

Before calculating a recommendation score, every must-have skill is checked.

Skills are normalized using trimmed, case-insensitive comparison.

If one or more must-have skills are missing:

```text
eligible = false
```

and the job is excluded from the candidate's recommendations.

This is intentionally different from a low score: the assignment says a missing must-have skill should prevent the job from appearing regardless of other dimensions.

### 2. Skills — 50 points

```text
skillScore =
  (matched required skills / total required skills) × 50
```

Both must-have and nice-to-have skills contribute to the skill dimension.

Must-have skills still have the stronger business effect because they are also eligibility gates. Nice-to-have skills can improve ranking but cannot make an otherwise ineligible candidate eligible.

Why 50 points?

Skills are the strongest direct signal of whether a candidate can perform the role, so half of the total score is allocated to them.

### 3. Experience — 20 points

If the candidate meets or exceeds the requirement:

```text
experienceScore = 20
```

If they are below it:

```text
experienceScore =
  (candidateYears / minYearsExperience) × 20
```

The value is capped at 20.

#### Why penalize instead of exclude?

Experience requirements are often flexible in real hiring. A candidate with 1.5 years against a 2-year requirement may still be highly relevant if their skills and other fit dimensions are strong.

Hard-filtering experience would make the recommendation system unnecessarily brittle and would remove potentially good candidates. The must-have skill rule is already the explicit hard gate.

### 4. Location — 15 points

The ranking follows the assignment's ordering:

```text
Exact location match  → 15
Different location + remoteAllowed → 10
Different location + remoteAllowed=false → 0
```

The remote score is `2/3` of the exact-location score so an exact match always ranks above remote compatibility.

### 5. Salary — 15 points

The candidate supplies a single `expectedSalary`, while the job supplies a range.

The rule treats a salary comfortably above expectation as the best fit.

If expected salary is at or below the job minimum:

```text
salaryScore = 15
```

If expected salary is above the job maximum:

```text
salaryScore = 0
```

If expected salary falls inside the range:

```text
salaryScore =
  15 × (jobMax - expectedSalary)
       / (jobMax - jobMin)
```

Example:

```text
Expected salary = 700,000
Job range       = 600,000–900,000

salaryScore =
15 × (900,000 - 700,000) / (900,000 - 600,000)
= 10
```

This creates a smooth salary-fit score instead of an arbitrary yes/no condition.

### 6. Final score

For eligible jobs:

```text
finalScore =
  skillScore +
  experienceScore +
  locationScore +
  salaryScore
```

The final value is clamped to `0–100` and rounded to the nearest integer.

Recommendations are sorted by descending score. Candidate/job ID is used as a deterministic tie-breaker.

## Configurable weights

The default configuration is:

```text
skills=50
experience=20
location=15
salary=15
```

The recommendation endpoints also accept the four weights as query parameters. When overrides are used, their total must equal 100.

For example:

```text
/candidates/1/recommendations?skills=40&experience=25&location=15&salary=20
```

This keeps the scoring policy configurable without changing the scoring algorithm.

## Assumptions

1. Salary values are annual amounts in the same currency and unit.
2. A candidate has one expected salary rather than a salary range.
3. Skill matching is case-insensitive and ignores surrounding whitespace.
4. Location comparison is case-insensitive and otherwise exact.
5. A remote job is treated as compatible with a candidate from another location, but exact location is preferred.
6. Experience is numeric and may contain fractional years.
7. A job with a salary range whose maximum is below the candidate's expectation receives zero on the salary dimension.
8. The system is intentionally deterministic and does not learn from historical hiring outcomes.

## What I would improve with more time

- Add pagination for very large candidate/job datasets.
- Move scoring weights to a database/config service for production environments.
- Add richer location normalization (city aliases, commute radius, country).
- Support candidate salary ranges instead of a single expectation.
- Add integration tests using a disposable PostgreSQL database.
- Add OpenAPI/Swagger documentation.
- Add structured logging and request IDs.
- Add database-level pagination/filtering so every job does not need to be loaded into application memory.
- Add performance benchmarks for large datasets.

## Testing

The highest-value scoring behavior is covered by unit tests, including:

- missing must-have skill
- case-insensitive skill matching
- nice-to-have contribution
- experience penalty
- experience requirement met
- exact vs remote vs mismatch location
- salary inside range
- no salary overlap
- salary comfortably above expectation
- final score bounds

Run:

```bash
npm test
```

## AI usage

AI tools were used as a development aid for scaffolding, boilerplate, test-case brainstorming, and reviewing implementation alternatives.

The final implementation was manually reviewed and edited around the assignment's business rules. In particular, the must-have hard filter, experience penalty decision, location ordering, salary formula, deterministic ranking, configurable weights, validation, and Docker migration startup behavior were treated as explicit design decisions rather than blindly accepting generated suggestions.

## Project structure

```text
job-match-api/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   ├── controllers/
│   ├── lib/
│   ├── middleware/
│   ├── routes/
│   ├── scoring/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── api/
│   └── scoring/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```
#   J o b - M a t c h _ a p i  
 