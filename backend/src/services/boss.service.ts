import axios from 'axios';
import ts from 'typescript';
import { prisma } from '../config/database';
import {
  BossTodayResponse,
  BossSubmitPayload,
  BossSubmitResponse,
} from '../types/boss.types';

type Difficulty = 'easy' | 'medium' | 'hard';

const JUDGE0_API_URL = (
  process.env.JUDGE0_API_URL || 'http://34.131.167.198:2358'
).replace(/\/+$/g, '');

const LANGUAGE_MAPPING: Record<string, number> = {
  javascript: 63,
  js: 63,
  typescript: 74,
  ts: 74,
  python: 71,
  python3: 71,
  java: 62,
  c: 50,
  'c++': 54,
  cpp: 54,
};

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const humanizeTopic = (topic: string): string =>
  topic
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(capitalize)
    .join(' ');

const bossNameFor = (topic: string, difficulty: Difficulty): string => {
  const base = humanizeTopic(topic);
  if (difficulty === 'easy') return `${base} Overlord`;
  if (difficulty === 'medium') return `${base} Titan`;
  return `${base} God`;
};

const normalizeOutput = (value: string): string =>
  value
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

const stringifyActual = (value: unknown): string => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const tryParseJson = (value: string): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const compareOutputs = (actual: unknown, expected: string): boolean => {
  const normalizedActualString = normalizeOutput(stringifyActual(actual));
  const normalizedExpectedString = normalizeOutput(expected);
  if (normalizedActualString === normalizedExpectedString) return true;

  const expectedParsed = tryParseJson(expected);
  const actualParsed = typeof actual === 'string' ? tryParseJson(actual) : { ok: true as const, value: actual };

  const actualValue = actualParsed.ok ? actualParsed.value : actual;
  const expectedValue = expectedParsed.ok ? expectedParsed.value : expected;

  return stableStringify(actualValue) === stableStringify(expectedValue);
};

const extractLastJsonString = (stdout: string): string | null => {
  const cleaned = stdout.trim();
  if (!cleaned) return null;

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const candidate = lines[i];
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  const trailingJson = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])\s*$/);
  if (trailingJson) {
    const candidate = trailingJson[1];
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      return null;
    }
  }

  return null;
};

const deterministicIndex = (seed: string, length: number): number => {
  let hash = 0;
  for (const char of seed) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  return ((hash % length) + length) % length;
};

const stripTypeScript = (source: string): string => {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2019,
      removeComments: false,
    },
    reportDiagnostics: false,
  });
  return result.outputText;
};

const buildBatchHarness = (functionName: string, inputs: string[]): string => {
  const escapedFn = JSON.stringify(functionName);
  const escapedInputs = JSON.stringify(inputs);

  return `\n;(() => {\n  try {\n    let __algoFn;\n    try { __algoFn = eval(${escapedFn}); } catch (e) { __algoFn = globalThis[${escapedFn}]; }\n    if (typeof __algoFn !== 'function') { throw new Error('Could not locate function ' + ${escapedFn}); }\n    const __algoInputs = ${escapedInputs};\n    const __algoOutputs = [];\n    for (const __algoInput of __algoInputs) {\n      const __algoNormalized = String(__algoInput).replace(/([A-Za-z_$][\\w$]*\\s*=\\s*)/g, '').trim();\n      const __algoArgs = __algoNormalized.length > 0 ? eval('[' + __algoNormalized + ']') : [];\n      const __algoResult = __algoFn(...__algoArgs);\n      __algoOutputs.push(__algoResult);\n    }\n    console.log(JSON.stringify(__algoOutputs));\n  } catch (e) {\n    console.error('@@HARNESS_ERROR@@', e && (e.stack || e.message));\n    throw e;\n  }\n})();\n`;
};

const getPrimaryFunctionName = (source: string): string | null => {
  const match = source.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
  return match?.[1] || null;
};

const getUniqueTopicsForDifficulty = async (difficulty: Difficulty): Promise<string[]> => {
  const records = await prisma.problem.findMany({
    where: { difficulty },
    distinct: ['topic'],
    select: { topic: true },
  });
  return records.map((record) => record.topic).sort();
};

const chooseTopic = (topics: string[], seed: string, excluded: Set<string>): string => {
  if (topics.length === 0) {
    throw new Error('No available topics for boss generation.');
  }

  const index = deterministicIndex(seed, topics.length);
  for (let i = 0; i < topics.length; i += 1) {
    const candidate = topics[(index + i) % topics.length];
    if (!excluded.has(candidate)) {
      return candidate;
    }
  }

  return topics[index];
};

const createDailyBossesForDate = async (date: string): Promise<void> => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const usedTopics = new Set<string>();

  const topicPools = await Promise.all(
    difficulties.map((difficulty) => getUniqueTopicsForDifficulty(difficulty)),
  );

  const selectedTopics: Record<Difficulty, string> = { easy: '', medium: '', hard: '' };

  difficulties.forEach((difficulty, index) => {
    const pool = topicPools[index];
    if (pool.length === 0) return;
    const topic = chooseTopic(pool, `${date}-${difficulty}`, usedTopics);
    selectedTopics[difficulty] = topic;
    usedTopics.add(topic);
  });

  for (const difficulty of difficulties) {
    const topic = selectedTopics[difficulty];

    if (!topic) {
      throw new Error(`No available problems found for difficulty ${difficulty}.`);
    }

    await prisma.dailyBoss.upsert({
      where: { date_difficulty: { date, difficulty } },
      create: {
        date,
        topic,
        difficulty,
        bossName: bossNameFor(topic, difficulty),
        order: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      },
      update: {},
    });
  }
};

const getRecentlyAssignedProblemIds = async (
  userId: string,
  topic: string,
  difficulty: Difficulty,
): Promise<Set<string>> => {
  const previous = await prisma.userBossBattle.findMany({
    where: {
      userId,
      dailyBoss: { topic, difficulty },
    },
    select: { problemId: true },
  });
  return new Set(previous.map((entry) => entry.problemId));
};

const pickRandomEligibleProblem = async (
  userId: string,
  topic: string,
  difficulty: Difficulty,
): Promise<{ id: string }> => {
  const eligibleProblems = await prisma.problem.findMany({
    where: { topic, difficulty },
  });

  if (eligibleProblems.length === 0) {
    throw new Error(`No problems found for topic ${topic} at difficulty ${difficulty}.`);
  }

  const recentlyUsed = await getRecentlyAssignedProblemIds(userId, topic, difficulty);
  const freshProblems = eligibleProblems.filter((problem) => !recentlyUsed.has(problem.id));
  const pool = freshProblems.length > 0 ? freshProblems : eligibleProblems;

  return pool[Math.floor(Math.random() * pool.length)];
};

export const getTodayBosses = async (userId: string): Promise<BossTodayResponse> => {
  const today = new Date();
  const date = today.toISOString().split('T')[0];

  await createDailyBossesForDate(date);

  const dailyBosses = await prisma.dailyBoss.findMany({
    where: { date },
    orderBy: { order: 'asc' },
  });

  const bossAssignments = await Promise.all(
    dailyBosses.map(async (dailyBoss) => {
      let assignment = await prisma.userBossBattle.findUnique({
        where: { user_daily_boss: { userId, dailyBossId: dailyBoss.id } },
        include: { problem: true, dailyBoss: true },
      });

      if (!assignment) {
        const selectedProblem = await pickRandomEligibleProblem(
          userId,
          dailyBoss.topic,
          dailyBoss.difficulty as Difficulty,
        );

        assignment = await prisma.userBossBattle.create({
          data: {
            userId,
            dailyBossId: dailyBoss.id,
            problemId: selectedProblem.id,
          },
          include: { problem: true, dailyBoss: true },
        });
      }

      return {
        id: assignment.id,
        dailyBossId: assignment.dailyBossId,
        name: assignment.dailyBoss.bossName,
        topic: assignment.dailyBoss.topic,
        difficulty: assignment.dailyBoss.difficulty as Difficulty,
        hp: assignment.hp,
        defeated: assignment.defeated,
        problem: {
          id: assignment.problem.id,
          title: assignment.problem.title,
          topic: assignment.problem.topic,
          difficulty: assignment.problem.difficulty as Difficulty,
          description: assignment.problem.description,
          starterCode: assignment.problem.starterCode,
          testCases: (assignment.problem.testCases ?? []) as Array<{ input: string; output: string }>,
        },
      };
    }),
  );

  return { bosses: bossAssignments };
};

const executeBatch = async (
  sourceCode: string,
  language: string,
  inputs: string[],
): Promise<{ stdout: string; stderr: string; compileOutput: string; statusId: number; statusDescription: string }> => {
  const normalizedLanguage = language.trim().toLowerCase();
  const languageId = LANGUAGE_MAPPING[normalizedLanguage] || 63;

  const preparedSource = ['javascript', 'js'].includes(normalizedLanguage)
    ? stripTypeScript(sourceCode)
    : sourceCode;

  let finalSource = preparedSource;

  const primaryFunction = getPrimaryFunctionName(preparedSource);
  if (primaryFunction && ['javascript', 'js', 'typescript', 'ts'].includes(normalizedLanguage)) {
    finalSource += '\n' + buildBatchHarness(primaryFunction, inputs);
  }

  const response = await axios.post(
    `${JUDGE0_API_URL}/submissions/?base64_encoded=false&wait=true`,
    {
      source_code: finalSource,
      language_id: languageId,
      stdin: '',
    },
    { timeout: 30000 },
  );

  const data = response.data;

  return {
    stdout: data.stdout ?? '',
    stderr: data.stderr ?? '',
    compileOutput: data.compile_output ?? '',
    statusId: data.status?.id ?? -1,
    statusDescription: data.status?.description ?? 'Unknown',
  };
};

export const submitBossBattle = async (
  userId: string,
  bossAssignmentId: string,
  request: BossSubmitPayload,
): Promise<BossSubmitResponse> => {
  const { testOnly = false } = request;
  const assignment = await prisma.userBossBattle.findUnique({
    where: { id: bossAssignmentId },
    include: { problem: true, dailyBoss: true },
  });

  if (!assignment) {
    throw new Error('Boss assignment not found.');
  }

  if (assignment.userId !== userId) {
    throw new Error('Unauthorized boss assignment access.');
  }

  const problem = assignment.problem;
  const testCases = (problem.testCases ?? []) as Array<{ input: string; output: string }>;

  if (assignment.defeated) {
    return {
      passed: true,
      testsPassed: testCases.length,
      totalTests: testCases.length,
      feedback: 'Boss already defeated.',
      hp: 0,
      defeated: true,
    };
  }
  if (testCases.length === 0) {
    throw new Error('No test cases available for this problem.');
  }

  const inputs = testCases.map((testCase) => testCase.input);

  let execution;
  try {
    execution = await executeBatch(request.code, request.language, inputs);
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? 'Could not reach the code execution server. Please try again shortly.'
      : error instanceof Error
        ? error.message
        : 'Code could not be compiled to valid JavaScript.';
    return {
      passed: false,
      testsPassed: 0,
      totalTests: testCases.length,
      feedback: message,
      hp: assignment.hp,
      defeated: false,
    };
  }

  if (execution.statusId !== 3) {
    const feedback = execution.stderr || execution.compileOutput || execution.statusDescription;
    return {
      passed: false,
      testsPassed: 0,
      totalTests: testCases.length,
      feedback: feedback || 'Code execution failed.',
      hp: assignment.hp,
      defeated: false,
    };
  }

  let outputs: unknown[] = [];
  try {
    const rawOutput = execution.stdout || '';
    const jsonString = extractLastJsonString(rawOutput) ?? rawOutput;
    outputs = JSON.parse(jsonString || '[]');
  } catch {
    return {
      passed: false,
      testsPassed: 0,
      totalTests: testCases.length,
      feedback: 'Could not parse execution output.',
      hp: assignment.hp,
      defeated: false,
    };
  }

  let passedCount = 0;
  let failureMessage = '';

  for (let i = 0; i < testCases.length; i += 1) {
    const actualValue = outputs[i];
    const expectedValue = String(testCases[i].output);
    if (compareOutputs(actualValue, expectedValue)) {
      passedCount += 1;
    } else if (!failureMessage) {
      failureMessage = `Test ${i + 1} failed. Expected ${expectedValue}, got ${stringifyActual(actualValue)}`;
    }
  }

  if (passedCount === testCases.length) {
    if (!testOnly) {
      await prisma.userBossBattle.update({
        where: { id: bossAssignmentId },
        data: {
          defeated: true,
          hp: 0,
          completedAt: new Date(),
        },
      });

      return {
        passed: true,
        testsPassed: passedCount,
        totalTests: testCases.length,
        feedback: 'All tests passed. Boss defeated!',
        hp: 0,
        defeated: true,
      };
    }

    return {
      passed: true,
      testsPassed: passedCount,
      totalTests: testCases.length,
      feedback: 'All tests passed.',
      hp: assignment.hp,
      defeated: false,
    };
  }

  return {
    passed: false,
    testsPassed: passedCount,
    totalTests: testCases.length,
    feedback: failureMessage || 'Some test cases failed.',
    hp: assignment.hp,
    defeated: false,
  };
};