const assert = require('assert');
const { calculateNextStreakState } = require('../src/services/streak.service');

const firstLogin = calculateNextStreakState({ currentStreak: 0, daysDiff: 0 });
assert.strictEqual(firstLogin.currentStreak, 1, 'First login should start at 1 day streak');
assert.strictEqual(firstLogin.streakIncremented, false, 'First login should not count as an increment');

const nextDay = calculateNextStreakState({ currentStreak: 1, daysDiff: 1 });
assert.strictEqual(nextDay.currentStreak, 2, 'Logging the next day should increase the streak to 2');

const afterBreak = calculateNextStreakState({ currentStreak: 3, daysDiff: 5 });
assert.strictEqual(afterBreak.currentStreak, 1, 'Logging after a break should restart the streak at 1');

console.log('streak service regression tests passed');
