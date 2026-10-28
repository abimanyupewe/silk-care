import { unavailableAiProvider } from '@/lib/ai/providers/unavailable';
import type { AiProvider } from '@/lib/ai/types';

export function getAiProvider(): AiProvider {
  return unavailableAiProvider;
}

export { AiNotConfiguredError } from '@/lib/ai/types';
export type { AiChatInput, AiChatResult, AiMessage, AiProvider, AiRole } from '@/lib/ai/types';
