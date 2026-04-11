import OpenAI from 'openai';
import { AIProvider } from './aiProvider.interface';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string, private model: string = 'gpt-3.5-turbo') {
    this.client = new OpenAI({ apiKey });
  }

  async generateFeedback(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  }
}