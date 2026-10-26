import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { jsonError } from '@/lib/api';
import { logError } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const spec = await readFile(join(process.cwd(), 'docs', 'openapi.yaml'), 'utf8');

    return new Response(spec, {
      headers: {
        'Content-Type': 'application/yaml; charset=utf-8',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error) {
    logError('openapi.read_failed', error);
    return jsonError('Spesifikasi OpenAPI tidak tersedia.', 500);
  }
}
