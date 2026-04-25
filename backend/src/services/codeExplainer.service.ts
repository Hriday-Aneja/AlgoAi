import axios from 'axios';

interface LineExplanation {
  lineNumber: number;
  code: string;
  explanation: string;
}

interface CodeExplanationResponse {
  language: string;
  code: string;
  explanation: string; // Overall code explanation
  lineByLineExplanations: LineExplanation[];
  complexity?: {
    time: string;
    space: string;
  };
}

export const explainCodeLineByLine = async (
  code: string,
  language: string = 'javascript',
  apiKey: string,
  model: string = 'llama-3.1-8b-instant'
): Promise<CodeExplanationResponse> => {
  if (!apiKey) {
    throw new Error('Groq API key is not configured');
  }

  if (!code.trim()) {
    throw new Error('Code cannot be empty');
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

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert code explainer. Always respond with valid JSON format only. No markdown, no code blocks. Just pure JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const data = response.data;
    const responseText = data?.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response received from Groq API');
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
      throw new Error('Failed to parse code explanation response from AI');
    }

    // Validate and structure the response
    const lineByLineExplanations: LineExplanation[] = [];
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
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      console.error('Groq API error:', errorMessage);
      throw new Error(`Code explanation failed: ${errorMessage}`);
    }
    throw error;
  }
};
