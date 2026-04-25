
// ─── Frontend Groq client (FIXED) ─────────────────────────

const API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";

if (!API_KEY) {
  console.error("❌ VITE_GROQ_API_KEY is not set in .env");
}

export const sendMessageToGroq = async (
  message: string,
  topicContext: string = "general"
): Promise<string> => {
  if (!API_KEY) {
    return "⚠️ Groq API key is not configured.";
  }

  if (!message || message.trim().length === 0) {
    return "⚠️ Please enter a message.";
  }

  const contextPrefix =
    topicContext !== "general"
      ? `[Context: ${topicContext}] `
      : "";

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions", // ✅ CORRECT URL
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // ✅ FREE + FAST MODEL
          messages: [
            {
              role: "system",
              content:
                "You are AlgoAI, an expert DSA tutor. Give structured short answers with examples, code, and complexity.The response should be short and well explanatory. Only give answers related to the CS field and related to study including hello hi and more.Make the answers consice and very short and only tell about messsages related to computer science and related study. If the message is not related to computer science or study then just say 'Sorry I can only answer messages related to computer science and study'. Allow hi hello and more related to it only.Give big answers when the users so say ",
            },
            {
              role: "user",
              content: contextPrefix + message.trim(),
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq error response:", errorText);
      return "⚠️ AlgoAI is temporarily unavailable.";
    }

    const data = await response.json();

    return (
      data?.choices?.[0]?.message?.content ||
      "⚠️ No response received."
    );
  } catch (error) {
    console.error("Groq error:", error);
    return "⚠️ AlgoAI is temporarily unavailable.";
  }
};

export const resetGroqChat = (): void => {
  // No session needed
};

// ─── Code Explanation (Line-by-Line) ──────────────────────────────────

interface CodeLineExplanation {
  lineNumber: number;
  code: string;
  explanation: string;
}

interface CodeExplanationResult {
  language: string;
  code: string;
  explanation: string;
  lineByLineExplanations: CodeLineExplanation[];
  complexity?: {
    time: string;
    space: string;
  };
  error?: string;
}

export const explainCodeLineByLine = async (
  code: string,
  language: string = 'javascript'
): Promise<CodeExplanationResult> => {
  if (!API_KEY) {
    return {
      language,
      code,
      explanation: 'Groq API key is not configured',
      lineByLineExplanations: [],
      error: 'API key missing'
    };
  }

  if (!code.trim()) {
    return {
      language,
      code,
      explanation: 'Code cannot be empty',
      lineByLineExplanations: [],
      error: 'Empty code'
    };
  }

  try {
    // Prepare the prompt to get detailed line-by-line explanations
    const prompt = `You are an expert ${language} code explainer. Please analyze the following code and provide:
1. A brief overall explanation of what this code does
2. A line-by-line explanation for EACH line of code (be very specific)
3. Time and space complexity if applicable

Code:
\`\`\`${language}
${code}
\`\`\`

Please respond STRICTLY in the following JSON format (no markdown, pure JSON):
{
  "overallExplanation": "A brief explanation of what the code does",
  "lineByLineExplanations": [
    {
      "lineNumber": 1,
      "code": "actual code from line 1",
      "explanation": "detailed explanation of what this line does"
    },
    {
      "lineNumber": 2,
      "code": "actual code from line 2",
      "explanation": "detailed explanation of what this line does"
    }
  ],
  "complexity": {
    "time": "O(n)",
    "space": "O(1)"
  }
}`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are an expert code explainer. Always respond with valid JSON format only. No markdown, no code blocks. Just pure JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq error response:", errorText);
      return {
        language,
        code,
        explanation: 'Failed to explain code',
        lineByLineExplanations: [],
        error: 'Groq API error'
      };
    }

    const data = await response.json();
    const responseText = data?.choices?.[0]?.message?.content;

    if (!responseText) {
      return {
        language,
        code,
        explanation: 'No response received from Groq',
        lineByLineExplanations: [],
        error: 'No response'
      };
    }

    // Parse the JSON response from Groq
    let parsedResponse;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Groq response:', responseText);
      return {
        language,
        code,
        explanation: 'Failed to parse AI response',
        lineByLineExplanations: [],
        error: 'Parse error'
      };
    }

    // Validate and structure the response
    const lineByLineExplanations: CodeLineExplanation[] = [];
    if (Array.isArray(parsedResponse.lineByLineExplanations)) {
      for (const line of parsedResponse.lineByLineExplanations) {
        if (typeof line.lineNumber === 'number' && typeof line.explanation === 'string') {
          lineByLineExplanations.push({
            lineNumber: line.lineNumber,
            code: line.code || '',
            explanation: line.explanation
          });
        }
      }
    }

    return {
      language,
      code,
      explanation: parsedResponse.overallExplanation || 'Unable to generate explanation',
      lineByLineExplanations,
      complexity: parsedResponse.complexity || { time: 'N/A', space: 'N/A' }
    };
  } catch (error) {
    console.error('Code explanation error:', error);
    return {
      language,
      code,
      explanation: 'Failed to connect to AI service',
      lineByLineExplanations: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};