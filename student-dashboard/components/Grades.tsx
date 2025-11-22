'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface Grade {
  id: string;
  subject: string;
  value: number;
  max_value: number;
  date: string;
  type: 'homework' | 'test' | 'exam' | 'quiz' | 'project';
  description: string;
}

export default function Grades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    subject: '',
    value: 5,
    maxValue: 5,
    date: new Date().toISOString().split('T')[0],
    type: 'homework' as 'homework' | 'test' | 'exam' | 'quiz' | 'project',
    description: '',
  });

  useEffect(() => {
    if (user) {
      loadGrades();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('grades')
        .insert([
          {
            student_id: user.id,
            subject: formData.subject,
            value: formData.value,
            max_value: formData.maxValue,
            date: formData.date,
            type: formData.type,
            description: formData.description,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setGrades([data, ...grades]);
      setIsAdding(false);
      setFormData({
        subject: '',
        value: 5,
        maxValue: 5,
        date: new Date().toISOString().split('T')[0],
        type: 'homework',
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('grades').delete().eq('id', id);

      if (error) throw error;

      setGrades(grades.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      homework: 'ДЗ',
      test: 'Тест',
      exam: 'Экзамен',
      quiz: 'Контрольная',
      project: 'Проект',
    };
    return labels[type] || type;
  };

  const getGradeColor = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const calculateAverage = (subject?: string) => {
    const filteredGrades = subject ? grades.filter((g) => g.subject === subject) : grades;

    if (filteredGrades.length === 0) return 0;

    const sum = filteredGrades.reduce((acc, g) => acc + (g.value / g.max_value) * 100, 0);
    return (sum / filteredGrades.length).toFixed(1);
  };

  const subjects = Array.from(new Set(grades.map((g) => g.subject)));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Загрузка оценок...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Оценки</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {grades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Средний балл</div>
            <div className="text-3xl font-semibold">{calculateAverage()}%</div>
          </div>
          {subjects.slice(0, 3).map((subject) => (
            <div key={subject} className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">{subject}</div>
              <div className="text-3xl font-semibold">{calculateAverage(subject)}%</div>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-card p-6 rounded-lg border border-border space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Предмет"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'homework' | 'test' | 'exam' | 'quiz' | 'project' })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="homework">Домашнее задание</option>
              <option value="test">Тест</option>
              <option value="exam">Экзамен</option>
              <option value="quiz">Контрольная</option>
              <option value="project">Проект</option>
            </select>
            <input
              type="number"
              placeholder="Оценка"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              min="0"
              required
            />
            <input
              type="number"
              placeholder="Максимум"
              value={formData.maxValue}
              onChange={(e) => setFormData({ ...formData, maxValue: parseInt(e.target.value) })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              min="1"
              required
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <input
              type="text"
              placeholder="Описание"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Сохранить
          </button>
        </form>
      )}

      <div className="space-y-2">
        {grades.map((grade) => (
          <div
            key={grade.id}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
          >
            <div className={`text-3xl font-bold ${getGradeColor(grade.value, grade.max_value)}`}>
              {grade.value}/{grade.max_value}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{grade.subject}</h3>
                <span className="text-xs px-2 py-1 bg-secondary rounded">
                  {getTypeLabel(grade.type)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{grade.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(grade.date)}</p>
            </div>
            <button
              onClick={() => handleDelete(grade.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {grades.length === 0 && !isAdding && (
        <div className="text-center py-12 text-muted-foreground">
          Нет оценок. Добавьте первую оценку.
        </div>
      )}
    </div>
  );
}
