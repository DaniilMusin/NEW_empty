import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // БАГ #50: CSRF защита
    if (!validateCSRF(request)) {
      logger.security('CSRF validation failed', {
        operation: 'ai-request',
      });
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }

    // БАГ #1: Добавлена проверка авторизации
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      logger.warn('Unauthorized AI request attempt', {
        operation: 'ai-request',
      });
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // БАГ #55: Rate limiting - 10 запросов в минуту на пользователя
    const rateLimit = checkRateLimit(user.id, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);

      logger.warn('Rate limit exceeded for AI requests', {
        userId: user.id,
        operation: 'ai-request',
        metadata: { resetInSeconds },
      });

      return NextResponse.json(
        {
          error: `Слишком много запросов. Попробуйте через ${resetInSeconds} секунд.`,
          retryAfter: resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          }
        }
      );
    }

    // БАГ #18: Загружаем messages из БД, а не принимаем от клиента
    const { data: dbMessages, error: messagesError } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('student_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (messagesError) {
      logger.error('Failed to load AI messages from DB', messagesError, {
        userId: user.id,
        operation: 'ai-request',
      });
      return NextResponse.json(
        { error: 'Ошибка при загрузке истории сообщений' },
        { status: 500 }
      );
    }

    const messages = dbMessages || [];

    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      logger.error('PERPLEXITY_API_KEY not configured', undefined, {
        userId: user.id,
        operation: 'ai-request',
      });
      return NextResponse.json(
        { error: 'PERPLEXITY_API_KEY не настроен в переменных окружения' },
        { status: 500 }
      );
    }

    const aiStartTime = Date.now();
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Ты полезный AI-ассистент для ученика. Помогай с учебой, объясняй сложные темы простым языком, помогай с домашними заданиями и планированием обучения. Отвечай на русском языке.',
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    logger.performance('perplexity-api-call', Date.now() - aiStartTime, {
      userId: user.id,
      metadata: { status: response.status },
    });

    if (!response.ok) {
      logger.error('Perplexity API request failed', undefined, {
        userId: user.id,
        operation: 'ai-request',
        metadata: {
          status: response.status,
          statusText: response.statusText,
        },
      });
      return NextResponse.json(
        { error: 'Ошибка при обращении к Perplexity API' },
        { status: response.status }
      );
    }

    const data = await response.json();

    logger.info('AI request completed successfully', {
      userId: user.id,
      operation: 'ai-request',
      metadata: {
        messagesCount: messages.length,
        rateLimit: {
          remaining: rateLimit.remaining,
        },
      },
    });

    logger.performance('ai-request-total', Date.now() - startTime, {
      userId: user.id,
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Unexpected error in AI route', error, {
      operation: 'ai-request',
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
