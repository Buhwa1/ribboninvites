// Key-value storage. Uses Upstash Redis (Vercel Marketplace) in production,
// and a local JSON file during development.
import fs from 'node:fs';
import path from 'node:path';

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...args) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  const j = await r.json();
  if (j.error) throw new Error('Storage error: ' + j.error);
  return j.result;
}

const FILE = path.join(process.cwd(), '.data', 'db.json');
let mem = null;
function load() {
  if (process.env.VERCEL) throw new Error('Storage is not configured. Add an Upstash Redis database to this Vercel project.');
  if (!mem) { try { mem = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { mem = {}; } }
  return mem;
}
function save() { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(mem)); }

const local = {
  get: async k => load()[k] ?? null,
  set: async (k, v) => { load()[k] = v; save(); },
  hget: async (k, f) => load()[k]?.[f] ?? null,
  hset: async (k, f, v) => { const m = load(); (m[k] ||= {})[f] = v; save(); },
  hgetall: async k => ({ ...(load()[k] || {}) }),
  hdel: async (k, f) => { const m = load(); if (m[k]) delete m[k][f]; save(); },
  sadd: async (k, v) => { const m = load(); const s = new Set(m[k] || []); s.add(v); m[k] = [...s]; save(); },
  smembers: async k => [...(load()[k] || [])]
};

const remote = {
  get: k => redis('GET', k),
  set: (k, v) => redis('SET', k, v),
  hget: (k, f) => redis('HGET', k, f),
  hset: (k, f, v) => redis('HSET', k, f, v),
  hgetall: async k => { const a = (await redis('HGETALL', k)) || []; const o = {}; for (let i = 0; i < a.length; i += 2) o[a[i]] = a[i + 1]; return o; },
  hdel: (k, f) => redis('HDEL', k, f),
  sadd: (k, v) => redis('SADD', k, v),
  smembers: k => redis('SMEMBERS', k)
};

export const kv = REDIS_URL ? remote : local;
export const storageMode = REDIS_URL ? 'redis' : 'local';
