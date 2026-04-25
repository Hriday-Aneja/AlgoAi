import { AIProvider, AIConfig } from './aiProvider.interface';
import { OpenAIProvider } from './openai.provider';
import { GroqProvider } from './groq.provider';

export class AIProviderFactory {
  static createProvider(config: AIConfig): AIProvider {
    const provider = config.provider.toLowerCase().trim();

    switch (provider) {
      case 'openai':
        return new OpenAIProvider(config.apiKey, config.model);
      case 'groq':
        return new GroqProvider(config.apiKey, config.model);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}. Supported: 'openai', 'groq', 'gemini'.`);
    }
  }
}