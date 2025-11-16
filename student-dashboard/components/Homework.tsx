'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export default function Homework() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    if (user) {
      loadHomework();
    }
  }, [user]);

  const loadHomework = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('homework')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setHomework(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('homework')
        .insert([
          {
            student_id: user.id,
            subject: formData.subject,
            title: formData.title,
            description: formData.description,
            due_date: formData.dueDate,
            completed: false,
            priority: formData.priority,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setHomework([...homework, data]);
      setIsAdding(false);
      setFormData({
        subject: '',
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggle = async (id: string, currentCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('homework')
        .update({ completed: !currentCompleted })
        .eq('id', id);

      if (error) throw error;

      setHomework(
        homework.map((hw) => (hw.id === id ? { ...hw, completed: !currentCompleted } : hw))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('homework').delete().eq('id', id);

      if (error) throw error;

      setHomework(homework.filter((hw) => hw.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sortedHomework = [...homework].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isOverdue = (dateStr: string) => {
    return (
      new Date(dateStr) < new Date() &&
      new Date(dateStr).toDateString() !== new Date().toDateString()
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Загрузка домашних заданий...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Домашние задания</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-card p-6 rounded-lg border border-border space-y-4"
        >
          <input
            type="text"
            placeholder="Предмет"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="text"
            placeholder="Название задания"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <textarea
            placeholder="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as 'low' | 'medium' | 'high',
                })
              }
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Низкий приоритет</option>
              <option value="medium">Средний приоритет</option>
              <option value="high">Высокий приоритет</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Сохранить
          </button>
        </form>
      )}

      <div className="space-y-3">
        {sortedHomework.map((hw) => (
          <div
            key={hw.id}
            className={`bg-card border border-border rounded-lg p-4 transition-opacity ${
              hw.completed ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={hw.completed}
                onChange={() => handleToggle(hw.id, hw.completed)}
                className="mt-1 w-5 h-5 cursor-pointer accent-primary"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className={`font-medium ${hw.completed ? 'line-through' : ''}`}>
                      {hw.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{hw.subject}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(hw.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{hw.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      isOverdue(hw.due_date) && !hw.completed
                        ? 'bg-red-500 text-white'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {formatDate(hw.due_date)}
                    {isOverdue(hw.due_date) && !hw.completed && ' (Просрочено)'}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${getPriorityColor(hw.priority)}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {homework.length === 0 && !isAdding && (
        <div className="text-center py-12 text-muted-foreground">
          Нет домашних заданий. Добавьте первое задание.
        </div>
      )}
    </div>
  );
}
