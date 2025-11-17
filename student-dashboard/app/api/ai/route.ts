import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // БАГ #50: CSRF защита
    if (!validateCSRF(request)) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }

    // БАГ #1: Добавлена проверка авторизации
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // БАГ #55: Rate limiting - 10 запросов в минуту на пользователя
    const rateLimit = checkRateLimit(user.id, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
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
      .limit(50); // Последние 50 сообщений для контекста

    if (messagesError) {
      console.error('Error loading messages:', messagesError);
      return NextResponse.json(
        { error: 'Ошибка при загрузке истории сообщений' },
        { status: 500 }
      );
    }

    const messages = dbMessages || [];

    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PERPLEXITY_API_KEY не настроен в переменных окружения' },
        { status: 500 }
      );
    }

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

    if (!response.ok) {
      // БАГ #26: Не логируем весь error объект - может содержать sensitive данные
      console.error('Perplexity API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Ошибка при обращении к Perplexity API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // БАГ #26: Логируем только сообщение, не весь объект
    console.error('Error in AI route:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
