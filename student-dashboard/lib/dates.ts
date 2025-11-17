/**
 * БАГ #25: Утилиты для правильной работы с датами и timezone
 * Все даты работают в UTC для консистентности
 */

/**
 * Получить текущую дату в формате YYYY-MM-DD (UTC)
 */
export function getTodayUTC(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Проверить, является ли дата просроченной (дедлайн прошел)
 * @param dateString - Дата в формате YYYY-MM-DD
 */
export function isOverdue(dateString: string): boolean {
  const dueDate = new Date(dateString + 'T00:00:00Z'); // UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return dueDate < today && dueDate.toISOString().split('T')[0] !== today.toISOString().split('T')[0];
}

/**
 * Форматировать дату для отображения на русском языке
 * @param dateString - Дата в формате YYYY-MM-DD или ISO string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Форматировать дату кратко (день и месяц)
 * @param dateString - Дата в формате YYYY-MM-DD или ISO string
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * Форматировать время для отображения
 * @param timestamp - ISO timestamp
 */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Проверить, что дата не в прошлом
 * @param dateString - Дата в формате YYYY-MM-DD
 */
export function isNotInPast(dateString: string): boolean {
  const date = new Date(dateString + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return date >= today;
}

/**
 * Проверить, что дата не более N дней/месяцев/лет в будущем/прошлом
 */
export function isWithinRange(
  dateString: string,
  maxDaysAgo?: number,
  maxDaysAhead?: number
): boolean {
  const date = new Date(dateString + 'T00:00:00Z');
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  if (maxDaysAgo !== undefined) {
    const minDate = new Date(now);
    minDate.setUTCDate(minDate.getUTCDate() - maxDaysAgo);
    if (date < minDate) return false;
  }

  if (maxDaysAhead !== undefined) {
    const maxDate = new Date(now);
    maxDate.setUTCDate(maxDate.getUTCDate() + maxDaysAhead);
    if (date > maxDate) return false;
  }

  return true;
}
