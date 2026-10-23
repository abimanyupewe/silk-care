import { z } from 'zod';
import { auth } from '@/auth';
import {
  getClientIp,
  handleRouteError,
  jsonError,
  jsonOk,
  jsonTooManyRequests,
  parseJson
} from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { AiNotConfiguredError, getAiProvider } from '@/lib/ai';
import { AI_SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { aiRoles } from '@/lib/ai/types';

const messageSchema = z.object({
  role: z.enum(aiRoles),
  content: z.string().trim().min(1).max(4000)
});

const chatSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(20)
  })
  .refine(
    (data) => data.messages.reduce((total, message) => total + message.content.length, 0) <= 20_000,
    {
      message: 'Total panjang pesan terlalu besar.'
    }
  );

export async function POST(request: Request) {
  try {
    const session = await auth();
    const identity = session?.user?.id ? `user:${session.user.id}` : `ip:${getClientIp(request)}`;
    const limit = session?.user?.id
      ? rateLimit(`ai:chat:${identity}`, 20, 10 * 60 * 1000)
      : rateLimit(`ai:chat:${identity}`, 5, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const parsed = await parseJson(request, chatSchema);

    if (parsed.error) {
      return parsed.error;
    }

    if (parsed.data.messages.at(-1)?.role !== 'user') {
      return jsonError('Pesan terakhir harus berasal dari pengguna.', 422);
    }

    const provider = getAiProvider();

    if (!provider.isConfigured()) {
      return jsonError('Layanan AI belum dikonfigurasi.', 503);
    }

    const result = await provider.chat({
      messages: parsed.data.messages,
      systemPrompt: AI_SYSTEM_PROMPT
    });

    return jsonOk(result);
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return jsonError('Layanan AI belum dikonfigurasi.', 503);
    }

    return handleRouteError(error);
  }
}
