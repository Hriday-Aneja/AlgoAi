import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from chatbot import router as chatbot_router
load_dotenv()

app = FastAPI(title="AlgoAI AI Service")
app.include_router(chatbot_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://algo-ai-iota.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

class CodeReviewRequest(BaseModel):
    problem_title: str
    problem_description: str
    language: str
    code: str


@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/code-review")
def code_review(req: CodeReviewRequest):

    prompt = f"""
You are the code review engine of AlgoAI, a DSA learning platform.

Problem:
{req.problem_title}

Problem Description:
{req.problem_description}

Language:
{req.language}

Student Code:
{req.code}

Review the ACTUAL code carefully.

Return ONLY these 5 sections:

**Approach:** Briefly explain what the code is doing. (1-2 lines)

**Complexity:** Time and space complexity with a short reason.

**Bug:** Mention only actual bugs. If there are none, say "No major bugs found."

**Edge Case:** Mention only 1-2 meaningful edge cases relevant to this algorithm.
Do not mention cases already ruled out by the problem constraints.

**Improve:** Give the most useful optimization or improvement in 1-2 lines.

IMPORTANT:
- Do not invent bugs.
- Check the actual implementation, not the expected solution.
- If there is a bug, clearly mention the problematic line and why.
- Do not discuss edge cases as correct if the core logic is broken.
- Do not rewrite the complete solution.
- Keep the entire response under 180 words.
- Be concise, practical, and student-friendly.
"""
    try:

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert DSA tutor and code reviewer."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )

        return {
            "review": response.choices[0].message.content
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# --- Progressive Hint Request Model ---
class HintRequest(BaseModel):
    problem_title: str
    problem_description: str
    language: str
    code: str
    hint_level: int


# --- Progressive Hint Endpoint ---
@app.post("/hint")
def get_hint(req: HintRequest):

    # Only 3 hint levels are allowed
    if req.hint_level not in [1, 2, 3]:
        raise HTTPException(
            status_code=400,
            detail="hint_level must be 1, 2, or 3"
        )

    # Instructions for each hint level
    hint_instructions = {
    1: """
Give ONE short conceptual nudge.
Maximum 2 sentences.
Do NOT name the exact algorithm or data structure.
Do NOT provide code or pseudocode.
""",

    2: """
Give a more specific hint about the approach.
You may name the relevant algorithm or data structure.
Maximum 3 sentences.
Do NOT provide code or pseudocode.
""",

    3: """
Give concise step-by-step pseudocode-level guidance.
Maximum 5 short steps.
Do NOT provide executable code or the complete solution.
"""
}

    prompt = f"""
You are helping a student solve a DSA problem.

Problem Title:
{req.problem_title}

Problem Description:
{req.problem_description}

Programming Language:
{req.language}

Student's Current Code:
{req.code}

The student has requested Hint Level {req.hint_level}.

Instructions:
{hint_instructions[req.hint_level]}

IMPORTANT RULES:
- Help the student discover the solution themselves.
- Never provide the complete solution code.
- First analyze the student's current code before giving a hint.
- Use very simple, conversational language.
- Talk like a friendly coding mentor helping a college student.
- Avoid formal or textbook-style wording.
- Avoid complicated technical words unless necessary.
- If you use a technical term, explain it simply.
- Keep sentences short.
- Do not repeat the problem statement.
- Keep the response concise.
- Follow the requested hint level strictly.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are AlgoAI, a friendly coding mentor for college students. "
    "Explain things in simple, natural English like a helpful senior. "
    "Keep responses short and easy to understand. "
    "Guide the student toward the answer without giving the full solution."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.5
        )

        return {
            "level": req.hint_level,
            "hint": response.choices[0].message.content
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )