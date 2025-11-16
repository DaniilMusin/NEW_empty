'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Student {
  id: string;
  username: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStudents(data);
    }
    setLoading(false);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
    setGeneratedPassword(password);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.full_name || !formData.password) {
      setError('Заполните все поля');
      return;
    }

    try {
      // Создаем пользователя через Admin API
      const response = await fetch('/api/admin/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          full_name: formData.full_name,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Ошибка при создании ученика');
        return;
      }

      setSuccess(`Ученик создан! Логин: ${formData.username}, Пароль: ${formData.password}`);
      setGeneratedPassword(formData.password);
      setFormData({ username: '', full_name: '', password: '' });
      loadStudents();
    } catch (err) {
      setError('Произошла ошибка при создании ученика');
    }
  };

  const handleDeleteStudent = async (id: string, username: string) => {
    if (!confirm(`Вы уверены, что хотите удалить ученика ${username}?`)) {
      return;
    }

    const response = await fetch('/api/admin/delete-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ student_id: id }),
    });

    if (response.ok) {
      loadStudents();
    } else {
      const result = await response.json();
      setError(result.error || 'Ошибка при удалении ученика');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Управление учениками</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Отмена' : '+ Добавить ученика'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
          <p>{success}</p>
          <p className="mt-2 text-sm">Обязательно сохраните эти данные! Пароль больше не будет доступен.</p>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleCreateStudent} className="bg-card p-6 rounded-lg border border-border space-y-4">
          <h3 className="text-lg font-medium">Создание нового ученика</h3>

          <div>
            <label className="block text-sm font-medium mb-2">
              Логин <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ivan_ivanov"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Только буквы, цифры и подчеркивание
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Полное имя <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Пароль <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите или сгенерируйте пароль"
                required
              />
              <button
                type="button"
                onClick={generatePassword}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Сгенерировать
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Создать ученика
          </button>
        </form>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Логин
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Полное имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Дата создания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {student.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.is_admin ? (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                        Админ
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                        Ученик
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(student.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!student.is_admin && (
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.username)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Нет учеников. Создайте первого ученика.
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Инструкции</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>1. Создайте ученика, указав логин и полное имя</p>
          <p>2. Сгенерируйте безопасный пароль или введите свой</p>
          <p>3. Сохраните логин и пароль - они понадобятся ученику для входа</p>
          <p>4. Отправьте ученику ссылку на сайт и данные для входа</p>
          <p className="mt-4 font-medium text-foreground">
            Ссылка для учеников: {typeof window !== 'undefined' ? window.location.origin : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
