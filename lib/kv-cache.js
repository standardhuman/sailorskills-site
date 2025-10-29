// lib/kv-cache.js
import { kv } from '@vercel/kv';

const CACHE_KEY = 'commit-story-v1';
const CACHE_TTL = 3600; // 1 hour in seconds

export async function getCachedStory() {
  try {
    return await kv.get(CACHE_KEY);
  } catch (error) {
    console.error('KV cache read error:', error);
    return null;
  }
}

export async function setCachedStory(data) {
  try {
    await kv.set(CACHE_KEY, data, { ex: CACHE_TTL });
    return true;
  } catch (error) {
    console.error('KV cache write error:', error);
    return false;
  }
}
