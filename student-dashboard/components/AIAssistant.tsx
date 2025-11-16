'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert([
          {
            student_id: user.id,
            role,
            content,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    // Сохраняем сообщение пользователя
    const userMessage = await saveMessage('user', userContent);
    if (userMessage) {
      setMessages([...messages, userMessage]);
    }

    try {
      // Формируем историю для API
      const conversationHistory = [...messages, userMessage].filter(Boolean).map((m) => ({
        role: m!.role,
        content: m!.content,
      }));

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при обращении к AI');
      }

      const data = await response.json();
      const assistantContent = data.choices[0].message.content;

      // Сохраняем ответ ассистента
      const assistantMessage = await saveMessage('assistant', assistantContent);
      if (assistantMessage) {
        setMessages([...messages, userMessage!, assistantMessage].filter(Boolean) as AIMessage[]);
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при обращении к AI');

      // Если ошибка, все равно сохраняем сообщение об ошибке
      const errorMessage = await saveMessage(
        'assistant',
        'Извините, произошла ошибка. Убедитесь, что в файле .env.local настроен PERPLEXITY_API_KEY.'
      );
      if (errorMessage) {
        setMessages([...messages, userMessage!, errorMessage].filter(Boolean) as AIMessage[]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('ai_messages').delete().eq('student_id', user.id);

      if (error) throw error;

      setMessages([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Загрузка чата...</div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-card border border-border rounded-lg">
      {error && (
        <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold">AI-Ассистент</h2>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Очистить историю
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Привет! Я твой AI-помощник 🤖</p>
            <p className="text-sm">
              Могу помочь с учебой, объяснить сложные темы или ответить на вопросы.
            </p>
            <p className="text-xs mt-4 text-muted-foreground">Работает на базе Perplexity AI</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">{formatTime(message.created_at)}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground rounded-lg p-3">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Задайте вопрос..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Отправить'}
          </button>
        </div>
      </form>
    </div>
  );
}
