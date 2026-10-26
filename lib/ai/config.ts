function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const aiConfig = {
  provider: process.env.AI_PROVIDER?.trim().toLowerCase() || 'unavailable',
  apiKey: process.env.OPENAI_API_KEY?.trim() || '',
  model: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini',
  timeoutMs: parsePositiveInt(process.env.AI_TIMEOUT_MS, 30_000)
};

export function isAiConfigured() {
  return aiConfig.provider !== 'unavailable' && Boolean(aiConfig.apiKey);
}
