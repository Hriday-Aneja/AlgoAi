import assert from 'assert';
import { prisma } from '../src/config/database';
import { getWeakTopics } from '../src/services/weakTopic.service';

(async () => {
  const userId = 'test-user-weak-topics';

  await prisma.userProblemProgress.deleteMany({ where: { userId } });

  await prisma.userProblemProgress.create({
    data: {
      userId,
      problemId: 'p-1',
      topic: ['arrays'],
      difficulty: 'easy',
      status: 'attempted',
      timeTaken: 3600,
    },
  });

  const weakTopics = await getWeakTopics(userId);

  assert(weakTopics.some(topic => topic.topic === 'arrays'), `Expected weak topics for ${userId}, got ${JSON.stringify(weakTopics)}`);
  console.log('PASS', weakTopics);
})().catch((error) => {
  console.error('FAIL', error);
  process.exit(1);
});
