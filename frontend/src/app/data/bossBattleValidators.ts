/**
 * Boss Battle Validators
 * Validates user solutions against test cases
 */

import { BattleResult, twoSumBattle, maxDepthBattle, courseScheduleBattle, TreeNode } from "./bossBattleData";

/**
 * Validate Two Sum Solution
 */
export function validateTwoSum(userCode: string): BattleResult {
  const testCases = twoSumBattle.testCases;
  let testsPassed = 0;

  try {
    const userFunction = createFunctionFromCode(userCode, "twoSum");
    if (!userFunction) {
      return {
        passed: false,
        score: 0,
        feedback: "Failed to parse your solution. Check syntax.",
        testsPassed: 0,
        totalTests: testCases.length,
      };
    }

    for (const testCase of testCases) {
      try {
        const result = userFunction(testCase.input.nums, testCase.input.target);

        // Validate result
        if (!Array.isArray(result) || result.length !== 2) {
          continue;
        }

        const [i, j] = result;
        if (
          typeof i !== "number" ||
          typeof j !== "number" ||
          i < 0 ||
          j < 0 ||
          i >= testCase.input.nums.length ||
          j >= testCase.input.nums.length ||
          i === j
        ) {
          continue;
        }

        if (
          testCase.input.nums[i] + testCase.input.nums[j] ===
          testCase.input.target
        ) {
          testsPassed++;
        }
      } catch (e) {
        // Test case failed
        continue;
      }
    }

    const passed = testsPassed === testCases.length;
    const score = passed ? twoSumBattle.points : Math.floor((testsPassed / testCases.length) * twoSumBattle.points);

    return {
      passed,
      score,
      feedback: passed
        ? "🎉 Perfect! All test cases passed!"
        : `${testsPassed}/${testCases.length} test cases passed. Check edge cases.`,
      testsPassed,
      totalTests: testCases.length,
    };
  } catch (error) {
    return {
      passed: false,
      score: 0,
      feedback: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      testsPassed: 0,
      totalTests: testCases.length,
    };
  }
}

/**
 * Validate Maximum Depth Solution
 */
export function validateMaxDepth(userCode: string): BattleResult {
  const testCases = maxDepthBattle.testCases;
  let testsPassed = 0;

  try {
    const userFunction = createFunctionFromCode(userCode, "maxDepth", true);
    if (!userFunction) {
      return {
        passed: false,
        score: 0,
        feedback: "Failed to parse your solution. Check syntax.",
        testsPassed: 0,
        totalTests: testCases.length,
      };
    }

    for (const testCase of testCases) {
      try {
        const result = userFunction(testCase.input.root);

        if (typeof result === "number" && result === testCase.expected) {
          testsPassed++;
        }
      } catch (e) {
        // Test case failed
        continue;
      }
    }

    const passed = testsPassed === testCases.length;
    const score = passed ? maxDepthBattle.points : Math.floor((testsPassed / testCases.length) * maxDepthBattle.points);

    return {
      passed,
      score,
      feedback: passed
        ? "🎉 Excellent! All test cases passed!"
        : `${testsPassed}/${testCases.length} test cases passed. Review your recursion logic.`,
      testsPassed,
      totalTests: testCases.length,
    };
  } catch (error) {
    return {
      passed: false,
      score: 0,
      feedback: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      testsPassed: 0,
      totalTests: testCases.length,
    };
  }
}

/**
 * Validate Course Schedule Solution
 */
export function validateCourseSchedule(userCode: string): BattleResult {
  const testCases = courseScheduleBattle.testCases;
  let testsPassed = 0;

  try {
    const userFunction = createFunctionFromCode(userCode, "canFinish");
    if (!userFunction) {
      return {
        passed: false,
        score: 0,
        feedback: "Failed to parse your solution. Check syntax.",
        testsPassed: 0,
        totalTests: testCases.length,
      };
    }

    for (const testCase of testCases) {
      try {
        const result = userFunction(testCase.input.numCourses, testCase.input.prerequisites);

        if (typeof result === "boolean" && result === testCase.expected) {
          testsPassed++;
        }
      } catch (e) {
        // Test case failed
        continue;
      }
    }

    const passed = testsPassed === testCases.length;
    const score = passed ? courseScheduleBattle.points : Math.floor((testsPassed / testCases.length) * courseScheduleBattle.points);

    return {
      passed,
      score,
      feedback: passed
        ? "🏆 Fantastic! You detected cycles correctly!"
        : `${testsPassed}/${testCases.length} test cases passed. Check cycle detection logic.`,
      testsPassed,
      totalTests: testCases.length,
    };
  } catch (error) {
    return {
      passed: false,
      score: 0,
      feedback: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      testsPassed: 0,
      totalTests: testCases.length,
    };
  }
}

/**
 * Helper: Extract function from user code
 */
function createFunctionFromCode(
  code: string,
  functionName: string,
  needsTreeNode: boolean = false
): Function | null {
  try {
    // Create a sandbox context
    const context: any = { console };

    // Add TreeNode class if needed
    if (needsTreeNode) {
      context.TreeNode = class TreeNode {
        val: number;
        left: TreeNode | null;
        right: TreeNode | null;
        constructor(
          val: number = 0,
          left: TreeNode | null = null,
          right: TreeNode | null = null
        ) {
          this.val = val;
          this.left = left;
          this.right = right;
        }
      };
    }

    // Wrap code in a function that returns the target function
    const wrappedCode = `
      (function() {
        ${code}
        return ${functionName};
      })()
    `;

    // Execute and get the function
    const fn = new Function(...Object.keys(context), wrappedCode)(
      ...Object.values(context)
    );

    return typeof fn === "function" ? fn : null;
  } catch (error) {
    console.error("Code parsing error:", error);
    return null;
  }
}

/**
 * Get validator for battle ID
 */
export function getValidator(battleId: number): ((code: string) => BattleResult) | null {
  switch (battleId) {
    case 1:
      return validateTwoSum;
    case 2:
      return validateMaxDepth;
    case 3:
      return validateCourseSchedule;
    default:
      return null;
  }
}
