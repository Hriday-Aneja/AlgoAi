import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// The frontend's dsa-problems.json is the richest, duplicate-free source
// (description, examples, testCases, hints, etc). We read it directly from
// disk instead of importing it, since it lives outside this package.
const DATA_PATH = path.resolve(
  __dirname,
  '../../frontend/src/app/data/dsa-problems.json'
);

interface RawProblem {
  id: string;
  title: string;
  difficulty: string;
  domain?: string;
  tags?: string[];
  description: string;
  testCases?: unknown;
  examples?: unknown;
  constraints?: unknown;
  hints?: unknown;
  starterCode?: string;
  acceptance?: number;
  likes?: number;
  timeComplexity?: string;
  spaceComplexity?: string;
}

// Derive a single "topic" string for filtering/recommendation use
// (the DB model keeps one topic column; tags carries the full list).
function deriveTopic(p: RawProblem): string {
  if (p.tags && p.tags.length > 0) {
    return p.tags[0].toLowerCase().replace(/\s+/g, '_');
  }
  if (p.domain) return p.domain.toLowerCase().replace(/\s+/g, '_');
  return 'general';
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const problems = JSON.parse(raw) as RawProblem[];

  // Dedupe by id — first occurrence wins, just in case.
  const seen = new Map<string, RawProblem>();
  for (const p of problems) {
    if (!seen.has(p.id)) seen.set(p.id, p);
  }
  const deduped = Array.from(seen.values());

  console.log(`Seeding ${deduped.length} problems (${problems.length - deduped.length} duplicates skipped)...`);

  for (const p of deduped) {
    const data = {
      title: p.title,
      topic: deriveTopic(p),
      difficulty: p.difficulty.toLowerCase(),
      description: p.description,
      starterCode: p.starterCode ?? null,
      tags: p.tags ?? undefined,
      examples: p.examples ?? undefined,
      constraints: p.constraints ?? undefined,
      hints: p.hints ?? undefined,
      testCases: p.testCases ?? undefined,
      acceptance: p.acceptance ?? null,
      likes: p.likes ?? null,
      timeComplexity: p.timeComplexity ?? null,
      spaceComplexity: p.spaceComplexity ?? null,
    };

    await prisma.problem.upsert({
      where: { id: p.id },
      update: data,
      create: { id: p.id, ...data },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });