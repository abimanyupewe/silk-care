type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitStoreResult = {
  count: number;
  resetAt: number;
};

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitStoreResult>;
}

const MAX_BUCKETS = 5000;

const luaScript = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return {current, ttl}
`;

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, Bucket>();

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      this.cleanup(now);

      return { count: 1, resetAt };
    }

    existing.count += 1;

    return {
      count: existing.count,
      resetAt: existing.resetAt
    };
  }

  private cleanup(now: number) {
    if (this.buckets.size <= MAX_BUCKETS) {
      return;
    }

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

export class UpstashRateLimitStore implements RateLimitStore {
  constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  async increment(key: string, windowMs: number) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['EVAL', luaScript, '1', key, String(windowMs)]),
      signal: AbortSignal.timeout(1500)
    });

    if (!response.ok) {
      throw new Error(`Upstash rate limit HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as {
      error?: string;
      result?: [number | string, number | string];
    };

    if (payload.error) {
      throw new Error(`Upstash rate limit error: ${payload.error}`);
    }

    const count = Number(payload.result?.[0]);
    const ttl = Number(payload.result?.[1]);

    if (!Number.isFinite(count)) {
      throw new Error('Respons rate limit Upstash tidak valid.');
    }

    return {
      count,
      resetAt: Date.now() + (Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs)
    };
  }
}

let store: RateLimitStore | undefined;

export function getRateLimitStore() {
  if (!store) {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

    store = url && token ? new UpstashRateLimitStore(url, token) : new MemoryRateLimitStore();
  }

  return store;
}
