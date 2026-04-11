export interface AIProvider {
  generateFeedback(prompt: string): Promise<string>;
}

export interface AIConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
  model?: string;
}