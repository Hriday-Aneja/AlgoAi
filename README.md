
  


frontent page output:
<img width="1919" height="1080" alt="image" src="https://github.com/user-attachments/assets/9b953900-d809-4091-97b4-ab6714f1cb87" />

# 🚀 AlgoAI — AI Powered DSA Learning Platform

AlgoAI is an intelligent AI-powered learning platform designed to help students improve their **Data Structures & Algorithms (DSA)** skills through personalized learning, AI-generated recommendations, code execution, and performance analytics.

---

## 📸 Preview

(Add project screenshots here)

---

# ✨ Features

## 📊 User Progress Tracking

- Track solved and attempted problems
- Store difficulty level
- Record topics covered
- Monitor time taken to solve problems
- View overall learning progress

---

## 🎯 Weak Topic Detection

Automatically identifies weak areas based on:

- Accuracy
- Time taken
- Number of attempts
- Recent performance

---

## 🤖 AI-Powered Recommendations

- Personalized DSA problem recommendations
- Topic-wise improvement suggestions
- Learning roadmap generation
- AI feedback on progress

---

## ⚡ Online Code Execution

Execute code directly using JDoodle API.

Supported Languages:

- C++
- Java
- Python
- JavaScript
- C

---

## 📈 Performance Analytics

- Daily streaks
- Topic-wise analysis
- Difficulty distribution
- Progress charts
- AI-generated insights

---

# 🏗️ Tech Stack

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM

## Database

- PostgreSQL (Supabase)

## AI

- Groq API

## External APIs

- JDoodle API
- Groq API

---

# 📁 Project Structure

```
AlgoAi/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── strategies/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── prisma/
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── docs/
│
└── README.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/username/repo_name.git
cd project_name
```

---

# Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# Backend Setup

```bash
cd backend
npm install
```

Copy environment variables

```bash
cp .env.example .env
```

Run server

```bash
npm run dev
```

Backend runs on

```
http://localhost:3005
```

Health Check

```
http://localhost:3005/api/health
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend folder.

Required variables:

```env
NODE_ENV=development

PORT=3005

SUPABASE_URL=

SUPABASE_ANON_KEY=

DATABASE_URL=

JWT_SECRET=

AI_PROVIDER=groq

GROQ_API_KEY=

GROQ_MODEL=groq-1

JDOODLE_CLIENT_ID=

JDOODLE_CLIENT_SECRET=
```
### APIs & Tools
- JDoodle API (Code Execution)
- Groq API (Chat, Feedback, Roadmap Generation)

---

# 📡 API Overview

## Authentication

- Login
- Register
- JWT Authentication

---

## Problems

- Add Problem
- Update Progress
- Fetch Problems
- Recommendations

---

## Analytics

- Weak Topics
- Streak
- Progress
- Dashboard

---

## AI

- AI Chat
- AI Recommendations
- AI Roadmap

---

# 🧪 Running Tests

```bash
cd backend
npm test
```

---

# 🛠️ Build Backend

```bash
cd backend
npm run build
```

Run production server

```bash
npm start
```

---

# 🤝 Contributing

1. Fork Repository

2. Create Feature Branch

```bash
git checkout -b feature/new-feature
```

3. Commit Changes

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature/new-feature
```

5. Create Pull Request


---

# 👨‍💻 Team

AlgoAI Development Team

---

# 📄 License

This project is developed for educational purposes.