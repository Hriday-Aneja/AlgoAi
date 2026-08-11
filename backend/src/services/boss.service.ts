import axios from 'axios';
import { prisma } from '../config/database';
import { executeJavaScript } from './judge0.service';
import {
  BossTodayResponse,
  BossSubmitPayload,
  BossSubmitResponse,
} from '../types/boss.types';

type Difficulty = 'easy' | 'medium' | 'hard';

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

const compareOutputs = (actualText: string, expectedText: string): boolean => {
  const normalizedActualString = normalizeOutput(actualText);
  const normalizedExpectedString = normalizeOutput(expectedText);
  if (normalizedActualString === normalizedExpectedString) return true;

  const actualParsed = tryParseJson(actualText);
  const expectedParsed = tryParseJson(expectedText);

  const actualValue = actualParsed.ok ? actualParsed.value : actualText;
  const expectedValue = expectedParsed.ok ? expectedParsed.value : expectedText;

  return stableStringify(actualValue) === stableStringify(expectedValue);
};

const deterministicIndex = (seed: string, length: number): number => {
  let hash = 0;
  for (const char of seed) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  return ((hash % length) + length) % length;
};

const getUniqueTopicsForDifficulty = async (difficulty: Difficulty): Promise<string[]> => {
  const records = await prisma.problem.findMany({
    where: { difficulty: { equals: difficulty, mode: 'insensitive' } },
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
    where: { topic, difficulty: { equals: difficulty, mode: 'insensitive' } },
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
          examples: assignment.problem.examples,
          constraints: assignment.problem.constraints,
          testCases: (assignment.problem.testCases ?? []) as Array<{ input: string; output: string }>,
        },
      };
    }),
  );

  return { bosses: bossAssignments };
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

  let passedCount = 0;
  let failureMessage = '';

  for (let i = 0; i < testCases.length; i += 1) {
    const testCase = testCases[i];

    let execution;
    try {
      execution = await executeJavaScript(request.code, testCase.input);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? 'Could not reach the code execution server. Please try again shortly.'
        : error instanceof Error
          ? error.message
          : 'Code could not be executed.';
      return {
        passed: false,
        testsPassed: passedCount,
        totalTests: testCases.length,
        feedback: message,
        hp: assignment.hp,
        defeated: false,
      };
    }

    if (!execution.success) {
      const feedback = execution.stderr || execution.compileOutput || execution.statusDescription;
      return {
        passed: false,
        testsPassed: passedCount,
        totalTests: testCases.length,
        feedback: feedback || `Test ${i + 1} failed to execute.`,
        hp: assignment.hp,
        defeated: false,
      };
    }

    const actualText = execution.stdout.trim();
    const expectedText = String(testCase.output);

    if (compareOutputs(actualText, expectedText)) {
      passedCount += 1;
    } else if (!failureMessage) {
      failureMessage = `Test ${i + 1} failed. Expected ${expectedText}, got ${actualText}`;
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