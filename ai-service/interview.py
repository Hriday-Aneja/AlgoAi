import json
import os
import re
import traceback
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

router = APIRouter(prefix="/interview")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL_NAME = "openai/gpt-oss-120b"
MAX_HISTORY_MESSAGES = 20


# ─── Models ──────────────────────────────────────────────────────────────────

Personality = Literal["strict", "friendly", "pressure"]


class InterviewerInfo(BaseModel):
    name: str
    personality: Personality


class ProblemExample(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None


class ProblemContext(BaseModel):
    title: str
    description: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    constraints: Optional[List[str]] = None
    examples: Optional[List[ProblemExample]] = None
    expectedComplexity: Optional[str] = None


class ConversationMessage(BaseModel):
    role: Literal["interviewer", "candidate"]
    content: str


class StartInterviewRequest(BaseModel):
    interviewer: InterviewerInfo
    problem: ProblemContext
    language: str
    maxQuestions: int = 7


class StartInterviewResponse(BaseModel):
    message: str
    questionNumber: int
    maxQuestions: int


class InterviewMessageRequest(BaseModel):
    interviewer: InterviewerInfo
    problem: ProblemContext
    conversation: List[ConversationMessage]
    userMessage: str
    userCode: Optional[str] = None
    questionNumber: int
    maxQuestions: int


class Evaluation(BaseModel):
    correct: bool
    correctnessScore: int
    clarityScore: int
    technicalScore: int
    issues: List[str] = []


class InterviewMessageResponse(BaseModel):
    evaluation: Evaluation
    response: str
    nextQuestion: Optional[str] = None
    shouldContinue: bool
    questionNumber: int
    endedForConduct: bool = False


class FeedbackRequest(BaseModel):
    interviewer: InterviewerInfo
    problem: ProblemContext
    conversation: List[ConversationMessage]
    correctnessScore: int
    clarityScore: int
    speedScore: int
    communicationScore: int
    technicalScore: int
    overallScore: int


class FeedbackResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    feedback: str


# ─── Personality profiles ───────────────────────────────────────────────────

PERSONALITY_PROFILES: dict[Personality, str] = {
    "strict": """
You are Akash Das, a Strict technical interviewer.
Tone: direct, professional, precise. You do not tolerate vague answers and you
call out mistakes immediately. You expect optimal solutions and push the
candidate to justify their complexity claims exactly.
Style examples (do not copy verbatim, write fresh lines in this voice):
"Be precise." / "That's not optimal." / "Explain your reasoning."
/ "I need the exact complexity."
You are firm but fair — never insulting, never sarcastic. Short, exact sentences.
""",
    "friendly": """
You are Anshu Kumar, a Friendly technical interviewer.
Tone: encouraging, conversational, patient. You help the candidate think out
loud and give constructive feedback, but you still evaluate correctness
honestly — you don't let mistakes slide, you just correct them warmly.
Style examples (do not copy verbatim, write fresh lines in this voice):
"Good start. Now let's dig a little deeper." / "You're on the right track,
but can you explain why?" / "Nice. Let's try a follow-up."
Warm, human, never condescending.
""",
    "pressure": """
You are Hriday Aneja, a High Pressure technical interviewer.
Tone: fast-paced, challenging, terse. Short, direct questions. You frequently
follow up and push the candidate to justify every decision quickly. You create
real interview pressure without being abusive.
Style examples (do not copy verbatim, write fresh lines in this voice):
"Okay. Now optimize it." / "You have limited time. What's the complexity?"
/ "That's not enough. Explain why."
Clipped sentences. No small talk.
""",
}


# ─── Prompt builders ─────────────────────────────────────────────────────────

def format_problem_block(problem: ProblemContext) -> str:
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

    return f"""
Problem: {problem.title} (Topic: {problem.topic or "unknown"}, Difficulty: {problem.difficulty or "unknown"})

Description:
{problem.description}

Constraints:
{constraints_text}

Examples:
{examples_text}

Expected complexity: {problem.expectedComplexity or "optimal for this problem"}
"""


def format_conversation(conversation: List[ConversationMessage]) -> str:
    trimmed = conversation[-MAX_HISTORY_MESSAGES:]
    lines = []
    for msg in trimmed:
        speaker = "Interviewer" if msg.role == "interviewer" else "Candidate"
        lines.append(f"{speaker}: {msg.content}")
    return "\n".join(lines) if lines else "(no messages yet)"


def extract_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    raise ValueError("Could not parse JSON from model response")


def call_groq_json(system_prompt: str, user_prompt: str, temperature: float = 0.6) -> dict:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    return extract_json(content)


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/start", response_model=StartInterviewResponse)
def start_interview(req: StartInterviewRequest):
    personality_profile = PERSONALITY_PROFILES[req.interviewer.personality]

    system_prompt = f"""
{personality_profile}

You are conducting a technical coding interview inside AlgoAI, a DSA learning
platform. The candidate will solve a specific problem in {req.language}.

{format_problem_block(req.problem)}

Your job right now: open the interview. Introduce the problem briefly in your
own words, in your personality's voice, and set an expectation (e.g. optimal
complexity, or "explain your approach first") consistent with your style.
Do not give away the solution or approach.

Respond ONLY with a JSON object of this exact shape, nothing else:
{{"message": "<your opening interviewer line>"}}
"""

    try:
        data = call_groq_json(
            system_prompt,
            "Generate the opening interview message now.",
            temperature=0.7,
        )
        message = data.get("message")
        if not message or not isinstance(message, str):
            raise ValueError("Missing message field")
    except Exception:
        print("[interview.py] /interview/start Groq call failed:")
        traceback.print_exc()
        message = (
            f"Let's begin. Implement {req.problem.title}. "
            f"I expect a solution matching {req.problem.expectedComplexity or 'the optimal complexity'}."
        )

    return StartInterviewResponse(
        message=message,
        questionNumber=1,
        maxQuestions=req.maxQuestions,
    )


@router.post("/message", response_model=InterviewMessageResponse)
def interview_message(req: InterviewMessageRequest):
    personality_profile = PERSONALITY_PROFILES[req.interviewer.personality]
    at_limit = req.questionNumber >= req.maxQuestions

    code_block = (
        f"\n\nCandidate's submitted code:\n```\n{req.userCode}\n```"
        if req.userCode
        else ""
    )

    system_prompt = f"""
{personality_profile}

You are mid-interview inside AlgoAI, a DSA learning platform.

{format_problem_block(req.problem)}

Conversation so far:
{format_conversation(req.conversation)}

This is question {req.questionNumber} of {req.maxQuestions}.

The candidate just responded:
{req.userMessage}{code_block}

Evaluate their response honestly:
- If they submitted code, judge correctness, edge cases, time/space complexity,
  and whether it matches the requested optimality.
- If they gave an explanation, judge whether it's technically accurate and clear.
- If they were wrong, explain what is wrong and give the correct reasoning,
  in your personality's voice, before moving on.
- If the candidate's message is abusive, harassing, sexual, hateful, or
  otherwise not a good-faith interview response (e.g. random insults, no
  attempt to engage with the problem), set "endedForConduct" to true and
  write a short, professional, non-insulting closing line ending the
  interview immediately for this reason, in your personality's voice.
  This is independent of question count — it can happen on any turn.
- Otherwise (normal engagement, right or wrong): set "endedForConduct" to
  false.
- If {at_limit}, this MUST be the final turn: do not ask a new question,
  wrap up instead.
- Otherwise, ask ONE adaptive follow-up question that makes sense given what
  they just said (probe their reasoning, an edge case, complexity, or an
  alternative approach). Keep the interview feeling like a real conversation,
  not a fixed script.

Respond ONLY with a JSON object of this exact shape, nothing else:
{{
  "evaluation": {{
    "correct": true or false,
    "correctnessScore": 0-100,
    "clarityScore": 0-100,
    "technicalScore": 0-100,
    "issues": ["short strings describing any problems found, empty array if none"]
  }},
  "response": "<your in-character reaction/correction to what they said>",
  "nextQuestion": "<your next question, or null if the interview should end now>",
  "shouldContinue": true or false,
  "endedForConduct": true or false
}}
"""

    fallback_continue = not at_limit

    try:
        data = call_groq_json(
            system_prompt,
            "Evaluate the candidate's response and generate the next step now.",
            temperature=0.6,
        )
        evaluation_raw = data.get("evaluation") or {}
        evaluation = Evaluation(
            correct=bool(evaluation_raw.get("correct", False)),
            correctnessScore=int(evaluation_raw.get("correctnessScore", 50)),
            clarityScore=int(evaluation_raw.get("clarityScore", 50)),
            technicalScore=int(evaluation_raw.get("technicalScore", 50)),
            issues=list(evaluation_raw.get("issues", [])),
        )
        response_text = data.get("response")
        if not response_text or not isinstance(response_text, str):
            raise ValueError("Missing response field")

        ended_for_conduct = bool(data.get("endedForConduct", False))

        # Pacing is server-owned (see comment below) EXCEPT for conduct-based
        # termination, which is a distinct signal from "we've covered enough
        # questions" and must be able to end the interview on any turn,
        # regardless of question count.
        if ended_for_conduct:
            should_continue = False
        else:
            # The server owns pacing, not the model: keep going until
            # maxQuestions is actually reached, regardless of what the model
            # set shouldContinue to. Otherwise a model that returns
            # shouldContinue: false too early (common — models tend to wrap
            # up after one exchange unless forced not to) ends the interview
            # after a single response.
            should_continue = not at_limit
        next_question = data.get("nextQuestion") if should_continue else None
    except Exception:
        print("[interview.py] /interview/message Groq call failed:")
        traceback.print_exc()
        evaluation = Evaluation(
            correct=False,
            correctnessScore=50,
            clarityScore=50,
            technicalScore=50,
            issues=["Automated evaluation unavailable for this turn."],
        )
        response_text = "Understood. Let's continue." if not at_limit else "That wraps up our interview."
        should_continue = fallback_continue
        next_question = "Can you elaborate further on your approach?" if should_continue else None
        ended_for_conduct = False

    return InterviewMessageResponse(
        evaluation=evaluation,
        response=response_text,
        nextQuestion=next_question,
        shouldContinue=should_continue,
        questionNumber=req.questionNumber + (1 if should_continue else 0),
        endedForConduct=ended_for_conduct,
    )


@router.post("/feedback", response_model=FeedbackResponse)
def interview_feedback(req: FeedbackRequest):
    personality_profile = PERSONALITY_PROFILES[req.interviewer.personality]

    system_prompt = f"""
{personality_profile}

The technical interview has just ended.

{format_problem_block(req.problem)}

Full conversation:
{format_conversation(req.conversation)}

Final measured scores:
Correctness: {req.correctnessScore}/100
Clarity: {req.clarityScore}/100
Speed: {req.speedScore}/100
Communication: {req.communicationScore}/100
Technical Understanding: {req.technicalScore}/100
Overall: {req.overallScore}/100

Write your final feedback for this candidate, in your personality's voice,
based on what ACTUALLY happened in the conversation above (not generic
statements). Be specific about what they did well and what they should
improve.

Respond ONLY with a JSON object of this exact shape, nothing else:
{{
  "strengths": ["2-4 short specific strengths based on the conversation"],
  "weaknesses": ["1-3 short specific areas to improve based on the conversation"],
  "feedback": "<a short paragraph, 2-4 sentences, in your personality's voice>"
}}
"""

    try:
        data = call_groq_json(
            system_prompt,
            "Generate the final interview feedback now.",
            temperature=0.6,
        )
        strengths = list(data.get("strengths", []))
        weaknesses = list(data.get("weaknesses", []))
        feedback = data.get("feedback")
        if not strengths or not feedback:
            raise ValueError("Incomplete feedback response")
    except Exception:
        print("[interview.py] /interview/feedback Groq call failed:")
        traceback.print_exc()
        strengths = ["Completed the interview and engaged with follow-up questions."]
        weaknesses = ["Automated feedback generation was unavailable for this session."]
        feedback = (
            f"You scored {req.overallScore}/100 overall. "
            "Review the conversation above to see where you can improve."
        )

    return FeedbackResponse(
        strengths=strengths,
        weaknesses=weaknesses,
        feedback=feedback,
    )