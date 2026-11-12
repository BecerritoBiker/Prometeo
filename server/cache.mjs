import { createClient } from 'redis';

const statsKey = 'prometeo:stats:v1';
const ttlSeconds = 8;

export function openStatsCache(url = process.env.CACHE_URL) {
  const client = url && createClient({
    url,
    disableOfflineQueue: true,
    socket: { connectTimeout: 1500 },
  });
  if (client) {
    let warned = false;
    client.on('error', () => {
      if (!warned) console.warn('Caché indisponible; se consultará PostgreSQL');
      warned = true;
    });
    client.on('ready', () => { warned = false; });
    void client.connect().catch(() => {});
  }

  async function execute(command) {
    if (!client?.isReady) return null;
    try {
      return await command(client.withCommandOptions({ abortSignal: AbortSignal.timeout(300) }));
    } catch {
      return null;
    }
  }

  return {
    async read() {
      const stored = await execute((cache) => cache.get(statsKey));
      if (!stored) return null;
      try { return JSON.parse(stored); } catch { return null; }
    },
    async write(stats) {
      await execute((cache) => cache.set(statsKey, JSON.stringify(stats), { expiration: { type: 'EX', value: ttlSeconds } }));
    },
    async invalidate() {
      await execute((cache) => cache.del(statsKey));
    },
    status() {
      return !client ? 'disabled' : client.isReady ? 'ready' : 'degraded';
    },
    close() {
      if (client?.isOpen) client.destroy();
    },
  };
}
