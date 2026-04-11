import { AIProvider, AIConfig } from './aiProvider.interface';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';

export class AIProviderFactory {
  static createProvider(config: AIConfig): AIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config.apiKey, config.model);
      case 'gemini':
        return new GeminiProvider(config.apiKey, config.model);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }
}