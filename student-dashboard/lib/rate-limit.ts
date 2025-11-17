/**
 * БАГ #55: Simple in-memory rate limiter для AI API
 * Ограничивает количество запросов на пользователя
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Очистка старых записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Проверяет, можно ли выполнить запрос для данного пользователя
 * @param userId - ID пользователя
 * @param maxRequests - Максимум запросов в период (по умолчанию 10)
 * @param windowMs - Период в миллисекундах (по умолчанию 60 секунд)
 */
export function checkRateLimit(
  userId: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const key = `rate_limit:${userId}`;

  let entry = rateLimitStore.get(key);

  // Если записи нет или период истек, создаем новую
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }

  // Увеличиваем счетчик
  entry.count++;
  rateLimitStore.set(key, entry);

  // Проверяем лимит
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}
