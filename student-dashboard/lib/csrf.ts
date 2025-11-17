import { NextRequest } from 'next/server';

/**
 * БАГ #50: CSRF защита через проверку Origin/Referer headers
 * Валидирует, что запрос пришел с того же домена
 */
export function validateCSRF(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Разрешаем запросы с того же origin
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }

  // Если нет origin, проверяем referer
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost === host;
    } catch {
      return false;
    }
  }

  // Если нет ни origin, ни referer - блокируем (подозрение на CSRF)
  return false;
}
