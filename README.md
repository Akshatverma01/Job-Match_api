# Job Match API

> A transparent, rule-based API for matching candidates with relevant jobs.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Jest-C21325?logo=jest&logoColor=white)

The API scores candidate-job fit using skills, experience, location, and salary. Every recommendation includes an explainable score breakdown, while missing must-have skills exclude a job before ranking.

## Quick start

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000/health](http://localhost:3000/health) to verify the API is running.

<details>
<summary>Run the complete setup with Docker</summary>

```bash
docker compose up --build
```

Docker Compose starts PostgreSQL, applies Prisma migrations, and starts the API at `http://localhost:3000`.

</details>

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [API reference](#api-reference)
- [PRD test cases](#prd-test-cases)
- [Scoring model](#scoring-model)
- [Testing](#testing)
- [Useful commands](#useful-commands)
- [Project structure](#project-structure)

## Features

- Create and retrieve candidates and jobs
- Recommend jobs for a candidate
- Find best-fit candidates for a job
- Explain every recommendation with score breakdowns and matched skills
- Enforce must-have skills as a hard eligibility filter
- Override scoring weights per request
- Validate request bodies and query parameters with Zod
- Run locally or with Docker Compose

## Tech stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 20+ |
| Language | TypeScript |
| API | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Testing | Jest and Supertest |
| Infrastructure | Docker and Docker Compose |

## Getting started

### Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer, or Docker Desktop

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/job_match?schema=public"
PORT=3000
```

### 3. Generate Prisma Client and run migrations

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Seed example data (optional)

```bash
npm run prisma:seed
```

### 5. Start the API

Development mode with reload:

```bash
npm run dev
```

Production-style local run:

```bash
npm run build
npm start
```

The API is available at `http://localhost:3000`.

Check that it is running:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok"}
```

## API reference

All endpoints return JSON. IDs are numeric.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Check API health |
| `POST` | `/candidates` | Create a candidate |
| `GET` | `/candidates/:id` | Get a candidate |
| `GET` | `/candidates/:id/recommendations` | Recommend jobs for a candidate |
| `POST` | `/jobs` | Create a job |
| `GET` | `/jobs/:id` | Get a job |
| `GET` | `/jobs/:id/recommendations` | Recommend candidates for a job |

### Common query parameters

| Parameter | Applies to | Description |
| --- | --- | --- |
| `limit` | Recommendation endpoints | Maximum number of recommendations to return |
| `skills` | Recommendation endpoints | Skills weight; requires all four weights |
| `experience` | Recommendation endpoints | Experience weight; requires all four weights |
| `location` | Recommendation endpoints | Location weight; requires all four weights |
| `salary` | Recommendation endpoints | Salary weight; requires all four weights |

When custom weights are supplied, `skills + experience + location + salary` must equal `100`.

<details>
<summary>Request examples</summary>

#### Create a candidate

```http
POST /candidates
Content-Type: application/json
```

```json
{
  "name": "Akshat",
  "skills": ["React", "JavaScript", "TypeScript"],
  "yearsOfExperience": 1.5,
  "location": "Noida",
  "expectedSalary": 700000
}
```

#### Create a job

```http
POST /jobs
Content-Type: application/json
```

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

#### Get job recommendations

```http
GET /candidates/1/recommendations?limit=5
```

Custom scoring weights can be supplied as query parameters:

```http
GET /candidates/1/recommendations?limit=5&skills=40&experience=25&location=15&salary=20
```

#### Get candidate recommendations

```http
GET /jobs/1/recommendations?limit=5
```

#### Recommendation response

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
        "salaryRange": { "min": 600000, "max": 900000 },
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

</details>

## PRD test cases

The following requests use this job definition:

```json
{
  "title": "Frontend Developer",
  "requiredSkills": [
    { "name": "React", "type": "must-have" },
    { "name": "TypeScript", "type": "must-have" },
    { "name": "Next.js", "type": "nice-to-have" }
  ],
  "minYearsExperience": 2,
  "location": "Noida",
  "salaryRange": { "min": 600000, "max": 900000 },
  "remoteAllowed": true
}
```

### 1. Missing must-have skill

Request:

```http
GET /candidates/1/recommendations?limit=5
```

Candidate 1 has `React` but not `TypeScript`.

Response:

```json
{
  "candidateId": 1,
  "recommendations": []
}
```

The job is excluded before ranking, even when the candidate has enough experience, a matching location, and a suitable salary.

### 2. Nice-to-have skill

Request:

```http
GET /candidates/2/recommendations?limit=5
```

Candidate 2 has both must-have skills but not `Next.js`.

Response excerpt:

```json
{
  "score": 83,
  "matchedSkills": ["React", "TypeScript"],
  "missingNiceToHaveSkills": ["Next.js"],
  "breakdown": {
    "skills": { "score": 33.33, "max": 50 },
    "experience": { "score": 20, "max": 20 },
    "location": { "score": 15, "max": 15 },
    "salary": { "score": 15, "max": 15 }
  }
}
```

Adding `Next.js` to the candidate keeps the job eligible and increases the skills score to `50`.

### 3. Candidate below the experience requirement

Request:

```http
GET /candidates/3/recommendations?limit=5
```

For a candidate with `1` year of experience and a job requiring `2` years, the response remains eligible:

```json
{
  "breakdown": {
    "experience": { "score": 10, "max": 20 }
  }
}
```

The candidate is penalized rather than excluded.

### 4. Location matching

Exact location, remote availability, and a non-remote mismatch produce these location scores:

| Candidate location | `remoteAllowed` | Location score |
| --- | --- | ---: |
| `Noida` | `true` | `15` |
| `Delhi` | `true` | `10` |
| `Delhi` | `false` | `0` |

Request:

```http
GET /candidates/4/recommendations?limit=5
```

The response includes the location result in the breakdown:

```json
{
  "breakdown": {
    "location": { "score": 15, "max": 15 }
  }
}
```

### 5. Salary fit

Request:

```http
GET /candidates/5/recommendations?limit=5
```

For the salary range `600000-900000`:

| Expected salary | Salary score | Result |
| ---: | ---: | --- |
| `500000` | `15` | Job comfortably exceeds expectation |
| `750000` | `7.5` | Salary falls within the range |
| `1000000` | `0` | Job maximum is below expectation |

Response excerpt for an expected salary of `750000`:

```json
{
  "breakdown": {
    "salary": { "score": 7.5, "max": 15 }
  }
}
```

### 6. Case-insensitive skills

Request:

```http
POST /candidates
Content-Type: application/json
```

```json
{
  "name": "Case-insensitive candidate",
  "skills": ["react", "typescript", "next.js"],
  "yearsOfExperience": 2,
  "location": "Noida",
  "expectedSalary": 600000
}
```

The recommendation response treats these skills as matches and returns:

```json
{
  "breakdown": {
    "skills": { "score": 50, "max": 50 }
  },
  "matchedSkills": ["React", "TypeScript", "Next.js"]
}
```

### 7. Custom scoring weights

Request:

```http
GET /candidates/1/recommendations?limit=5&skills=40&experience=25&location=15&salary=20
```

The response uses the supplied maxima:

```json
{
  "breakdown": {
    "skills": { "score": 40, "max": 40 },
    "experience": { "score": 25, "max": 25 },
    "location": { "score": 15, "max": 15 },
    "salary": { "score": 20, "max": 20 }
  }
}
```

All four custom weights are required and must total `100`. A partial or invalid set returns `400`:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "message": "Provide all four weights, and their total must equal 100"
    }
  ]
}
```

## Scoring model

The default score is out of 100:

| Dimension | Weight |
| --- | ---: |
| Skills | 50 |
| Experience | 20 |
| Location | 15 |
| Salary | 15 |
| **Total** | **100** |

<details>
<summary>View scoring rules</summary>

### Eligibility: must-have skills

Every must-have skill is checked before scoring. Skill comparison is trimmed and case-insensitive. If any must-have skill is missing, the job is excluded from recommendations.

### Skills: 50 points

```text
skillScore = (matched required skills / total required skills) × 50
```

Must-have and nice-to-have skills both contribute to the score. Must-have skills also act as eligibility gates.

### Experience: 20 points

Meeting or exceeding the requirement gives the full 20 points. For a candidate below the requirement:

```text
experienceScore = (candidateYears / minYearsExperience) × 20
```

The result is capped at 20. Experience is scored rather than hard-filtered because candidates slightly below a requirement may still be relevant.

### Location: 15 points

| Match | Score |
| --- | ---: |
| Exact location | 15 |
| Different location, remote allowed | 10 |
| Different location, remote not allowed | 0 |

### Salary: 15 points

- Expected salary at or below the job minimum: `15`
- Expected salary above the job maximum: `0`
- Expected salary inside the range:

```text
salaryScore = 15 × (jobMax - expectedSalary) / (jobMax - jobMin)
```

### Final score and ranking

```text
finalScore = skillScore + experienceScore + locationScore + salaryScore
```

The final score is clamped to `0-100`, rounded to the nearest integer, and sorted in descending order. Candidate/job ID provides a deterministic tie-breaker.

</details>

## Testing

Run the test suite:

```bash
npm test
```

The scoring tests cover must-have eligibility, case-insensitive skills, nice-to-have skills, experience penalties, location matching, salary ranges, and score bounds.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start the compiled server |
| `npm test` | Run Jest tests |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Apply development migrations |
| `npm run prisma:seed` | Insert example data |
| `docker compose down` | Stop Docker services |
| `docker compose down -v` | Stop services and remove database data |

## Project structure

```text
job-match-api/
├── prisma/
│   ├── migrations/       # Database migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Example data
├── src/
│   ├── config/           # Environment configuration
│   ├── controllers/      # HTTP request handlers
│   ├── lib/              # Shared clients, including Prisma
│   ├── middleware/       # Error and 404 handling
│   ├── routes/           # API route definitions
│   ├── scoring/          # Scoring algorithm and configuration
│   ├── services/         # Business logic
│   ├── utils/            # Shared errors and utilities
│   ├── validators/       # Zod request schemas
│   ├── app.ts            # Express app
│   └── server.ts         # Server entry point
├── tests/
│   ├── api/              # API tests
│   └── scoring/          # Scoring unit tests
├── docker-compose.yml
├── Dockerfile
└── package.json
```
