/**
 * Boss Battle - Data and Test Cases
 * Contains battle definitions and hidden test cases
 */

export interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export interface BossBattle {
  id: number;
  title: string;
  description: string;
  points: number;
  difficulty: "Easy" | "Medium" | "Hard";
  boilerplate: string;
  testCases: any[];
}

export interface BattleResult {
  passed: boolean;
  score: number;
  feedback: string;
  testsPassed: number;
  totalTests: number;
}

// Test Case Helpers
function createTreeNode(val: number, left: TreeNode | null = null, right: TreeNode | null = null): TreeNode {
  return { val, left, right };
}

// Battle 1: Two Sum
export const twoSumBattle: BossBattle = {
  id: 1,
  title: "Two Sum",
  description: "Find two numbers in array that add up to target. Return their indices.",
  points: 10,
  difficulty: "Easy",
  boilerplate: `function twoSum(nums: number[], target: number): number[] {
  // Your solution here
  return [];
}`,
  testCases: [
    {
      input: { nums: [2, 7, 11, 15], target: 9 },
      expected: [0, 1],
      description: "Basic case: 2 + 7 = 9",
    },
    {
      input: { nums: [3, 2, 4], target: 6 },
      expected: [1, 2],
      description: "Different order: 2 + 4 = 6",
    },
    {
      input: { nums: [3, 3], target: 6 },
      expected: [0, 1],
      description: "Same values: 3 + 3 = 6",
    },
    {
      input: { nums: [1, 2, 3, 4, 5, 6, 7], target: 13 },
      expected: [6, 5],
      description: "Larger array: 7 + 6 = 13",
    },
    {
      input: { nums: [-1, -2, -3, -4, -5], target: -8 },
      expected: [1, 4],
      description: "Negative numbers: -2 + -5 = -8",
    },
  ],
};

// Battle 2: Maximum Depth of Binary Tree
export const maxDepthBattle: BossBattle = {
  id: 2,
  title: "Maximum Depth of Binary Tree",
  description: "Find the maximum depth of a binary tree (height).",
  points: 15,
  difficulty: "Medium",
  boilerplate: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val: number = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function maxDepth(root: TreeNode | null): number {
  // Your solution here
  return 0;
}`,
  testCases: [
    {
      input: {
        root: createTreeNode(3, createTreeNode(9), createTreeNode(20, createTreeNode(15), createTreeNode(7))),
      },
      expected: 3,
      description: "Balanced tree: depth 3",
    },
    {
      input: { root: createTreeNode(2, null, createTreeNode(3)) },
      expected: 2,
      description: "Right-skewed tree: depth 2",
    },
    {
      input: { root: null },
      expected: 0,
      description: "Empty tree: depth 0",
    },
    {
      input: { root: createTreeNode(1) },
      expected: 1,
      description: "Single node: depth 1",
    },
    {
      input: {
        root: createTreeNode(
          1,
          createTreeNode(2, createTreeNode(3, createTreeNode(4)))
        ),
      },
      expected: 4,
      description: "Left-skewed tree: depth 4",
    },
  ],
};

// Battle 3: Course Schedule (Cycle Detection)
export const courseScheduleBattle: BossBattle = {
  id: 3,
  title: "Course Schedule",
  description: "Detect if there's a cycle in course prerequisites (directed graph).",
  points: 20,
  difficulty: "Hard",
  boilerplate: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  // Your solution here
  return true;
}`,
  testCases: [
    {
      input: { numCourses: 2, prerequisites: [[1, 0]] },
      expected: true,
      description: "No cycle: course 1 depends on 0",
    },
    {
      input: { numCourses: 2, prerequisites: [[1, 0], [0, 1]] },
      expected: false,
      description: "Cycle detected: 0 -> 1 -> 0",
    },
    {
      input: { numCourses: 3, prerequisites: [[0, 1], [1, 2]] },
      expected: true,
      description: "Linear dependency: no cycle",
    },
    {
      input: { numCourses: 3, prerequisites: [[0, 1], [1, 2], [2, 0]] },
      expected: false,
      description: "Cycle: 0 -> 1 -> 2 -> 0",
    },
    {
      input: { numCourses: 4, prerequisites: [[1, 0], [2, 1], [3, 2]] },
      expected: true,
      description: "Long chain without cycle",
    },
  ],
};

export const allBattles: BossBattle[] = [twoSumBattle, maxDepthBattle, courseScheduleBattle];
