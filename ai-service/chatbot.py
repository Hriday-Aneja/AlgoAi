import os
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

router = APIRouter()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL_NAME = "llama-3.3-70b-versatile"
MAX_HISTORY_MESSAGES = 14  # keep prompt size sane


# ─── Models ──────────────────────────────────────────────────────────────────

class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ProblemExample(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None


class ProblemContext(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    constraints: Optional[List[str]] = None
    examples: Optional[List[ProblemExample]] = None
    language: Optional[str] = None
    code: Optional[str] = None
    review: Optional[str] = None  # last AI code-review output, if any


class TutorChatRequest(BaseModel):
    mode: Literal["general", "problem"] = "general"
    message: str
    history: List[ChatHistoryMessage] = []
    problem: Optional[ProblemContext] = None


class TutorChatResponse(BaseModel):
    reply: str


# ─── Prompt builders ────────────────────────────────────────────────────────

GENERAL_SYSTEM_PROMPT = """
You are AlgoAI Tutor, a friendly AI mentor inside AlgoAI, a DSA (Data Structures
& Algorithms) learning platform for students.

The student has NOT selected a specific problem right now. They may ask about:
- DSA concepts (arrays, trees, graphs, DP, etc.)
- General programming / CS questions
- Debugging a snippet they paste in
- Interview prep, complexity analysis, approach discussion

Rules:
- Be concise, warm, and conversational — like a helpful senior, not a textbook.
- Use simple language; explain any technical term you introduce.
- If the student pastes code, analyze the actual code, don't assume.
- If a question is clearly about a specific LeetCode-style problem the student
  hasn't described fully, ask them to paste the problem or select it from the
  catalogue instead of guessing.
- Use markdown code fences (```language) for any code you show.
- Never dump a huge wall of text — prefer short paragraphs and bullet points.
"""


def build_problem_system_prompt(problem: ProblemContext) -> str:
    constraints_text = (
        "\n".join(f"- {c}" for c in problem.constraints) if problem.constraints else "None provided."
    )

    if problem.examples:
        examples_text = "\n\n".join(
            f"Input: {ex.input}\nOutput: {ex.output}"
            + (f"\nExplanation: {ex.explanation}" if ex.explanation else "")
            for ex in problem.examples
        )
    else:
        examples_text = "None provided."

    code_block = (
        f"\n\nStudent's current code ({problem.language or 'unknown language'}):\n"
        f"```{problem.language or ''}\n{problem.code}\n```"
        if problem.code
        else "\n\nThe student hasn't written any code yet."
    )

    review_block = (
        f"\n\nMost recent AI code review for this code:\n{problem.review}"
        if problem.review
        else ""
    )

    return f"""
You are AlgoAI Tutor, a friendly AI mentor helping a student with ONE specific
DSA problem inside the AlgoAI platform.

Problem: {problem.title or "Untitled"} (Difficulty: {problem.difficulty or "unknown"})

Description:
{problem.description or "No description provided."}

Constraints:
{constraints_text}

Examples:
{examples_text}
{code_block}{review_block}

How to help:
- Explain the problem in your own words if asked.
- Explain relevant concepts (data structures, algorithms, patterns) simply.
- Give PROGRESSIVE hints. Never hand over the full solution unless the student
  explicitly says they've given up / asks for the complete solution directly.
  Start vague (nudge toward the right idea), then get more specific only if
  they ask again or are still stuck.
- If they paste an error or describe a bug, help them debug their actual code,
  don't just re-explain the problem.
- Discuss approaches and trade-offs (brute force vs optimal) when relevant.
- Explain time/space complexity when asked, tied to their actual code when
  code is available.
- Suggest concrete optimizations.
- Keep responses short and focused — a few sentences or a short list, not an essay.
- Use markdown code fences (```{problem.language or ''}) for any code snippets.
- Talk like a supportive senior student, not a formal textbook.
"""


def build_messages(req: TutorChatRequest) -> List[dict]:
    if req.mode == "problem" and req.problem:
        system_prompt = build_problem_system_prompt(req.problem)
    else:
        system_prompt = GENERAL_SYSTEM_PROMPT

    messages = [{"role": "system", "content": system_prompt}]

    for h in req.history[-MAX_HISTORY_MESSAGES:]:
        messages.append({"role": h.role, "content": h.content})

    messages.append({"role": "user", "content": req.message})
    return messages


# ─── Endpoint ───────────────────────────────────────────────────────────────

@router.post("/chat", response_model=TutorChatResponse)
def tutor_chat(req: TutorChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    messages = build_messages(req)

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.5,
        )
        reply = response.choices[0].message.content
        return TutorChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))