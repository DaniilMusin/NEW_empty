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
  const [showPassword, setShowPassword] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<{ username: string; password: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  // БАГ #10: Криптографически безопасная генерация пароля
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    const array = new Uint32Array(12);
    crypto.getRandomValues(array);
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(array[i] % chars.length);
    }
    setFormData({ ...formData, password });
    setGeneratedPassword(password);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreatedStudent(null);

    if (!formData.username || !formData.full_name || !formData.password) {
      setError('Заполните все поля');
      return;
    }

    // БАГ #8: Валидация username
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Логин может содержать только латинские буквы, цифры и подчеркивание');
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 30) {
      setError('Логин должен быть от 3 до 30 символов');
      return;
    }

    if (formData.password.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
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

      // БАГ #7: Не показываем пароль в обычном тексте, сохраняем в отдельном состоянии
      setCreatedStudent({ username: formData.username, password: formData.password });
      setSuccess('Ученик успешно создан!');
      setFormData({ username: '', full_name: '', password: '' });
      setIsAdding(false);
      loadStudents();
    } catch (err) {
      setError('Произошла ошибка при создании ученика');
    }
  };

  // БАГ #12, #14: Добавлены loading state и обработка concurrent deletion
  const handleDeleteStudent = async (id: string, username: string) => {
    if (!confirm(`Вы уверены, что хотите удалить ученика ${username}?`)) {
      return;
    }

    setDeletingId(id);
    setError('');

    try {
      const response = await fetch('/api/admin/delete-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_id: id }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Ученик ${username} успешно удален`);
        loadStudents();
      } else if (response.status === 404) {
        // БАГ #12: Обработка concurrent deletion
        setError(`Ученик ${username} уже был удален другим администратором`);
        loadStudents(); // Обновляем список
      } else {
        setError(result.error || 'Ошибка при удалении ученика');
      }
    } catch (err) {
      setError('Произошла ошибка при удалении ученика');
    } finally {
      setDeletingId(null);
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
          {success}
        </div>
      )}

      {/* БАГ #7: Модальное окно для показа учетных данных нового ученика */}
      {createdStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCreatedStudent(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Ученик успешно создан!</h3>
            <div className="space-y-3 bg-secondary p-4 rounded-lg mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Логин:</div>
                <div className="font-mono font-semibold text-lg">{createdStudent.username}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Пароль:</div>
                <div className="font-mono font-semibold text-lg">{createdStudent.password}</div>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 dark:text-yellow-400 px-3 py-2 rounded text-sm mb-4">
              ⚠️ Сохраните эти данные! Пароль больше не будет доступен.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Логин: ${createdStudent.username}\nПароль: ${createdStudent.password}`);
                }}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                📋 Копировать
              </button>
              <button
                onClick={() => setCreatedStudent(null)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Закрыть
              </button>
            </div>
          </div>
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
              <div className="flex-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Минимум 8 символов"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
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
                        disabled={deletingId === student.id}
                        className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === student.id ? 'Удаление...' : 'Удалить'}
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
