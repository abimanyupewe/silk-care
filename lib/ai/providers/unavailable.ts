import { AiNotConfiguredError, type AiProvider } from '@/lib/ai/types';

export const unavailableAiProvider: AiProvider = {
  name: 'unavailable',
  isConfigured: () => false,
  async chat() {
    throw new AiNotConfiguredError();
  }
};
