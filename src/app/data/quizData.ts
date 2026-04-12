/**
 * CS Fundamentals Quiz Data
 * Structured quiz questions for different categories
 */

export type QuizCategory = "oops" | "os" | "web" | "ai-ml";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctAnswer: string; // option id
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: QuizCategory;
}

export interface QuizCategoryData {
  id: QuizCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalQuestions: number;
}

// ──────────────────────────────────────────────────────────────
// Quiz Categories
// ──────────────────────────────────────────────────────────────

export const quizCategories: QuizCategoryData[] = [
  {
    id: "oops",
    name: "Object-Oriented Programming",
    description: "Master OOP concepts like inheritance, polymorphism, and encapsulation",
    icon: "Box",
    color: "#00d4ff",
    totalQuestions: 10,
  },
  {
    id: "os",
    name: "Operating Systems",
    description: "Learn about processes, threads, memory management, and scheduling",
    icon: "Cpu",
    color: "#a855f7",
    totalQuestions: 10,
  },
  {
    id: "web",
    name: "Web Development",
    description: "Understand HTTP, DNS, browsers, and web architecture",
    icon: "Globe",
    color: "#22c55e",
    totalQuestions: 10,
  },
  {
    id: "ai-ml",
    name: "AI / Machine Learning",
    description: "Explore neural networks, algorithms, and ML concepts",
    icon: "Brain",
    color: "#f59e0b",
    totalQuestions: 10,
  },
];

// ──────────────────────────────────────────────────────────────
// OOPS Questions
// ──────────────────────────────────────────────────────────────

const oopsQuestions: QuizQuestion[] = [
  {
    id: "oops-1",
    category: "oops",
    difficulty: "Easy",
    question: "Which concept allows a class to inherit properties from another class?",
    options: [
      { id: "a", text: "Encapsulation" },
      { id: "b", text: "Inheritance" },
      { id: "c", text: "Polymorphism" },
      { id: "d", text: "Abstraction" },
    ],
    correctAnswer: "b",
    explanation:
      "Inheritance is the mechanism that allows a class (child/subclass) to inherit properties and methods from another class (parent/superclass). This promotes code reuse and establishes a hierarchical relationship between classes.",
  },
  {
    id: "oops-2",
    category: "oops",
    difficulty: "Easy",
    question: "Which keyword is used to create a class in most OOP languages?",
    options: [
      { id: "a", text: "function" },
      { id: "b", text: "class" },
      { id: "c", text: "object" },
      { id: "d", text: "new" },
    ],
    correctAnswer: "b",
    explanation:
      "The 'class' keyword is the standard way to define a class in most object-oriented programming languages like Java, Python, C++, and JavaScript (ES6+). It serves as a blueprint for creating objects.",
  },
  {
    id: "oops-3",
    category: "oops",
    difficulty: "Easy",
    question: "Which OOPS concept binds data and functions together?",
    options: [
      { id: "a", text: "Polymorphism" },
      { id: "b", text: "Abstraction" },
      { id: "c", text: "Encapsulation" },
      { id: "d", text: "Inheritance" },
    ],
    correctAnswer: "c",
    explanation:
      "Encapsulation is the bundling of data (variables) and functions (methods) that operate on that data into a single unit called a class. It wraps related functionality together and hides internal details from the outside world.",
  },
  {
    id: "oops-4",
    category: "oops",
    difficulty: "Medium",
    question: "What does polymorphism mean?",
    options: [
      { id: "a", text: "Hiding details" },
      { id: "b", text: "Multiple forms" },
      { id: "c", text: "Reusing code" },
      { id: "d", text: "Wrapping data" },
    ],
    correctAnswer: "b",
    explanation:
      "Polymorphism literally means 'many forms'. It allows objects to take multiple forms - through method overloading (compile-time polymorphism) or method overriding (runtime polymorphism). This enables writing flexible and reusable code.",
  },
  {
    id: "oops-5",
    category: "oops",
    difficulty: "Medium",
    question: "Which access modifier allows access only within the same class?",
    options: [
      { id: "a", text: "public" },
      { id: "b", text: "protected" },
      { id: "c", text: "private" },
      { id: "d", text: "default" },
    ],
    correctAnswer: "c",
    explanation:
      "The 'private' access modifier restricts access to members only within the same class. Data and methods marked as private cannot be accessed from outside the class or by subclasses, providing strong encapsulation.",
  },
  {
    id: "oops-6",
    category: "oops",
    difficulty: "Easy",
    question: "Which keyword is used to refer to the current object?",
    options: [
      { id: "a", text: "self / this" },
      { id: "b", text: "super" },
      { id: "c", text: "new" },
      { id: "d", text: "object" },
    ],
    correctAnswer: "a",
    explanation:
      "'this' (in Java, C++, JavaScript) and 'self' (in Python) refer to the current instance of the object. They are used to access instance variables and methods from within the class, and to distinguish instance variables from local variables.",
  },
  {
    id: "oops-7",
    category: "oops",
    difficulty: "Medium",
    question: "Abstract classes cannot be:",
    options: [
      { id: "a", text: "Inherited" },
      { id: "b", text: "Instantiated" },
      { id: "c", text: "Used in code" },
      { id: "d", text: "Extended" },
    ],
    correctAnswer: "b",
    explanation:
      "Abstract classes cannot be instantiated (you cannot create objects directly from them). They serve as templates for other classes to inherit from and implement their abstract methods. You can inherit from abstract classes and create instances of concrete subclasses.",
  },
  {
    id: "oops-8",
    category: "oops",
    difficulty: "Medium",
    question: "Method overloading means:",
    options: [
      { id: "a", text: "Same name, different parameters" },
      { id: "b", text: "Same name, same parameters" },
      { id: "c", text: "Different name, same parameters" },
      { id: "d", text: "Different return type only" },
    ],
    correctAnswer: "a",
    explanation:
      "Method overloading allows a class to have multiple methods with the same name but different parameters (different type, number, or order). The compiler determines which method to call based on the arguments provided at compile time.",
  },
  {
    id: "oops-9",
    category: "oops",
    difficulty: "Hard",
    question: "Which supports runtime polymorphism?",
    options: [
      { id: "a", text: "Method overloading" },
      { id: "b", text: "Method overriding" },
      { id: "c", text: "Constructor overloading" },
      { id: "d", text: "Static binding" },
    ],
    correctAnswer: "b",
    explanation:
      "Method overriding supports runtime (dynamic) polymorphism. When a subclass overrides a method from its superclass, the method to be called is determined at runtime based on the actual object type, not the reference type.",
  },
  {
    id: "oops-10",
    category: "oops",
    difficulty: "Medium",
    question: "Which principle hides implementation details?",
    options: [
      { id: "a", text: "Abstraction" },
      { id: "b", text: "Inheritance" },
      { id: "c", text: "Polymorphism" },
      { id: "d", text: "Encapsulation" },
    ],
    correctAnswer: "a",
    explanation:
      "Abstraction hides complex implementation details and shows only the essential features. It allows you to work with objects at a higher level without needing to understand their internal workings, simplifying code and reducing complexity.",
  },
];

// ──────────────────────────────────────────────────────────────
// Operating Systems Questions
// ──────────────────────────────────────────────────────────────

const osQuestions: QuizQuestion[] = [
  {
    id: "os-1",
    category: "os",
    difficulty: "Easy",
    question: "OS stands for:",
    options: [
      { id: "a", text: "Operating System" },
      { id: "b", text: "Open Software" },
      { id: "c", text: "Online Service" },
      { id: "d", text: "Output System" },
    ],
    correctAnswer: "a",
    explanation:
      "OS stands for Operating System. It is system software that manages hardware resources and provides common services for computer programs. Examples include Windows, Linux, macOS, and Android.",
  },
  {
    id: "os-2",
    category: "os",
    difficulty: "Easy",
    question: "Which is NOT an operating system?",
    options: [
      { id: "a", text: "Windows" },
      { id: "b", text: "Linux" },
      { id: "c", text: "Python" },
      { id: "d", text: "macOS" },
    ],
    correctAnswer: "c",
    explanation:
      "Python is a programming language, not an operating system. Windows, Linux, and macOS are all operating systems. Python runs on top of operating systems and is used to write applications and scripts.",
  },
  {
    id: "os-3",
    category: "os",
    difficulty: "Easy",
    question: "Which schedules CPU time among processes?",
    options: [
      { id: "a", text: "Compiler" },
      { id: "b", text: "Scheduler" },
      { id: "c", text: "Interpreter" },
      { id: "d", text: "Driver" },
    ],
    correctAnswer: "b",
    explanation:
      "The CPU Scheduler is responsible for allocating CPU time to various processes. It decides which process gets to run, for how long, and when to switch to another process. Different scheduling algorithms exist like FCFS, SJF, and Round Robin.",
  },
  {
    id: "os-4",
    category: "os",
    difficulty: "Easy",
    question: "RAM is:",
    options: [
      { id: "a", text: "Non-volatile" },
      { id: "b", text: "Volatile" },
      { id: "c", text: "Permanent" },
      { id: "d", text: "ROM" },
    ],
    correctAnswer: "b",
    explanation:
      "RAM (Random Access Memory) is volatile, meaning it loses all its data when power is turned off. This is unlike storage devices like hard drives or SSDs which are non-volatile and retain data permanently.",
  },
  {
    id: "os-5",
    category: "os",
    difficulty: "Medium",
    question: "Deadlock occurs when:",
    options: [
      { id: "a", text: "CPU is idle" },
      { id: "b", text: "Two processes wait forever" },
      { id: "c", text: "Memory is full" },
      { id: "d", text: "Disk fails" },
    ],
    correctAnswer: "b",
    explanation:
      "Deadlock occurs when two or more processes are blocked forever, waiting for each other to release resources. This situation can be prevented by careful resource allocation and can be detected and recovered from using various algorithms.",
  },
  {
    id: "os-6",
    category: "os",
    difficulty: "Medium",
    question: "Virtual memory uses:",
    options: [
      { id: "a", text: "CPU" },
      { id: "b", text: "Cache" },
      { id: "c", text: "Hard disk" },
      { id: "d", text: "GPU" },
    ],
    correctAnswer: "c",
    explanation:
      "Virtual memory extends physical RAM by using hard disk space. When physical RAM is full, less-used data is moved to the hard disk. This allows programs larger than physical RAM to run, though it's slower than actual RAM.",
  },
  {
    id: "os-7",
    category: "os",
    difficulty: "Medium",
    question: "Context switching happens between:",
    options: [
      { id: "a", text: "Programs" },
      { id: "b", text: "Processes/Threads" },
      { id: "c", text: "Files" },
      { id: "d", text: "Users" },
    ],
    correctAnswer: "b",
    explanation:
      "Context switching is when the CPU stops executing one process/thread and starts executing another. The context (state) of the current process is saved, and the context of the next process is loaded. This enables multitasking.",
  },
  {
    id: "os-8",
    category: "os",
    difficulty: "Medium",
    question: "Which is NOT a scheduling algorithm?",
    options: [
      { id: "a", text: "FIFO" },
      { id: "b", text: "SJF" },
      { id: "c", text: "Round Robin" },
      { id: "d", text: "HTTP" },
    ],
    correctAnswer: "d",
    explanation:
      "HTTP is a network protocol, not a scheduling algorithm. FIFO (First In First Out), SJF (Shortest Job First), and Round Robin are all CPU scheduling algorithms used by the OS to allocate CPU time to processes.",
  },
  {
    id: "os-9",
    category: "os",
    difficulty: "Medium",
    question: "Mutex is used for:",
    options: [
      { id: "a", text: "Compilation" },
      { id: "b", text: "Memory allocation" },
      { id: "c", text: "Mutual exclusion" },
      { id: "d", text: "Storage" },
    ],
    correctAnswer: "c",
    explanation:
      "Mutex (Mutual Exclusion) is a synchronization mechanism used to protect shared resources from being accessed by multiple threads simultaneously. Only one thread can hold a mutex at a time, ensuring data consistency.",
  },
  {
    id: "os-10",
    category: "os",
    difficulty: "Hard",
    question: "Thrashing occurs due to:",
    options: [
      { id: "a", text: "Low CPU" },
      { id: "b", text: "Excessive paging" },
      { id: "c", text: "Low disk" },
      { id: "d", text: "High network" },
    ],
    correctAnswer: "b",
    explanation:
      "Thrashing occurs when the system spends more time paging (moving data between RAM and disk) than actually executing programs. This happens when there's heavy use of virtual memory, causing severe performance degradation.",
  },
];

// ──────────────────────────────────────────────────────────────
// Web Development Questions
// ──────────────────────────────────────────────────────────────

const webQuestions: QuizQuestion[] = [
  {
    id: "web-1",
    category: "web",
    difficulty: "Easy",
    question: "HTML is used for:",
    options: [
      { id: "a", text: "Styling" },
      { id: "b", text: "Logic" },
      { id: "c", text: "Structure" },
      { id: "d", text: "Database" },
    ],
    correctAnswer: "c",
    explanation:
      "HTML (HyperText Markup Language) is used to create the structure and content of web pages. It defines elements like headings, paragraphs, links, forms, etc. HTML provides the semantic meaning of content.",
  },
  {
    id: "web-2",
    category: "web",
    difficulty: "Easy",
    question: "CSS is used for:",
    options: [
      { id: "a", text: "Styling" },
      { id: "b", text: "Logic" },
      { id: "c", text: "Database" },
      { id: "d", text: "Server" },
    ],
    correctAnswer: "a",
    explanation:
      "CSS (Cascading Style Sheets) is used to style and layout web pages - colors, fonts, spacing, positioning, animations, and responsive design. It separates presentation from content.",
  },
  {
    id: "web-3",
    category: "web",
    difficulty: "Easy",
    question: "JavaScript runs on:",
    options: [
      { id: "a", text: "Server only" },
      { id: "b", text: "Browser only" },
      { id: "c", text: "Both" },
      { id: "d", text: "None" },
    ],
    correctAnswer: "c",
    explanation:
      "JavaScript can run both on the client-side (in browsers) and server-side (using Node.js). On the client, it adds interactivity to web pages. On the server, it can handle business logic and database operations.",
  },
  {
    id: "web-4",
    category: "web",
    difficulty: "Easy",
    question: "Which is a frontend framework?",
    options: [
      { id: "a", text: "React" },
      { id: "b", text: "Node.js" },
      { id: "c", text: "Express" },
      { id: "d", text: "MongoDB" },
    ],
    correctAnswer: "a",
    explanation:
      "React is a JavaScript library/framework for building user interfaces. Node.js is a runtime, Express is a backend framework, and MongoDB is a database. React is specifically used for frontend development.",
  },
  {
    id: "web-5",
    category: "web",
    difficulty: "Medium",
    question: "HTTP status 404 means:",
    options: [
      { id: "a", text: "Success" },
      { id: "b", text: "Not Found" },
      { id: "c", text: "Server Error" },
      { id: "d", text: "Redirect" },
    ],
    correctAnswer: "b",
    explanation:
      "HTTP 404 is the 'Not Found' status code. It indicates that the requested resource does not exist on the server. Other common codes include 200 (OK), 500 (Server Error), and 301 (Redirect).",
  },
  {
    id: "web-6",
    category: "web",
    difficulty: "Easy",
    question: "Which is used to make APIs?",
    options: [
      { id: "a", text: "HTML" },
      { id: "b", text: "CSS" },
      { id: "c", text: "Express" },
      { id: "d", text: "Photoshop" },
    ],
    correctAnswer: "c",
    explanation:
      "Express is a popular Node.js backend framework used to build REST APIs and web servers. HTML for structure, CSS for styling, and Photoshop for design are not used for making APIs.",
  },
  {
    id: "web-7",
    category: "web",
    difficulty: "Medium",
    question: "REST uses which format mostly?",
    options: [
      { id: "a", text: "XML" },
      { id: "b", text: "JSON" },
      { id: "c", text: "HTML" },
      { id: "d", text: "CSV" },
    ],
    correctAnswer: "b",
    explanation:
      "REST APIs predominantly use JSON (JavaScript Object Notation) for data exchange. It's lightweight, human-readable, and easy to parse. While XML was popular earlier, JSON has become the standard for modern APIs.",
  },
  {
    id: "web-8",
    category: "web",
    difficulty: "Easy",
    question: "Which method sends data to server?",
    options: [
      { id: "a", text: "GET" },
      { id: "b", text: "POST" },
      { id: "c", text: "DELETE" },
      { id: "d", text: "HEAD" },
    ],
    correctAnswer: "b",
    explanation:
      "POST is the HTTP method used to send data to the server. GET retrieves data, DELETE removes resources, and HEAD is similar to GET but without the response body. POST is used for creating new resources or submitting forms.",
  },
  {
    id: "web-9",
    category: "web",
    difficulty: "Medium",
    question: "LocalStorage stores data in:",
    options: [
      { id: "a", text: "Server" },
      { id: "b", text: "Browser" },
      { id: "c", text: "RAM" },
      { id: "d", text: "OS" },
    ],
    correctAnswer: "b",
    explanation:
      "LocalStorage stores data in the browser (client-side) as key-value pairs. Data persists even after the browser is closed. It's useful for storing user preferences, tokens, and other local data.",
  },
  {
    id: "web-10",
    category: "web",
    difficulty: "Easy",
    question: "Which is NOT a database?",
    options: [
      { id: "a", text: "MongoDB" },
      { id: "b", text: "MySQL" },
      { id: "c", text: "Firebase" },
      { id: "d", text: "React" },
    ],
    correctAnswer: "d",
    explanation:
      "React is a JavaScript library for building user interfaces, not a database. MongoDB is a NoSQL database, MySQL is a relational database, and Firebase is a backend-as-a-service platform with database capabilities.",
  },
];

// ──────────────────────────────────────────────────────────────
// AI / ML Questions
// ──────────────────────────────────────────────────────────────

const aimlQuestions: QuizQuestion[] = [
  {
    id: "ai-ml-1",
    category: "ai-ml",
    difficulty: "Easy",
    question: "AI stands for:",
    options: [
      { id: "a", text: "Artificial Intelligence" },
      { id: "b", text: "Automated Input" },
      { id: "c", text: "Applied Interface" },
      { id: "d", text: "Algorithmic Internet" },
    ],
    correctAnswer: "a",
    explanation:
      "AI stands for Artificial Intelligence. It refers to the simulation of human intelligence by machines, enabling them to learn, reason, and perform tasks that typically require human intelligence.",
  },
  {
    id: "ai-ml-2",
    category: "ai-ml",
    difficulty: "Easy",
    question: "ML stands for:",
    options: [
      { id: "a", text: "Machine Learning" },
      { id: "b", text: "Manual Logic" },
      { id: "c", text: "Machine Language" },
      { id: "d", text: "Memory Logic" },
    ],
    correctAnswer: "a",
    explanation:
      "ML stands for Machine Learning. It is a subset of AI that focuses on developing algorithms that can learn from data and make predictions or decisions without being explicitly programmed for each task.",
  },
  {
    id: "ai-ml-3",
    category: "ai-ml",
    difficulty: "Easy",
    question: "Supervised learning uses:",
    options: [
      { id: "a", text: "No labels" },
      { id: "b", text: "Labels" },
      { id: "c", text: "Random data" },
      { id: "d", text: "Only images" },
    ],
    correctAnswer: "b",
    explanation:
      "Supervised learning uses labeled data to train models. Each training example has an input and the correct output (label). This enables the model to learn the mapping between inputs and outputs. Examples include classification and regression tasks.",
  },
  {
    id: "ai-ml-4",
    category: "ai-ml",
    difficulty: "Medium",
    question: "Unsupervised learning is used for:",
    options: [
      { id: "a", text: "Classification" },
      { id: "b", text: "Regression" },
      { id: "c", text: "Clustering" },
      { id: "d", text: "Encryption" },
    ],
    correctAnswer: "c",
    explanation:
      "Unsupervised learning is used to find patterns in unlabeled data. Clustering is a common unsupervised technique that groups similar data points together. Other unsupervised methods include dimensionality reduction and anomaly detection.",
  },
  {
    id: "ai-ml-5",
    category: "ai-ml",
    difficulty: "Medium",
    question: "Which is a regression algorithm?",
    options: [
      { id: "a", text: "KNN" },
      { id: "b", text: "Linear Regression" },
      { id: "c", text: "K-means" },
      { id: "d", text: "PCA" },
    ],
    correctAnswer: "b",
    explanation:
      "Linear Regression is a supervised learning algorithm used for regression tasks (predicting continuous values). KNN is a classification algorithm, K-means is a clustering algorithm, and PCA is a dimensionality reduction technique.",
  },
  {
    id: "ai-ml-6",
    category: "ai-ml",
    difficulty: "Medium",
    question: "Neural networks are inspired by:",
    options: [
      { id: "a", text: "Human brain" },
      { id: "b", text: "CPU" },
      { id: "c", text: "RAM" },
      { id: "d", text: "Hard disk" },
    ],
    correctAnswer: "a",
    explanation:
      "Neural networks are inspired by the structure and function of biological neurons in the human brain. They consist of interconnected nodes (artificial neurons) that process information and learn patterns from data.",
  },
  {
    id: "ai-ml-7",
    category: "ai-ml",
    difficulty: "Medium",
    question: "Overfitting means:",
    options: [
      { id: "a", text: "Model too simple" },
      { id: "b", text: "Model too complex" },
      { id: "c", text: "Less data" },
      { id: "d", text: "No training" },
    ],
    correctAnswer: "b",
    explanation:
      "Overfitting occurs when a model learns the training data too well, including noise and specific patterns that don't generalize to new data. This results in high training accuracy but poor performance on unseen data. Techniques like regularization help prevent overfitting.",
  },
  {
    id: "ai-ml-8",
    category: "ai-ml",
    difficulty: "Easy",
    question: "Training data is used to:",
    options: [
      { id: "a", text: "Test model" },
      { id: "b", text: "Train model" },
      { id: "c", text: "Deploy model" },
      { id: "d", text: "None" },
    ],
    correctAnswer: "b",
    explanation:
      "Training data is used to train the model, allowing it to learn patterns and relationships in the data. Test data is used separately to evaluate model performance. Validation data can be used during training to tune hyperparameters.",
  },
  {
    id: "ai-ml-9",
    category: "ai-ml",
    difficulty: "Hard",
    question: "Which is used for NLP?",
    options: [
      { id: "a", text: "CNN" },
      { id: "b", text: "RNN" },
      { id: "c", text: "KNN" },
      { id: "d", text: "SVM" },
    ],
    correctAnswer: "b",
    explanation:
      "RNN (Recurrent Neural Networks) are commonly used for NLP (Natural Language Processing) tasks because they can process sequential data like sentences. They maintain state/memory across time steps, making them suitable for language understanding and generation.",
  },
  {
    id: "ai-ml-10",
    category: "ai-ml",
    difficulty: "Easy",
    question: "Which is NOT an AI application?",
    options: [
      { id: "a", text: "Chatbots" },
      { id: "b", text: "Image recognition" },
      { id: "c", text: "Sorting algorithm" },
      { id: "d", text: "Recommendation systems" },
    ],
    correctAnswer: "c",
    explanation:
      "A sorting algorithm is a fundamental computer science algorithm, not an AI application. Chatbots use NLP, image recognition uses computer vision, and recommendation systems use machine learning. These are common AI/ML applications.",
  },
];

// ──────────────────────────────────────────────────────────────
// All Questions Combined
// ──────────────────────────────────────────────────────────────

export const allQuestions: QuizQuestion[] = [
  ...oopsQuestions,
  ...osQuestions,
  ...webQuestions,
  ...aimlQuestions,
];

/**
 * Get questions for a specific category
 */
export function getQuestionsByCategory(category: QuizCategory): QuizQuestion[] {
  return allQuestions.filter((q) => q.category === category);
}

/**
 * Get category data by ID
 */
export function getCategoryById(id: QuizCategory): QuizCategoryData | undefined {
  return quizCategories.find((c) => c.id === id);
}
