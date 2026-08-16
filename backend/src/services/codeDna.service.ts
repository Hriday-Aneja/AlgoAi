import { prisma } from '../config/database';
import { getAllSubmissionsForUser } from '../repositories/submission.repository';

export interface TopicStat {
  topic: string;
  attempted: number;
  solved: number;
  accuracy: number;
}

export interface CodeDnaStats {
  totalSubmissions: number;
  totalPassed: number;
  overallAccuracy: number | null;
  topics: TopicStat[];
  speed: {
    avgSolveSeconds: number | null;
    score: number | null;
    sampleSize: number;
  };
  debugSpeed: {
    avgRecoverySeconds: number | null;
    score: number | null;
    sampleSize: number;
  };
  patternRecognition: {
    repeatedTopicAccuracy: number | null;
    singleAttemptTopicAccuracy: number | null;
    score: number | null;
    sampleSize: number;
  };
}

const clampScore = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Linear scale from a "fast" duration (-> 100) to a "slow" duration (-> 0),
 * clamped at both ends. These thresholds are a documented, reasonable
 * judgment call for typical DSA problem-solving pace — not a fabricated
 * percentile against other users, since no cross-user benchmark exists.
 */
const scoreFromDuration = (seconds: number, fastSeconds: number, slowSeconds: number): number => {
  if (seconds <= fastSeconds) return 100;
  if (seconds >= slowSeconds) return 0;
  const ratio = (slowSeconds - seconds) / (slowSeconds - fastSeconds);
  return clampScore(ratio * 100);
};

export const getCodeDnaStats = async (userId: string): Promise<CodeDnaStats> => {
  const [submissions, progressRecords] = await Promise.all([
    getAllSubmissionsForUser(userId),
    prisma.userProblemProgress.findMany({ where: { userId } }),
  ]);

  const topicsByProblem = new Map<string, string[]>();
  const progressByProblem = new Map<string, { status: string; createdAt: Date; updatedAt: Date }>();
  progressRecords.forEach((r) => {
    topicsByProblem.set(r.problemId, (r.topic || []).map((t) => (t || '').trim()).filter(Boolean));
    progressByProblem.set(r.problemId, { status: r.status, createdAt: r.createdAt, updatedAt: r.updatedAt });
  });

  const totalSubmissions = submissions.length;
  const totalPassed = submissions.filter((s) => s.status === 'passed').length;
  const overallAccuracy = totalSubmissions > 0 ? clampScore((totalPassed / totalSubmissions) * 100) : null;

  // ─── Per-topic accuracy: passed / total submissions for problems tagged with that topic ───
  const topicTotals = new Map<string, { total: number; passed: number; problems: Set<string> }>();
  submissions.forEach((s) => {
    const topics = topicsByProblem.get(s.problemId) || [];
    topics.forEach((topic) => {
      if (!topicTotals.has(topic)) topicTotals.set(topic, { total: 0, passed: 0, problems: new Set() });
      const bucket = topicTotals.get(topic)!;
      bucket.total += 1;
      bucket.problems.add(s.problemId);
      if (s.status === 'passed') bucket.passed += 1;
    });
  });

  const topics: TopicStat[] = Array.from(topicTotals.entries())
    .map(([topic, bucket]) => {
      const solvedProblems = Array.from(bucket.problems).filter(
        (pid) => progressByProblem.get(pid)?.status === 'solved',
      ).length;
      return {
        topic,
        attempted: bucket.problems.size,
        solved: solvedProblems,
        accuracy: clampScore((bucket.passed / bucket.total) * 100),
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy);

  // ─── Speed: real wall-clock time from first attempt to solve, per solved problem ───
  const solveDurations: number[] = [];
  progressByProblem.forEach((p) => {
    if (p.status === 'solved') {
      const seconds = (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime()) / 1000;
      if (seconds >= 0) solveDurations.push(seconds);
    }
  });
  const avgSolveSeconds = solveDurations.length > 0
    ? solveDurations.reduce((a, b) => a + b, 0) / solveDurations.length
    : null;
  const speedScore = avgSolveSeconds !== null
    ? scoreFromDuration(avgSolveSeconds, 180, 2700) // 3 min -> 100, 45 min -> 0
    : null;

  // ─── Debug speed: time from a problem's first FAIL to its first PASS after that fail ───
  const byProblemSubmissions = new Map<string, { status: string; createdAt: Date }[]>();
  submissions.forEach((s) => {
    if (!byProblemSubmissions.has(s.problemId)) byProblemSubmissions.set(s.problemId, []);
    byProblemSubmissions.get(s.problemId)!.push({ status: s.status, createdAt: s.createdAt });
  });

  const recoveryDurations: number[] = [];
  byProblemSubmissions.forEach((subs) => {
    const sorted = [...subs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstFail = sorted.find((s) => s.status === 'failed');
    if (!firstFail) return;
    const firstPassAfterFail = sorted.find(
      (s) => s.status === 'passed' && new Date(s.createdAt).getTime() >= new Date(firstFail.createdAt).getTime(),
    );
    if (!firstPassAfterFail) return;
    const seconds = (new Date(firstPassAfterFail.createdAt).getTime() - new Date(firstFail.createdAt).getTime()) / 1000;
    if (seconds >= 0) recoveryDurations.push(seconds);
  });

  const avgRecoverySeconds = recoveryDurations.length > 0
    ? recoveryDurations.reduce((a, b) => a + b, 0) / recoveryDurations.length
    : null;
  const debugSpeedScore = avgRecoverySeconds !== null
    ? scoreFromDuration(avgRecoverySeconds, 60, 1200) // 1 min -> 100, 20 min -> 0
    : null;

  // ─── Pattern recognition: accuracy on topics seen 3+ times vs topics seen once ───
  const repeatedTopics = topics.filter((t) => t.attempted >= 3);
  const singleTopics = topics.filter((t) => t.attempted === 1);

  const avgAccuracy = (list: TopicStat[]): number | null =>
    list.length > 0 ? clampScore(list.reduce((sum, t) => sum + t.accuracy, 0) / list.length) : null;

  const repeatedTopicAccuracy = avgAccuracy(repeatedTopics);
  const singleAttemptTopicAccuracy = avgAccuracy(singleTopics);

  return {
    totalSubmissions,
    totalPassed,
    overallAccuracy,
    topics,
    speed: {
      avgSolveSeconds: avgSolveSeconds !== null ? Math.round(avgSolveSeconds) : null,
      score: speedScore,
      sampleSize: solveDurations.length,
    },
    debugSpeed: {
      avgRecoverySeconds: avgRecoverySeconds !== null ? Math.round(avgRecoverySeconds) : null,
      score: debugSpeedScore,
      sampleSize: recoveryDurations.length,
    },
    patternRecognition: {
      repeatedTopicAccuracy,
      singleAttemptTopicAccuracy,
      score: repeatedTopics.length > 0 ? repeatedTopicAccuracy : null,
      sampleSize: repeatedTopics.length,
    },
  };
};