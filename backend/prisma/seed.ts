import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {
  FunctionSignatureMap,
  StarterCodeMap,
  SupportedLanguage,
} from '../src/types/problem.types';

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
  // Legacy single-language starter code (assumed JS/TS-flavoured).
  starterCode?: string;
  // New, optional per-language fields. Problems that don't have these yet
  // fall back to `deriveStarterCodeByLang` / `deriveFunctionSignatures`
  // below, built off the legacy `starterCode` — so nothing breaks for
  // problems that haven't been migrated to explicit per-language data.
  starterCodeByLang?: StarterCodeMap;
  functionSignatures?: FunctionSignatureMap;
  acceptance?: number;
  likes?: number;
  timeComplexity?: string;
  spaceComplexity?: string;
}

// ─── Backward-compat fallback derivation ────────────────────────────────────
//
// Most of the 84 problems in dsa-problems.json predate per-language data —
// they only have one `starterCode` string (written as JS/TS). Rather than
// leaving those problems broken until someone manually migrates all of them,
// we derive best-effort per-language data at seed time:
//   - starterCodeByLang: reuse the legacy starterCode for javascript/typescript
//     (it's already written in that syntax); leave other languages unset so
//     the frontend/backend fall back to the legacy `starterCode` column.
//   - functionSignatures: regex-parse the function name out of the legacy
//     starterCode (same heuristic the old execute.controller.ts used), and
//     apply it to every language, since DSA problem function names are
//     conventionally identical across languages (e.g. `twoSum` everywhere).
//
// This only runs for problems that don't already define their own
// `starterCodeByLang`/`functionSignatures` — once a problem is migrated with
// real per-language starter code, this fallback is skipped entirely for it.

const inferFunctionNameFromStarter = (starterCode: string): string | null => {
  const fnMatch = starterCode.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (fnMatch) return fnMatch[1];

  // Arrow-function / const assignment style: `const twoSum = (...)`
  const constMatch = starterCode.match(
    /const\s+([A-Za-z_$][\w$]*)\s*[:=]/,
  );
  if (constMatch) return constMatch[1];

  return null;
};

const deriveStarterCodeByLang = (p: RawProblem): StarterCodeMap => {
  if (!p.starterCode) return {};
  // The legacy field is JS/TS-flavoured; only safe to reuse for those two.
  return {
    javascript: p.starterCode,
    typescript: p.starterCode,
  };
};

const deriveFunctionSignatures = (p: RawProblem): FunctionSignatureMap => {
  if (!p.starterCode) return {};
  const functionName = inferFunctionNameFromStarter(p.starterCode);
  if (!functionName) return {};

  const languages: SupportedLanguage[] = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
  ];
  const map: FunctionSignatureMap = {};
  for (const lang of languages) {
    map[lang] = { functionName, dataStructure: 'primitive' };
  }
  return map;
};

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
    const starterCodeByLang =
      p.starterCodeByLang ?? deriveStarterCodeByLang(p);
    const functionSignatures =
      p.functionSignatures ?? deriveFunctionSignatures(p);

  const data = {
  title: p.title,
  topic: deriveTopic(p),
  difficulty: p.difficulty,
  description: p.description,
  starterCode: p.starterCode ?? null,

  starterCodeByLang: JSON.parse(JSON.stringify(starterCodeByLang)),

  functionSignatures: JSON.parse(JSON.stringify(functionSignatures)),

  tags: p.tags,
  examples: p.examples == null ? null : JSON.parse(JSON.stringify(p.examples)),
  constraints: p.constraints == null ? null : JSON.parse(JSON.stringify(p.constraints)),
  hints: p.hints == null ? null : JSON.parse(JSON.stringify(p.hints)),
  testCases: p.testCases == null ? null : JSON.parse(JSON.stringify(p.testCases)),
  acceptance: p.acceptance,
  likes: p.likes,
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