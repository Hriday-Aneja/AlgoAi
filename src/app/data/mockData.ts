import problemsData from "./dsa-problems.json";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Domain = "DSA";
export type Status = "solved" | "attempted" | "unsolved" | "bookmarked";

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  domain: Domain;
  tags: string[];
  status: Status;
  acceptance: number;
  submissions: number;
  description: string;
  testCases?: { input: string; output: string }[];
  examples?: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  starterCode: string;
  solution?: string;
  timeComplexity: string;
  spaceComplexity: string;
  videoUrl?: string;
  likes: number;
  dislikes: number;
}

export interface Sheet {
  id: string;
  name: string;
  author: string;
  description: string;
  totalProblems: number;
  solved: number;
  topics: string[];
  color: string;
  problems: SheetProblem[];
}

export interface SheetProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  status: Status;
  leetcodeLink?: string;
  notes?: string;
}

export interface Note {
  id: string;
  problemId: string;
  problemTitle: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Playlist {
  id: string;
  title: string;
  channel: string;
  topic: string;
  videoCount: number;
  rating: number;
  url: string;
  isHidden: boolean;
  thumbnail: string;
  description: string;
}

export const problems: Problem[] = (problemsData as unknown as Problem[]).filter(p => p.domain === "DSA");

export const sheets: Sheet[] = [
  {
    id: "striver-sde",
    name: "Striver's SDE Sheet",
    author: "Raj Vikramaditya (Striver)",
    description: "Top 191 DSA problems covering all important interview topics. Used by lakhs of students for FAANG prep.",
    totalProblems: 191,
    solved: 47,
    color: "#f97316",
    topics: ["Arrays", "Linked List", "DP", "Trees", "Graphs", "Recursion", "Binary Search"],
    problems: [
      { id: "s1", title: "Set Matrix Zeroes", difficulty: "Medium", topic: "Arrays", status: "solved" },
      { id: "s2", title: "Pascal's Triangle", difficulty: "Easy", topic: "Arrays", status: "solved" },
      { id: "s3", title: "Next Permutation", difficulty: "Medium", topic: "Arrays", status: "attempted" },
      { id: "s4", title: "Kadane's Algorithm", difficulty: "Medium", topic: "Arrays", status: "solved" },
      { id: "s5", title: "Sort Colors", difficulty: "Medium", topic: "Arrays", status: "unsolved" },
      { id: "s6", title: "Stock Buy & Sell", difficulty: "Easy", topic: "Arrays", status: "solved" },
      { id: "s7", title: "Rotate Matrix", difficulty: "Medium", topic: "Arrays", status: "unsolved" },
      { id: "s8", title: "Merge Overlapping Subintervals", difficulty: "Medium", topic: "Arrays", status: "attempted" },
      { id: "s9", title: "Merge Two Sorted Arrays", difficulty: "Hard", topic: "Arrays", status: "unsolved" },
      { id: "s10", title: "Find Duplicate in Array", difficulty: "Medium", topic: "Arrays", status: "solved" },
      { id: "s11", title: "Reverse Linked List", difficulty: "Easy", topic: "Linked List", status: "solved" },
      { id: "s12", title: "Middle of Linked List", difficulty: "Easy", topic: "Linked List", status: "solved" },
      { id: "s13", title: "Merge Two Sorted Lists", difficulty: "Easy", topic: "Linked List", status: "attempted" },
      { id: "s14", title: "Remove Nth Node From End", difficulty: "Medium", topic: "Linked List", status: "unsolved" },
      { id: "s15", title: "Delete Given Node", difficulty: "Medium", topic: "Linked List", status: "solved" },
      { id: "s16", title: "Recursion - Fibonacci", difficulty: "Easy", topic: "Recursion", status: "solved" },
      { id: "s17", title: "Pow(x, n)", difficulty: "Medium", topic: "Recursion", status: "solved" },
      { id: "s18", title: "Subsets", difficulty: "Medium", topic: "Recursion", status: "attempted" },
      { id: "s19", title: "Binary Search", difficulty: "Easy", topic: "Binary Search", status: "solved" },
      { id: "s20", title: "Search in Rotated Array", difficulty: "Medium", topic: "Binary Search", status: "attempted" },
    ]
  },
  {
    id: "love-babbar-450",
    name: "Love Babbar's DSA 450",
    author: "Love Babbar",
    description: "450 handpicked DSA questions in a structured format. Perfect for systematic preparation.",
    totalProblems: 450,
    solved: 23,
    color: "#8b5cf6",
    topics: ["Arrays", "Strings", "Trees", "Graphs", "DP", "Backtracking", "Heaps"],
    problems: [
      { id: "l1", title: "Reverse Array", difficulty: "Easy", topic: "Arrays", status: "solved" },
      { id: "l2", title: "Find Min Max in Array", difficulty: "Easy", topic: "Arrays", status: "solved" },
      { id: "l3", title: "Kth Largest Element", difficulty: "Medium", topic: "Arrays", status: "attempted" },
      { id: "l4", title: "Sort 0s, 1s, 2s", difficulty: "Easy", topic: "Arrays", status: "solved" },
      { id: "l5", title: "Move Negative Numbers", difficulty: "Easy", topic: "Arrays", status: "unsolved" },
      { id: "l6", title: "Union and Intersection", difficulty: "Medium", topic: "Arrays", status: "unsolved" },
      { id: "l7", title: "Cyclically Rotate Array", difficulty: "Easy", topic: "Arrays", status: "solved" },
      { id: "l8", title: "Largest Sum Contiguous Subarray", difficulty: "Medium", topic: "Arrays", status: "solved" },
      { id: "l9", title: "Minimize Heights", difficulty: "Medium", topic: "Arrays", status: "attempted" },
      { id: "l10", title: "Reverse String", difficulty: "Easy", topic: "Strings", status: "solved" },
    ]
  },
  {
    id: "neetcode-150",
    name: "NeetCode 150",
    author: "NeetCode",
    description: "150 best LeetCode problems organized by pattern. Ideal for pattern-based learning.",
    totalProblems: 150,
    solved: 68,
    color: "#22c55e",
    topics: ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack", "Binary Search", "Linked List", "Trees"],
    problems: [
      { id: "n1", title: "Contains Duplicate", difficulty: "Easy", topic: "Arrays & Hashing", status: "solved" },
      { id: "n2", title: "Valid Anagram", difficulty: "Easy", topic: "Arrays & Hashing", status: "solved" },
      { id: "n3", title: "Two Sum", difficulty: "Easy", topic: "Arrays & Hashing", status: "solved" },
      { id: "n4", title: "Group Anagrams", difficulty: "Medium", topic: "Arrays & Hashing", status: "solved" },
      { id: "n5", title: "Top K Frequent Elements", difficulty: "Medium", topic: "Arrays & Hashing", status: "attempted" },
      { id: "n6", title: "Valid Palindrome", difficulty: "Easy", topic: "Two Pointers", status: "solved" },
      { id: "n7", title: "Best Time to Buy Stock", difficulty: "Easy", topic: "Sliding Window", status: "solved" },
      { id: "n8", title: "Longest Palindromic Substring", difficulty: "Medium", topic: "Sliding Window", status: "unsolved" },
    ]
  }
];

export const notes: Note[] = [
  {
    id: "note1",
    problemId: "1",
    problemTitle: "Two Sum",
    content: "## Key Insight\nUse HashMap for O(n) solution.\n\n**Approach:**\n- For each num, check if `target - num` exists in map\n- Store {num: index} in map\n\n```js\nconst map = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const comp = target - nums[i];\n  if (map.has(comp)) return [map.get(comp), i];\n  map.set(nums[i], i);\n}\n```\n\n**Remember:** Brute force is O(n²), HashMaps make it O(n)!",
    createdAt: "2026-04-01",
    updatedAt: "2026-04-05",
    tags: ["hash-table", "easy", "interview-favorite"]
  },
  {
    id: "note2",
    problemId: "5",
    problemTitle: "Maximum Subarray",
    content: "## Kadane's Algorithm\n\n**Core idea:** At each position, decide: extend previous subarray OR start new one.\n\n```\ncurr = max(nums[i], curr + nums[i])\nmax = max(max, curr)\n```\n\n**Key:** If `curr` becomes negative, starting fresh is better!\n\n**Edge case:** All negative? Return max single element.",
    createdAt: "2026-03-28",
    updatedAt: "2026-04-02",
    tags: ["dp", "kadane", "medium"]
  },
  {
    id: "note3",
    problemId: "4",
    problemTitle: "Valid Parentheses",
    content: "## Stack Based Approach\n\nPush opening brackets, for closing bracket - pop and check if it matches.\n\n**Map trick:**\n```js\nconst map = { ')': '(', '}': '{', ']': '[' };\n```\n\nIf char is a closing bracket (exists in map), pop from stack and compare.",
    createdAt: "2026-04-03",
    updatedAt: "2026-04-03",
    tags: ["stack", "easy"]
  }
];

export const playlists: Playlist[] = [
  {
    id: "p1",
    title: "Striver's A2Z DSA Course",
    channel: "take U forward",
    topic: "DSA Complete",
    videoCount: 455,
    rating: 4.9,
    url: "https://youtube.com",
    isHidden: false,
    thumbnail: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400",
    description: "Complete DSA course from scratch to advanced. Best resource for Indian students."
  },
  {
    id: "p2",
    title: "NeetCode 150 Solutions",
    channel: "NeetCode",
    topic: "LeetCode Patterns",
    videoCount: 150,
    rating: 4.8,
    url: "https://youtube.com",
    isHidden: false,
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400",
    description: "Clear explanations with visual animations for top 150 problems."
  },
  {
    id: "p3",
    title: "Graph Algorithms Deep Dive",
    channel: "William Fiset",
    topic: "Graphs",
    videoCount: 48,
    rating: 4.9,
    url: "https://youtube.com",
    isHidden: true,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
    description: "Hidden gem! Best graph algorithms explanations on YouTube. Very underrated channel."
  },
  {
    id: "p4",
    title: "Dynamic Programming Masterclass",
    channel: "Errichto",
    topic: "Dynamic Programming",
    videoCount: 32,
    rating: 4.7,
    url: "https://youtube.com",
    isHidden: true,
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400",
    description: "CP level DP explanations. Transform your DP skills completely."
  },
  {
    id: "p5",
    title: "System Design Interview",
    channel: "ByteByteGo",
    topic: "System Design",
    videoCount: 89,
    rating: 4.8,
    url: "https://youtube.com",
    isHidden: false,
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
    description: "Industry standard system design content by Alex Xu (author of System Design Interview book)."
  }
];

export const topicStrengths = [
  { topic: "Arrays", strength: 82, problems: 45, correct: 37 },
  { topic: "Linked List", strength: 68, problems: 22, correct: 15 },
  { topic: "Trees", strength: 45, problems: 30, correct: 14 },
  { topic: "Graphs", strength: 30, problems: 25, correct: 8 },
  { topic: "DP", strength: 38, problems: 40, correct: 15 },
  { topic: "Binary Search", strength: 75, problems: 18, correct: 14 },
  { topic: "Recursion", strength: 60, problems: 28, correct: 17 },
  { topic: "Backtracking", strength: 25, problems: 12, correct: 3 },
  { topic: "Greedy", strength: 55, problems: 15, correct: 8 },
  { topic: "Stack/Queue", strength: 88, problems: 20, correct: 18 },
  { topic: "Heap", strength: 42, problems: 14, correct: 6 },
  { topic: "Strings", strength: 70, problems: 30, correct: 21 },
];

export const roadmap = [
  { day: 1, topic: "Arrays - Basics", problems: ["Two Sum", "Find Duplicates", "Sort Colors"], completed: true, difficulty: "Easy" },
  { day: 2, topic: "Arrays - Medium", problems: ["3Sum", "Rotate Matrix", "Next Permutation"], completed: true, difficulty: "Medium" },
  { day: 3, topic: "Strings", problems: ["Valid Palindrome", "Longest Common Prefix", "Anagram Check"], completed: true, difficulty: "Easy" },
  { day: 4, topic: "Linked List - Basics", problems: ["Reverse LL", "Detect Cycle", "Middle of LL"], completed: true, difficulty: "Easy" },
  { day: 5, topic: "Linked List - Medium", problems: ["Merge k Sorted Lists", "Remove Nth Node", "LRU Cache"], completed: false, difficulty: "Medium" },
  { day: 6, topic: "Stack & Queue", problems: ["Valid Parentheses", "Min Stack", "Implement Queue using Stacks"], completed: false, difficulty: "Easy" },
  { day: 7, topic: "Binary Search", problems: ["Classic Binary Search", "Search Rotated Array", "Find Peak Element"], completed: false, difficulty: "Medium" },
  { day: 8, topic: "Recursion & Backtracking", problems: ["Subsets", "Permutations", "N-Queens"], completed: false, difficulty: "Hard" },
  { day: 9, topic: "Trees - Traversal", problems: ["Inorder", "Level Order", "Zigzag Traversal"], completed: false, difficulty: "Easy" },
  { day: 10, topic: "Trees - Medium", problems: ["LCA", "Max Depth", "Symmetric Tree"], completed: false, difficulty: "Medium" },
  { day: 11, topic: "BST", problems: ["Validate BST", "Kth Smallest", "Insert/Delete in BST"], completed: false, difficulty: "Medium" },
  { day: 12, topic: "Heaps & Priority Queue", problems: ["Kth Largest", "Merge K Lists", "Find Median Stream"], completed: false, difficulty: "Hard" },
  { day: 13, topic: "Graphs - BFS/DFS", problems: ["BFS Traversal", "Number of Islands", "Clone Graph"], completed: false, difficulty: "Medium" },
  { day: 14, topic: "Graphs - Advanced", problems: ["Topological Sort", "Dijkstra", "Detect Cycle"], completed: false, difficulty: "Hard" },
  { day: 15, topic: "Dynamic Programming - 1D", problems: ["Climbing Stairs", "House Robber", "Coin Change"], completed: false, difficulty: "Medium" },
];

export const dailyChallenge = {
  id: "daily-1",
  title: "Longest Palindromic Substring",
  difficulty: "Medium" as Difficulty,
  domain: "DSA" as Domain,
  tags: ["String", "DP", "Expand Around Center"],
  description: "Given a string s, return the longest palindromic substring in s.",
  examples: [
    { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' }
  ],
  constraints: ["1 <= s.length <= 1000", "s consist of only digits and English letters."],
  timeLimit: 1500, // 25 minutes in seconds
  streak: 7,
  totalSolved: 142
};

export const mockInterviewQuestions = [
  {
    id: "mi1",
    title: "Two Sum",
    difficulty: "Easy" as Difficulty,
    timeLimit: 600,
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }],
    constraints: ["O(n) time complexity required"],
    starterCode: `function twoSum(nums: number[], target: number): number[] {\n    // Your code here\n};`,
    followUp: ["What if duplicates exist?", "What if you had to return all pairs?", "How would you scale this to 1 billion numbers?"]
  },
  {
    id: "mi2",
    title: "Design LRU Cache",
    difficulty: "Medium" as Difficulty,
    timeLimit: 1800,
    description: "Design a data structure that follows LRU (Least Recently Used) cache constraints.",
    examples: [{ input: "LRUCache(2) → put(1,1) → put(2,2) → get(1) → put(3,3) → get(2)", output: "[1,-1]" }],
    constraints: ["All operations in O(1)", "Capacity given at initialization"],
    starterCode: `class LRUCache {\n    constructor(capacity: number) {}\n    get(key: number): number { return 0; }\n    put(key: number, value: number): void {}\n}`,
    followUp: ["How is this different from LFU Cache?", "Where is LRU Cache used in real systems?"]
  },
  {
    id: "mi3",
    title: "Word Break",
    difficulty: "Medium" as Difficulty,
    timeLimit: 1800,
    description: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into space-separated sequence of one or more dictionary words.",
    examples: [{ input: 's = "leetcode", wordDict = ["leet","code"]', output: "true" }],
    constraints: ["1 <= s.length <= 300"],
    starterCode: `function wordBreak(s: string, wordDict: string[]): boolean {\n    // DP approach\n};`,
    followUp: ["Return all valid segmentations?", "What's the time complexity?"]
  }
];

export const eli5Concepts: Record<string, { simple: string; analogy: string; example: string }> = {
  "recursion": {
    simple: "A function that calls itself to solve smaller versions of the same problem.",
    analogy: "Imagine you're in a room of mirrors - each mirror reflects all the other mirrors, getting smaller and smaller until you can barely see them.",
    example: "Finding factorial of 5: 5 × (factorial of 4) × (factorial of 3)... until you reach 1!"
  },
  "binary search": {
    simple: "Finding something in a sorted list by always checking the middle and eliminating half.",
    analogy: "Like guessing a number 1-100. If I say 'too low/high', you always pick the middle of remaining numbers. Much faster than guessing 1, 2, 3...",
    example: "Dictionary search! You open the middle, see it's past 'M', so you only look in the second half."
  },
  "dynamic programming": {
    simple: "Solving complex problems by breaking into subproblems and storing results so you don't recalculate.",
    analogy: "Imagine calculating your commute time. Instead of recalculating every day, you write it down. Next time, just look at your notes!",
    example: "Fibonacci: Instead of calculating fib(100) from scratch every time, store fib(1)=1, fib(2)=1, fib(3)=2... and build up."
  },
  "graph": {
    simple: "A collection of nodes (points) connected by edges (lines), representing relationships.",
    analogy: "Your friend circle! You are a node, your friends are nodes, and the friendships are edges connecting you all.",
    example: "Google Maps is a graph! Cities = nodes, Roads = edges, Distances = weights."
  },
  "linked list": {
    simple: "A chain of connected boxes where each box points to the next one, like a treasure hunt.",
    analogy: "Like a scavenger hunt where each clue tells you where to find the next clue. You can only go forward, not backward easily.",
    example: "A playlist! Each song points to the next song. When you finish one, it automatically goes to the next."
  },
  "stack": {
    simple: "A pile where you can only add or remove items from the top, like a stack of plates.",
    analogy: "Like stacking dinner plates. You put new plates on top, and when you need a plate, you take from the top.",
    example: "Browser back button! Each page you visit gets stacked, and back takes you to the previous page."
  },
  "queue": {
    simple: "A line where people join at the end and leave from the front, like waiting in line.",
    analogy: "Like standing in line at a store. First person in line gets served first. New people join the back.",
    example: "Printer queue! Documents wait in line to be printed. First document in gets printed first."
  },
  "hash table": {
    simple: "A magic box that can instantly find things using special labels, like a filing cabinet with perfect organization.",
    analogy: "Like a phone book where you instantly know which page someone's name is on, without searching through all pages.",
    example: "Dictionary app! Type a word, and it instantly shows the meaning. No searching needed!"
  },
  "binary tree": {
    simple: "A family tree where each person has at most 2 children, organized in a hierarchy.",
    analogy: "Like a family tree, but each person can have at most 2 kids. Perfect for organizing things in order.",
    example: "File system! Root folder has subfolders, each subfolder can have more subfolders, like a tree structure."
  },
  "sorting algorithms": {
    simple: "Ways to arrange things in order, like organizing toys from smallest to biggest.",
    analogy: "Like sorting your clothes by color. You can do it slowly (checking each item) or find smarter ways.",
    example: "Bubble sort: Like bubbles rising, swap neighbors if they're out of order. Quick sort: Pick a leader and organize around it."
  },
  "pointer": {
    simple: "An arrow that points to where something is stored in computer memory, like a treasure map X marks the spot.",
    analogy: "Like having someone's home address. You don't have the house, but you know exactly where to find it.",
    example: "In C programming: int *ptr = &number; means ptr points to where 'number' lives in memory."
  },
  "api": {
    simple: "A messenger that lets different computer programs talk to each other, like a waiter taking orders.",
    analogy: "Like ordering food at a restaurant. You tell the waiter what you want, they tell the kitchen, and bring back your food.",
    example: "Weather app! It asks a weather API 'What's the weather in New York?' and gets back the answer to show you."
  },
  "neural network": {
    simple: "A computer brain made of connected nodes that learn patterns, like how your brain recognizes faces.",
    analogy: "Like a group of friends passing secrets. Each friend changes the message a little before passing it along.",
    example: "Photo recognition! Show it thousands of cat photos, and it learns to recognize cats in new photos."
  },
  "array": {
    simple: "A numbered list of items stored next to each other in memory, like houses on a street with addresses.",
    analogy: "Like a street of houses numbered 1, 2, 3, 4... You can instantly go to house #5 without checking others.",
    example: "A shopping list! Item 0: milk, Item 1: bread, Item 2: eggs. You can ask for item[1] and get bread instantly."
  },
  "linkedlist": {
    simple: "A chain of connected boxes where each box points to the next one, like a treasure hunt.",
    analogy: "Like a scavenger hunt where each clue tells you where to find the next clue. You can only go forward, not backward easily.",
    example: "A playlist! Each song points to the next song. When you finish one, it automatically goes to the next."
  },
  "tree": {
    simple: "A hierarchical structure with a root and branches, like a family tree or folder structure.",
    analogy: "Like a family tree starting from grandparents, then parents, then children. Each level branches out.",
    example: "File explorer! Root drive C: has folders, each folder can have subfolders, creating a tree structure."
  },
  "heap": {
    simple: "A special tree where parents are always bigger/smaller than children, perfect for finding extremes.",
    analogy: "Like a tournament bracket where the best player always wins. The champion is always at the top.",
    example: "Priority queue! Emergency room - critical patients get treated first, like the 'largest' priority."
  },
  "trie": {
    simple: "A tree where each path represents a word, perfect for finding words that start with certain letters.",
    analogy: "Like a dictionary where you can follow letter paths to find words. 'C-A-T' leads to 'cat', 'car', etc.",
    example: "Auto-complete! Type 'app' and it suggests 'apple', 'application', 'appetizer' from the trie."
  },
  "graph traversal": {
    simple: "Ways to visit all connected points in a graph, like exploring all rooms in a house.",
    analogy: "Like exploring a maze. You can go depth-first (go deep into one path) or breadth-first (check all nearby first).",
    example: "Social network suggestions! BFS finds friends of friends. DFS finds if two people are connected."
  },
  "greedy algorithm": {
    simple: "Always make the best choice right now, hoping it leads to the best overall result.",
    analogy: "Like eating the biggest cookie first. It might not be perfect, but it feels right at the moment!",
    example: "Coin change! To make $0.37 with fewest coins, greedily take quarters, then dimes, etc."
  },
  "backtracking": {
    simple: "Try a path, if it doesn't work, go back and try another path, like solving a maze.",
    analogy: "Like trying different routes in a maze. Hit a dead end? Go back and try a different turn.",
    example: "Sudoku solver! Try a number, if it causes conflicts, backtrack and try a different number."
  },
  "sliding window": {
    simple: "A moving window of fixed size that slides over data, checking what's inside the window.",
    analogy: "Like looking through a telescope that only shows a small area. Move it around to see different parts.",
    example: "Maximum sum of any 3 consecutive numbers in an array. Slide a window of size 3 across the array."
  },
  "two pointers": {
    simple: "Two fingers moving through data from different directions or speeds to solve problems efficiently.",
    analogy: "Like two people searching a line from opposite ends, meeting in the middle.",
    example: "Finding two numbers that add to target: One pointer from start, one from end, move them towards each other."
  }
};

export const userStats = {
  name: "Arjun Sharma",
  avatar: "AS",
  level: "Intermediate",
  streak: 7,
  totalSolved: 87,
  easy: 45,
  medium: 35,
  hard: 7,
  rank: 12458,
  xp: 4250,
  nextLevelXp: 5000,
  joinDate: "January 2026",
  lastActive: "Today"
};

export const revisionProblems = [
  { id: "1", title: "Two Sum", difficulty: "Easy" as Difficulty, lastSolved: "7 days ago", dueForRevision: true, timesReviewed: 2 },
  { id: "4", title: "Valid Parentheses", difficulty: "Easy" as Difficulty, lastSolved: "14 days ago", dueForRevision: true, timesReviewed: 1 },
  { id: "5", title: "Maximum Subarray", difficulty: "Medium" as Difficulty, lastSolved: "5 days ago", dueForRevision: false, timesReviewed: 3 },
  { id: "12", title: "Binary Search", difficulty: "Easy" as Difficulty, lastSolved: "21 days ago", dueForRevision: true, timesReviewed: 1 },
  { id: "2", title: "Longest Substring", difficulty: "Medium" as Difficulty, lastSolved: "3 days ago", dueForRevision: false, timesReviewed: 2 },
  { id: "13", title: "Climbing Stairs", difficulty: "Easy" as Difficulty, lastSolved: "10 days ago", dueForRevision: true, timesReviewed: 2 },
];
