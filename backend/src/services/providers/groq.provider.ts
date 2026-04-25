import axios from 'axios';
import { AIProvider } from './aiProvider.interface';

export class GroqProvider implements AIProvider {
  constructor(private apiKey: string, private model: string = 'groq-1') {}

  async generateFeedback(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.groq.ai/v1/llm',
      {
        model: this.model,
        input: prompt,
        max_output_tokens: 1024,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      },
    );

    const data = response.data;
    const output = data?.output?.[0];

    let text = '';

    if (output?.content && Array.isArray(output.content)) {
      text = output.content
        .map((item: any) => item?.text || '')
        .join('')
        .trim();
    }

    if (!text && typeof output?.text === 'string') {
      text = output.text.trim();
    }

    if (!text && typeof data?.output === 'string') {
      text = data.output.trim();
    }

    if (!text && typeof data?.text === 'string') {
      text = data.text.trim();
    }

    if (!text) {
      throw new Error('No response from Groq');
    }

    return text;
  }
}
