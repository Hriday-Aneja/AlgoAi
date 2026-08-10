import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Trophy,
  XCircle,
  Zap
} from "lucide-react";

type Mode = "concepts" | "learn" | "quiz";
type ConceptId =
  | "arrays"
  | "linked-list"
  | "trees"
  | "graphs"
  | "dynamic-programming"
  | "sorting";

type Concept = {
  id: ConceptId;
  title: string;
  icon: string;
  description: string;
  keyPoints: string[];
};

type Challenge = {
  id: number;
  code: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  color: string;
};

const CONCEPTS: Concept[] = [
  {
    id: "arrays",
    title: "Arrays",
    icon: "📦",
    description: "Learn how arrays store and access data efficiently.",
    keyPoints: [
      "Arrays store elements in contiguous memory.",
      "Accessing an element by index is O(1).",
      "Searching an unsorted array takes O(n).",
      "Common patterns include two pointers and sliding window."
    ]
  },
  {
    id: "linked-list",
    title: "Linked List",
    icon: "🔗",
    description: "Understand nodes, pointers and linked-list traversal.",
    keyPoints: [
      "Each node stores data and a reference to another node.",
      "Insertion and deletion can be O(1) when the position is known.",
      "Random access is O(n).",
      "Common types are singly, doubly and circular linked lists."
    ]
  },
  {
    id: "trees",
    title: "Trees",
    icon: "🌳",
    description: "Understand hierarchical data structures and tree traversal.",
    keyPoints: [
      "A tree is a hierarchical data structure made of nodes.",
      "The topmost node is called the root.",
      "Common traversals are DFS and BFS.",
      "Binary trees have at most two children per node."
    ]
  },
  {
    id: "graphs",
    title: "Graphs",
    icon: "🕸️",
    description: "Learn how connected data is represented and traversed.",
    keyPoints: [
      "Graphs consist of vertices and edges.",
      "Graphs can be directed or undirected.",
      "BFS uses a queue.",
      "DFS can be implemented using recursion or a stack."
    ]
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    icon: "🧠",
    description: "Learn how to solve problems using overlapping subproblems.",
    keyPoints: [
      "DP breaks a problem into smaller subproblems.",
      "Overlapping subproblems allow previously computed results to be reused.",
      "Memoization is a top-down approach.",
      "Tabulation is a bottom-up approach."
    ]
  },
  {
    id: "sorting",
    title: "Sorting",
    icon: "↕️",
    description: "Understand common algorithms used to arrange data.",
    keyPoints: [
      "Sorting arranges elements according to a chosen order.",
      "Bubble sort, merge sort and quicksort are common examples.",
      "Different algorithms have different time and space complexities.",
      "Choosing the right sorting algorithm depends on the problem."
    ]
  }
];

const CHALLENGES_BY_CONCEPT: Record<ConceptId, Challenge[]> = {
  arrays: [
    {
      id: 1,
      code: `function solve(arr) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
  return arr;
}`,
      question: "What does this code do?",
      options: [
        "Sorts an array in ascending order",
        "Reverses an array in-place",
        "Finds the maximum element",
        "Rotates array by one position"
      ],
      answer: 1,
      explanation:
        "This is the classic two-pointer technique to reverse an array in-place. Left and right pointers swap elements and move toward each other until they meet.",
      topic: "Two Pointers",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 2,
      code: `function solve(root) {
  if (!root) return 0;
  const left = solve(root.left);
  const right = solve(root.right);
  return Math.max(left, right) + 1;
}`,
      question: "What problem does this solve?",
      options: [
        "Count nodes in binary tree",
        "Find minimum depth of tree",
        "Find maximum depth of binary tree",
        "Check if tree is balanced"
      ],
      answer: 2,
      explanation:
        "This recursively finds the maximum depth. At each node, it takes the max depth of left and right subtrees and adds 1 for the current node. Base case: null node returns 0.",
      topic: "Binary Trees",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 3,
      code: `function solve(s) {
  const map = new Map();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right])) left = Math.max(left, map.get(s[right]) + 1);
    map.set(s[right], right);
    max = Math.max(max, right - left + 1);
  }
  return max;
}`,
      question: "What problem is this solving?",
      options: [
        "Find all duplicate characters in string",
        "Count character frequencies",
        "Longest substring without repeating characters",
        "Check if string is a palindrome"
      ],
      answer: 2,
      explanation:
        "This uses the sliding window technique with a HashMap. The window [left, right] maintains no duplicate characters. When a duplicate is found, left pointer jumps past the previous occurrence.",
      topic: "Sliding Window",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 4,
      code: `function solve(nums) {
  const dp = new Array(nums.length).fill(1);
  let max = 1;
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    max = Math.max(max, dp[i]);
  }
  return max;
}`,
      question: "What classic DP problem is this?",
      options: [
        "Maximum Subarray (Kadane's)",
        "Longest Increasing Subsequence",
        "Coin Change problem",
        "0/1 Knapsack"
      ],
      answer: 1,
      explanation:
        "This is the O(n²) Longest Increasing Subsequence (LIS) solution. dp[i] stores the length of LIS ending at index i. For each i, it looks at all previous elements smaller than nums[i] and extends their LIS.",
      topic: "Dynamic Programming",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 5,
      code: `function solve(graph, start) {
  const visited = new Set();
  const queue = [start];
  visited.add(start);
  while (queue.length) {
    const node = queue.shift();
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited.size;
}`,
      question: "What algorithm is implemented here?",
      options: [
        "Depth-First Search (DFS)",
        "Dijkstra's Shortest Path",
        "Breadth-First Search (BFS)",
        "Bellman-Ford Algorithm"
      ],
      answer: 2,
      explanation:
        "This is BFS (Breadth-First Search) using a queue. It explores nodes level by level, marking visited nodes to avoid cycles. Returns the count of reachable nodes from start.",
      topic: "Graph BFS",
      difficulty: "Hard",
      color: "#ef4444"
    }
  ],
  "linked-list": [
    {
      id: 1,
      code: `function solve(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
      question: "What does this linked-list code do?",
      options: [
        "Detects a cycle in a linked list",
        "Reverses a linked list iteratively",
        "Deletes the middle node",
        "Merges two sorted linked lists"
      ],
      answer: 1,
      explanation:
        "The code reverses the links one by one using prev, curr and next pointers. At the end, prev becomes the new head.",
      topic: "Pointer Reversal",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 2,
      code: `function solve(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}`,
      question: "What does this function return?",
      options: [
        "The first node",
        "The last node",
        "The middle node",
        "The node before the tail"
      ],
      answer: 2,
      explanation:
        "Fast moves two steps while slow moves one step. When fast reaches the end, slow is at the middle.",
      topic: "Fast and Slow Pointers",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 3,
      code: `function solve(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
      question: "Which problem is solved here?",
      options: [
        "Find linked-list length",
        "Detect a cycle in a linked list",
        "Remove duplicates from a list",
        "Find the intersection of two lists"
      ],
      answer: 1,
      explanation:
        "This is Floyd's cycle detection. If slow and fast ever meet, the linked list contains a cycle.",
      topic: "Cycle Detection",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 4,
      code: `function solve(l1, l2) {
  const dummy = { val: 0, next: null };
  let tail = dummy;
  while (l1 && l2) {
    if (l1.val < l2.val) {
      tail.next = l1;
      l1 = l1.next;
    } else {
      tail.next = l2;
      l2 = l2.next;
    }
    tail = tail.next;
  }
  tail.next = l1 || l2;
  return dummy.next;
}`,
      question: "What does this code build?",
      options: [
        "A reversed linked list",
        "A sorted merged linked list",
        "A circular linked list",
        "A list with duplicate values removed"
      ],
      answer: 1,
      explanation:
        "The dummy node helps build a new sorted chain by repeatedly taking the smaller current node from l1 or l2.",
      topic: "Merge Two Lists",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 5,
      code: `function solve(head, n) {
  const dummy = { next: head };
  let fast = dummy;
  let slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}`,
      question: "What problem does this solve?",
      options: [
        "Remove the nth node from the end",
        "Insert a node at position n",
        "Find the nth node from the start",
        "Reverse nodes in groups of n"
      ],
      answer: 0,
      explanation:
        "The gap between fast and slow is n nodes. When fast reaches the end, slow is just before the node that must be removed.",
      topic: "Nth From End",
      difficulty: "Hard",
      color: "#ef4444"
    }
  ],
  trees: [
    {
      id: 1,
      code: `function solve(root) {
  if (!root) return [];
  return [
    root.val,
    ...solve(root.left),
    ...solve(root.right)
  ];
}`,
      question: "Which traversal is this?",
      options: ["Inorder", "Preorder", "Postorder", "Level order"],
      answer: 1,
      explanation:
        "The node is visited first, then the left subtree, then the right subtree. That is preorder traversal.",
      topic: "Tree DFS",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 2,
      code: `function solve(root) {
  if (!root) return [];
  return [
    ...solve(root.left),
    root.val,
    ...solve(root.right)
  ];
}`,
      question: "For a binary search tree, what does this traversal produce?",
      options: [
        "Values in random order",
        "Values in sorted order",
        "Only leaf values",
        "Values level by level"
      ],
      answer: 1,
      explanation:
        "Inorder traversal of a BST visits values in ascending sorted order.",
      topic: "BST Inorder",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 3,
      code: `function solve(root) {
  if (!root) return 0;
  return Math.max(solve(root.left), solve(root.right)) + 1;
}`,
      question: "What does this recursive function calculate?",
      options: [
        "Tree diameter",
        "Maximum depth of a binary tree",
        "Number of leaf nodes",
        "Minimum value in the tree"
      ],
      answer: 1,
      explanation:
        "Each call returns the deeper subtree height plus one for the current node.",
      topic: "Tree Height",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 4,
      code: `function solve(root) {
  if (!root) return [];
  const ans = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    ans.push(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return ans;
}`,
      question: "What traversal is implemented here?",
      options: ["Preorder DFS", "Postorder DFS", "Level order BFS", "Morris traversal"],
      answer: 2,
      explanation:
        "A queue is used to visit nodes level by level, which is breadth-first traversal.",
      topic: "Tree BFS",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 5,
      code: `function solve(root) {
  let best = 0;
  function depth(node) {
    if (!node) return 0;
    const left = depth(node.left);
    const right = depth(node.right);
    best = Math.max(best, left + right);
    return Math.max(left, right) + 1;
  }
  depth(root);
  return best;
}`,
      question: "Which tree problem is this solving?",
      options: [
        "Lowest common ancestor",
        "Diameter of a binary tree",
        "Validate binary search tree",
        "Serialize and deserialize tree"
      ],
      answer: 1,
      explanation:
        "At each node, left depth plus right depth is a possible diameter. The best value is tracked globally.",
      topic: "Tree Diameter",
      difficulty: "Hard",
      color: "#ef4444"
    }
  ],
  graphs: [
    {
      id: 1,
      code: `function solve(graph, start) {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const next of graph[node] || []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size;
}`,
      question: "Which graph traversal is this?",
      options: ["DFS", "BFS", "Topological sort", "Union find"],
      answer: 1,
      explanation:
        "The queue makes this breadth-first search. It explores all neighbors before going deeper.",
      topic: "Graph BFS",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 2,
      code: `function solve(graph, node, seen = new Set()) {
  if (seen.has(node)) return 0;
  seen.add(node);
  let count = 1;
  for (const next of graph[node] || []) {
    count += solve(graph, next, seen);
  }
  return count;
}`,
      question: "What technique is being used here?",
      options: ["Recursive DFS", "Binary search", "Sliding window", "Heap sort"],
      answer: 0,
      explanation:
        "The function recursively visits each unvisited neighbor, which is depth-first search.",
      topic: "Graph DFS",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 3,
      code: `function solve(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = x => parent[x] === x ? x : parent[x] = find(parent[x]);
  for (const [a, b] of edges) {
    const pa = find(a);
    const pb = find(b);
    if (pa === pb) return true;
    parent[pa] = pb;
  }
  return false;
}`,
      question: "What is this code detecting?",
      options: [
        "Shortest path",
        "Cycle in an undirected graph",
        "Number of islands",
        "Bipartite graph coloring"
      ],
      answer: 1,
      explanation:
        "Union Find groups connected nodes. If an edge connects two nodes already in the same group, it creates a cycle.",
      topic: "Union Find",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 4,
      code: `function solve(n, edges) {
  const indegree = Array(n).fill(0);
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    indegree[b]++;
  }
  const queue = indegree
    .map((v, i) => v === 0 ? i : -1)
    .filter(i => i !== -1);
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const next of graph[node]) {
      if (--indegree[next] === 0) queue.push(next);
    }
  }
  return order.length === n ? order : [];
}`,
      question: "Which algorithm pattern is this?",
      options: ["Dijkstra", "Kahn's topological sort", "Floyd Warshall", "Prim's MST"],
      answer: 1,
      explanation:
        "Nodes with zero indegree are processed first. This is Kahn's algorithm for topological ordering.",
      topic: "Topological Sort",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 5,
      code: `function solve(grid) {
  let count = 0;
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return;
    if (grid[r][c] !== "1") return;
    grid[r][c] = "0";
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === "1") {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}`,
      question: "What classic grid graph problem is this?",
      options: ["Rotting oranges", "Number of islands", "Word ladder", "Course schedule"],
      answer: 1,
      explanation:
        "Every time a new land cell is found, DFS marks the whole connected island as visited.",
      topic: "Grid DFS",
      difficulty: "Hard",
      color: "#ef4444"
    }
  ],
  "dynamic-programming": [
    {
      id: 1,
      code: `function solve(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n] !== undefined) return memo[n];
  memo[n] = solve(n - 1, memo) + solve(n - 2, memo);
  return memo[n];
}`,
      question: "Which DP technique is shown here?",
      options: ["Tabulation", "Memoization", "Greedy", "Backtracking"],
      answer: 1,
      explanation:
        "This is top-down DP. Previously solved Fibonacci values are saved in memo and reused.",
      topic: "Memoization",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 2,
      code: `function solve(cost) {
  const dp = Array(cost.length + 1).fill(0);
  for (let i = 2; i <= cost.length; i++) {
    dp[i] = Math.min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2]);
  }
  return dp[cost.length];
}`,
      question: "What problem does this solve?",
      options: [
        "House robber",
        "Min cost climbing stairs",
        "Coin change",
        "Maximum subarray"
      ],
      answer: 1,
      explanation:
        "dp[i] stores the minimum cost to reach step i by coming from one step or two steps before.",
      topic: "1D DP",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 3,
      code: `function solve(nums) {
  let take = 0;
  let skip = 0;
  for (const num of nums) {
    const newTake = skip + num;
    skip = Math.max(skip, take);
    take = newTake;
  }
  return Math.max(take, skip);
}`,
      question: "Which classic DP problem is this?",
      options: [
        "House Robber",
        "Longest common subsequence",
        "Edit distance",
        "Subset sum"
      ],
      answer: 0,
      explanation:
        "At each house, you either take it with the previous skip value or skip it and keep the best previous result.",
      topic: "Decision DP",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 4,
      code: `function solve(text1, text2) {
  const dp = Array.from({ length: text1.length + 1 }, () =>
    Array(text2.length + 1).fill(0)
  );
  for (let i = 1; i <= text1.length; i++) {
    for (let j = 1; j <= text2.length; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[text1.length][text2.length];
}`,
      question: "What does this 2D DP solve?",
      options: [
        "Longest common subsequence",
        "Longest increasing subsequence",
        "Word break",
        "Palindrome partitioning"
      ],
      answer: 0,
      explanation:
        "The table compares prefixes of two strings. Matching characters extend the subsequence; otherwise the best previous value is kept.",
      topic: "2D DP",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 5,
      code: `function solve(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (a - coin >= 0) {
        dp[a] = Math.min(dp[a], dp[a - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      question: "Which problem is implemented here?",
      options: [
        "0/1 Knapsack",
        "Coin Change minimum coins",
        "Partition equal subset sum",
        "Unique paths"
      ],
      answer: 1,
      explanation:
        "dp[a] stores the fewest coins needed to make amount a. Each coin tries to improve that value.",
      topic: "Unbounded DP",
      difficulty: "Hard",
      color: "#ef4444"
    }
  ],
  sorting: [
    {
      id: 1,
      code: `function solve(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
      question: "Which sorting algorithm is this?",
      options: ["Selection sort", "Bubble sort", "Merge sort", "Quick sort"],
      answer: 1,
      explanation:
        "Adjacent values are repeatedly compared and swapped, causing larger values to bubble toward the end.",
      topic: "Bubble Sort",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 2,
      code: `function solve(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
      question: "Which algorithm inserts each item into the sorted left part?",
      options: ["Insertion sort", "Heap sort", "Counting sort", "Radix sort"],
      answer: 0,
      explanation:
        "Insertion sort grows a sorted prefix and places each new key into its correct position.",
      topic: "Insertion Sort",
      difficulty: "Easy",
      color: "#22c55e"
    },
    {
      id: 3,
      code: `function solve(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = solve(arr.slice(0, mid));
  const right = solve(arr.slice(mid));
  return merge(left, right);
}`,
      question: "Which sorting strategy is shown here?",
      options: [
        "Divide and conquer merge sort",
        "Greedy selection sort",
        "In-place bubble sort",
        "Bucket sort"
      ],
      answer: 0,
      explanation:
        "The array is split into halves recursively, then sorted halves are merged back together.",
      topic: "Merge Sort",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 4,
      code: `function solve(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  return [...solve(left), pivot, ...solve(right)];
}`,
      question: "Which sorting algorithm uses a pivot like this?",
      options: ["Merge sort", "Quick sort", "Counting sort", "Topological sort"],
      answer: 1,
      explanation:
        "Quicksort partitions values around a pivot, then recursively sorts the smaller and larger sides.",
      topic: "Quick Sort",
      difficulty: "Medium",
      color: "#f59e0b"
    },
    {
      id: 5,
      code: `function solve(arr) {
  const max = Math.max(...arr);
  const count = Array(max + 1).fill(0);
  for (const num of arr) count[num]++;
  const result = [];
  for (let num = 0; num < count.length; num++) {
    while (count[num] > 0) {
      result.push(num);
      count[num]--;
    }
  }
  return result;
}`,
      question: "Which sorting algorithm is this?",
      options: ["Heap sort", "Counting sort", "Shell sort", "Quick sort"],
      answer: 1,
      explanation:
        "Counting sort counts occurrences of each non-negative integer, then rebuilds the sorted array from those counts.",
      topic: "Counting Sort",
      difficulty: "Hard",
      color: "#ef4444"
    }
  ]
};

export default function ReverseMode() {
  const [mode, setMode] = useState<Mode>("concepts");
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const activeConcept = selectedConcept ?? CONCEPTS[0];
  const challenges = CHALLENGES_BY_CONCEPT[activeConcept.id];
  const challenge = challenges[currentQ];

  const resetQuizState = () => {
    setCurrentQ(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setFinished(false);
  };

  const selectConcept = (concept: Concept) => {
    resetQuizState();
    setSelectedConcept(concept);
    setMode("learn");
  };

  const startQuiz = () => {
    resetQuizState();
    setMode("quiz");
  };

  const backToConcepts = () => {
    resetQuizState();
    setSelectedConcept(null);
    setMode("concepts");
  };

  const reset = () => {
    resetQuizState();
    setMode(selectedConcept ? "learn" : "concepts");
  };

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    const correct = idx === challenge.answer;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, correct]);
  };

  const next = () => {
    if (currentQ >= challenges.length - 1) {
      setFinished(true);
    } else {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  if (mode === "concepts") {
    return (
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-3 rounded-xl"
              style={{
                background: "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.2)",
                boxShadow: "0 0 25px rgba(168,85,247,0.1)"
              }}
            >
              <Shuffle className="w-6 h-6" style={{ color: "#a855f7" }} />
            </div>

            <div>
              <h1
                className="text-white"
                style={{ fontSize: "28px", fontWeight: 800 }}
              >
                Reverse Problem Mode
              </h1>

              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                Learn a DSA concept first, then identify the problem from code.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mb-5">
          <h2
            className="text-white mb-2"
            style={{ fontSize: "18px", fontWeight: 700 }}
          >
            Choose a DSA Concept
          </h2>

          <p style={{ fontSize: "13px", color: "#6b7280" }}>
            Pick a topic to revise before starting the reverse-mode questions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONCEPTS.map((concept, index) => (
            <motion.button
              key={concept.id}
              onClick={() => selectConcept(concept)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="text-left p-5 rounded-2xl transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 25px rgba(0,0,0,0.25)"
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.2)",
                  fontSize: "24px"
                }}
              >
                {concept.icon}
              </div>

              <h3
                className="text-white mb-2"
                style={{ fontSize: "16px", fontWeight: 700 }}
              >
                {concept.title}
              </h3>

              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  lineHeight: 1.6
                }}
              >
                {concept.description}
              </p>

              <div
                className="flex items-center gap-2 mt-4"
                style={{
                  color: "#a855f7",
                  fontSize: "12px",
                  fontWeight: 600
                }}
              >
                Learn concept
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "learn" && selectedConcept) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={backToConcepts}
            className="flex items-center gap-2 mb-6"
            style={{ color: "#8b949e", fontSize: "13px" }}
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to concepts
          </button>

          <div
            className="p-6 rounded-2xl mb-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 4px 25px rgba(0,0,0,0.25)"
            }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.2)",
                  fontSize: "28px"
                }}
              >
                {selectedConcept.icon}
              </div>

              <div>
                <h1
                  className="text-white mb-2"
                  style={{ fontSize: "28px", fontWeight: 900 }}
                >
                  {selectedConcept.title}
                </h1>
                <p
                  style={{
                    color: "#8b949e",
                    fontSize: "14px",
                    lineHeight: 1.7
                  }}
                >
                  {selectedConcept.description}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {selectedConcept.keyPoints.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{
                    background: "rgba(8,11,20,0.45)",
                    border: "1px solid rgba(255,255,255,0.06)"
                  }}
                >
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: "#22c55e" }}
                  />
                  <p
                    style={{
                      color: "#d1d5db",
                      fontSize: "13px",
                      lineHeight: 1.6
                    }}
                  >
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>

            <div
              className="p-4 rounded-2xl mb-6"
              style={{
                background: "rgba(255,101,0,0.08)",
                border: "1px solid rgba(255,101,0,0.18)"
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4" style={{ color: "#ff6500" }} />
                <span
                  style={{
                    color: "#ff9500",
                    fontSize: "13px",
                    fontWeight: 700
                  }}
                >
                  Reverse Quiz Ready
                </span>
              </div>
              <p
                style={{
                  color: "#8b949e",
                  fontSize: "12px",
                  lineHeight: 1.7
                }}
              >
                You will see code snippets from {selectedConcept.title} and
                identify the problem, pattern or algorithm from the options.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startQuiz}
              className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
              style={{
                background: "linear-gradient(135deg, #ff6500, #ff9500)",
                color: "white",
                fontSize: "14px",
                fontWeight: 800,
                boxShadow: "0 0 20px rgba(255,101,0,0.35)"
              }}
            >
              <Zap className="w-4 h-4" />
              Start Reverse Quiz
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / challenges.length) * 100);

    return (
      <div
        className="h-full flex items-center justify-center p-8"
        style={{ background: "#080b14" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            style={{ fontSize: "80px", marginBottom: "16px" }}
          >
            {pct >= 80 ? "🏆" : pct >= 60 ? "🎯" : "📚"}
          </motion.div>
          <h1
            className="text-white mb-2"
            style={{ fontSize: "32px", fontWeight: 900 }}
          >
            Quiz Complete!
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              marginBottom: "8px"
            }}
          >
            {activeConcept.title}
          </p>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              marginBottom: "32px"
            }}
          >
            You scored{" "}
            <span style={{ color: "#ff6500", fontWeight: 800 }}>
              {score}/{challenges.length}
            </span>{" "}
            ({pct}%)
          </p>

          <div className="grid grid-cols-5 gap-2 mb-8">
            {answers.map((correct, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{
                  background: correct
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(239,68,68,0.15)",
                  border: `1px solid ${
                    correct
                      ? "rgba(34,197,94,0.3)"
                      : "rgba(239,68,68,0.3)"
                  }`
                }}
              >
                {correct ? (
                  <CheckCircle2
                    className="w-5 h-5"
                    style={{ color: "#22c55e" }}
                  />
                ) : (
                  <XCircle
                    className="w-5 h-5"
                    style={{ color: "#ef4444" }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          <div
            className="p-4 rounded-2xl mb-6"
            style={{
              background:
                pct >= 80
                  ? "rgba(34,197,94,0.08)"
                  : pct >= 60
                    ? "rgba(245,158,11,0.08)"
                    : "rgba(239,68,68,0.08)",
              border: `1px solid ${
                pct >= 80
                  ? "rgba(34,197,94,0.2)"
                  : pct >= 60
                    ? "rgba(245,158,11,0.2)"
                    : "rgba(239,68,68,0.2)"
              }`
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: 1.6
              }}
            >
              {pct >= 80
                ? "Excellent! You have strong pattern recognition skills!"
                : pct >= 60
                  ? "Good job! Keep practicing to improve pattern recognition."
                  : "Keep studying! Focus on understanding algorithm patterns."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="px-6 py-3 rounded-xl flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #ff6500, #ff9500)",
                color: "white",
                fontSize: "14px",
                fontWeight: 700,
                boxShadow: "0 0 20px rgba(255,101,0,0.4)"
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={backToConcepts}
              className="px-6 py-3 rounded-xl flex items-center justify-center gap-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#d1d5db",
                fontSize: "14px",
                fontWeight: 700
              }}
            >
              <BookOpen className="w-4 h-4" />
              Choose Concept
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.2)",
              boxShadow: "0 0 20px rgba(168,85,247,0.1)"
            }}
          >
            <Shuffle className="w-5 h-5" style={{ color: "#a855f7" }} />
          </div>
          <div>
            <h1
              className="text-white"
              style={{ fontSize: "20px", fontWeight: 800 }}
            >
              Reverse Problem Mode
            </h1>
            <p style={{ fontSize: "12px", color: "#4a5568" }}>
              {activeConcept.title} - See code → Identify the problem & pattern
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.2)"
            }}
          >
            <Trophy className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <span
              style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b" }}
            >
              {score}/{challenges.length}
            </span>
          </div>

          <div className="flex gap-1">
            {challenges.map((_, i) => (
              <div
                key={i}
                className="w-8 h-1.5 rounded-full transition-all"
                style={{
                  background:
                    i < answers.length
                      ? answers[i]
                        ? "#22c55e"
                        : "#ef4444"
                      : i === currentQ
                        ? "#ff6500"
                        : "rgba(255,255,255,0.08)",
                  boxShadow:
                    i === currentQ ? "0 0 8px rgba(255,101,0,0.6)" : "none"
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeConcept.id}-${currentQ}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-full"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                background: `${challenge.color}15`,
                color: challenge.color,
                border: `1px solid ${challenge.color}30`
              }}
            >
              {challenge.difficulty}
            </span>
            <span
              className="px-3 py-1 rounded-full"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                background: "rgba(168,85,247,0.1)",
                color: "#a855f7",
                border: "1px solid rgba(168,85,247,0.2)"
              }}
            >
              {challenge.topic}
            </span>
            <span style={{ color: "#4a5568", fontSize: "12px" }}>
              Challenge {currentQ + 1} of {challenges.length}
            </span>
          </div>

          <div
            className="rounded-2xl overflow-hidden mb-6"
            style={{
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 4px 30px rgba(0,0,0,0.35)"
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)"
              }}
            >
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3" style={{ fontSize: "12px", color: "#6b7280" }}>
                reverse_challenge.js
              </span>
            </div>

            <pre
              className="p-5 overflow-x-auto"
              style={{
                color: "#d1d5db",
                fontSize: "13px",
                lineHeight: 1.7,
                fontFamily: "JetBrains Mono, Consolas, monospace"
              }}
            >
              <code>{challenge.code}</code>
            </pre>
          </div>

          <div className="mb-5">
            <h2
              className="text-white mb-2"
              style={{ fontSize: "22px", fontWeight: 800 }}
            >
              {challenge.question}
            </h2>
            <p style={{ color: "#6b7280", fontSize: "13px" }}>
              Choose the best answer based on the code pattern.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {challenge.options.map((option, idx) => {
              const isSelected = selected === idx;
              const isCorrect = idx === challenge.answer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={option}
                  whileHover={selected === null ? { scale: 1.01 } : undefined}
                  whileTap={selected === null ? { scale: 0.99 } : undefined}
                  onClick={() => handleSelect(idx)}
                  className="w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all"
                  style={{
                    background: showCorrect
                      ? "rgba(34,197,94,0.12)"
                      : showWrong
                        ? "rgba(239,68,68,0.12)"
                        : isSelected
                          ? "rgba(255,101,0,0.1)"
                          : "rgba(255,255,255,0.04)",
                    border: showCorrect
                      ? "1px solid rgba(34,197,94,0.35)"
                      : showWrong
                        ? "1px solid rgba(239,68,68,0.35)"
                        : isSelected
                          ? "1px solid rgba(255,101,0,0.35)"
                          : "1px solid rgba(255,255,255,0.08)",
                    cursor: selected === null ? "pointer" : "default"
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: showCorrect
                        ? "rgba(34,197,94,0.18)"
                        : showWrong
                          ? "rgba(239,68,68,0.18)"
                          : "rgba(255,255,255,0.06)",
                      color: showCorrect ? "#22c55e" : showWrong ? "#ef4444" : "#8b949e",
                      fontSize: "12px",
                      fontWeight: 800
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>

                  <span
                    style={{
                      color: showCorrect || showWrong ? "#ffffff" : "#d1d5db",
                      fontSize: "14px",
                      fontWeight: 600
                    }}
                  >
                    {option}
                  </span>

                  <div className="ml-auto">
                    {showCorrect && (
                      <CheckCircle2
                        className="w-5 h-5"
                        style={{ color: "#22c55e" }}
                      />
                    )}
                    {showWrong && (
                      <XCircle
                        className="w-5 h-5"
                        style={{ color: "#ef4444" }}
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="p-5 rounded-2xl mb-6"
                style={{
                  background: "rgba(168,85,247,0.08)",
                  border: "1px solid rgba(168,85,247,0.2)"
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4" style={{ color: "#a855f7" }} />
                  <span
                    style={{
                      color: "#a855f7",
                      fontSize: "13px",
                      fontWeight: 800
                    }}
                  >
                    Explanation
                  </span>
                </div>
                <p
                  style={{
                    color: "#d1d5db",
                    fontSize: "13px",
                    lineHeight: 1.7
                  }}
                >
                  {challenge.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <button
              onClick={backToConcepts}
              className="px-4 py-2 rounded-xl flex items-center justify-center gap-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#8b949e",
                fontSize: "13px",
                fontWeight: 700
              }}
            >
              <BookOpen className="w-4 h-4" />
              Choose Concept
            </button>

            {showResult && (
              <motion.button
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={next}
                className="px-6 py-3 rounded-xl flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #ff6500, #ff9500)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 800,
                  boxShadow: "0 0 20px rgba(255,101,0,0.35)"
                }}
              >
                {currentQ >= challenges.length - 1 ? "See Result" : "Next Challenge"}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

