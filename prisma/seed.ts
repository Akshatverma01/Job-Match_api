import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SkillType } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.requiredSkill.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidate.deleteMany();

  await prisma.candidate.createMany({
    data: [
      {
        name: "Akshat",
        skills: ["React", "JavaScript", "TypeScript", "Next.js", "Node.js"],
        yearsOfExperience: 1.5,
        location: "Noida",
        expectedSalary: 700000
      },
      {
        name: "Priya",
        skills: ["React", "JavaScript", "Redux", "Node.js"],
        yearsOfExperience: 3,
        location: "Gurgaon",
        expectedSalary: 900000
      },
      {
        name: "Rahul",
        skills: ["Python", "Django", "PostgreSQL"],
        yearsOfExperience: 2,
        location: "Bangalore",
        expectedSalary: 800000
      }
    ]
  });

  const jobs = [
    {
      title: "Frontend Developer",
      minYearsExperience: 2,
      location: "Noida",
      salaryMin: 600000,
      salaryMax: 900000,
      remoteAllowed: true,
      skills: [
        { name: "React", type: SkillType.MUST_HAVE },
        { name: "JavaScript", type: SkillType.MUST_HAVE },
        { name: "Next.js", type: SkillType.NICE_TO_HAVE },
        { name: "TypeScript", type: SkillType.NICE_TO_HAVE }
      ]
    },
    {
      title: "Full Stack Developer",
      minYearsExperience: 2,
      location: "Gurgaon",
      salaryMin: 800000,
      salaryMax: 1200000,
      remoteAllowed: true,
      skills: [
        { name: "React", type: SkillType.MUST_HAVE },
        { name: "Node.js", type: SkillType.MUST_HAVE },
        { name: "TypeScript", type: SkillType.NICE_TO_HAVE }
      ]
    },
    {
      title: "Backend Developer",
      minYearsExperience: 3,
      location: "Bangalore",
      salaryMin: 900000,
      salaryMax: 1300000,
      remoteAllowed: false,
      skills: [
        { name: "Node.js", type: SkillType.MUST_HAVE },
        { name: "PostgreSQL", type: SkillType.MUST_HAVE }
      ]
    },
    {
      title: "React Developer",
      minYearsExperience: 1,
      location: "Delhi",
      salaryMin: 500000,
      salaryMax: 750000,
      remoteAllowed: true,
      skills: [
        { name: "React", type: SkillType.MUST_HAVE },
        { name: "JavaScript", type: SkillType.MUST_HAVE },
        { name: "Redux", type: SkillType.NICE_TO_HAVE }
      ]
    },
    {
      title: "TypeScript Frontend Engineer",
      minYearsExperience: 2,
      location: "Noida",
      salaryMin: 1000000,
      salaryMax: 1400000,
      remoteAllowed: false,
      skills: [
        { name: "React", type: SkillType.MUST_HAVE },
        { name: "TypeScript", type: SkillType.MUST_HAVE }
      ]
    }
  ];

  for (const job of jobs) {
    await prisma.job.create({
      data: {
        title: job.title,
        minYearsExperience: job.minYearsExperience,
        location: job.location,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        remoteAllowed: job.remoteAllowed,
        requiredSkills: { create: job.skills }
      }
    });
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
