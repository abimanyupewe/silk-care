import { jsonOk } from '@/lib/api';
import { getAiProvider } from '@/lib/ai';

export async function GET() {
  const provider = getAiProvider();

  return jsonOk({
    available: provider.isConfigured(),
    provider: provider.name
  });
}
