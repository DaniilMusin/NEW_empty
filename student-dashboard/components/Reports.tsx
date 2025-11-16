'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface Report {
  id: string;
  schedule_id: string | null;
  date: string;
  topic: string;
  notes: string;
  attendance: boolean;
  created_at: string;
}

interface Schedule {
  id: string;
  subject: string;
  teacher: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    scheduleId: '',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    notes: '',
    attendance: true,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Загружаем расписания
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('id, subject, teacher');

      if (schedulesError) throw schedulesError;
      setSchedules(schedulesData || []);

      // Загружаем отчеты
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('date', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);
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
        .from('reports')
        .insert([
          {
            student_id: user.id,
            schedule_id: formData.scheduleId || null,
            date: formData.date,
            topic: formData.topic,
            notes: formData.notes,
            attendance: formData.attendance,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setReports([data, ...reports]);
      setIsAdding(false);
      setFormData({
        scheduleId: '',
        date: new Date().toISOString().split('T')[0],
        topic: '',
        notes: '',
        attendance: true,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id);

      if (error) throw error;

      setReports(reports.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getScheduleInfo = (scheduleId: string | null) => {
    if (!scheduleId) return null;
    return schedules.find((s) => s.id === scheduleId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Загрузка отчетов...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Отчеты по занятиям</h2>
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
          {schedules.length > 0 ? (
            <>
              <select
                value={formData.scheduleId}
                onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Выберите предмет (необязательно)</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.subject} - {schedule.teacher}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="text"
                placeholder="Тема занятия"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <textarea
                placeholder="Заметки"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none"
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.attendance}
                  onChange={(e) => setFormData({ ...formData, attendance: e.target.checked })}
                  className="w-5 h-5 accent-primary"
                />
                <span>Присутствовал на занятии</span>
              </label>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Сохранить
              </button>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Сначала добавьте расписание в разделе &quot;Расписание&quot;
            </div>
          )}
        </form>
      )}

      <div className="space-y-3">
        {reports.map((report) => {
          const schedule = getScheduleInfo(report.schedule_id);
          return (
            <div key={report.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg">{report.topic}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {schedule ? (
                      <>
                        <p className="text-sm text-muted-foreground">{schedule.subject}</p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">{schedule.teacher}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Общий отчет</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(report.date)}</span>
                <span>•</span>
                <span className={report.attendance ? 'text-green-600' : 'text-red-600'}>
                  {report.attendance ? 'Присутствовал' : 'Отсутствовал'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {reports.length === 0 && !isAdding && (
        <div className="text-center py-12 text-muted-foreground">
          Нет отчетов. Добавьте первый отчет.
        </div>
      )}
    </div>
  );
}
