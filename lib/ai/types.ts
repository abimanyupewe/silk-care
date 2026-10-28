export const aiRoles = ['user', 'assistant'] as const;

export type AiRole = (typeof aiRoles)[number];

export type AiMessage = {
  role: AiRole;
  content: string;
};

export type AiChatInput = {
  messages: AiMessage[];
  systemPrompt?: string;
};

export type AiChatResult = {
  message: AiMessage;
  model?: string;
};

export interface AiProvider {
  name: string;
  isConfigured(): boolean;
  chat(input: AiChatInput): Promise<AiChatResult>;
}

export class AiNotConfiguredError extends Error {
  constructor(message = 'Layanan AI belum dikonfigurasi.') {
    super(message);
    this.name = 'AiNotConfiguredError';
  }
}
