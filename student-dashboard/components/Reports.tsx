'use client';

import { useState, useEffect } from 'react';
import { LessonReport, Schedule } from '@/types';
import { Storage } from '@/lib/storage';

export default function Reports() {
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    scheduleId: '',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    notes: '',
    attendance: true,
  });

  useEffect(() => {
    setReports(Storage.getReports());
    setSchedules(Storage.getSchedules());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: LessonReport = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    const updated = [...reports, newReport];
    setReports(updated);
    Storage.saveReports(updated);
    setIsAdding(false);
    setFormData({
      scheduleId: '',
      date: new Date().toISOString().split('T')[0],
      topic: '',
      notes: '',
      attendance: true,
    });
  };

  const handleDelete = (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    Storage.saveReports(updated);
  };

  const getScheduleInfo = (scheduleId: string) => {
    return schedules.find(s => s.id === scheduleId);
  };

  const sortedReports = [...reports].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
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
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg border border-border space-y-4">
          {schedules.length > 0 ? (
            <>
              <select
                value={formData.scheduleId}
                onChange={e => setFormData({ ...formData, scheduleId: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Выберите предмет</option>
                {schedules.map(schedule => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.subject} - {schedule.teacher}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="text"
                placeholder="Тема занятия"
                value={formData.topic}
                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <textarea
                placeholder="Заметки"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none"
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.attendance}
                  onChange={e => setFormData({ ...formData, attendance: e.target.checked })}
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
        {sortedReports.map(report => {
          const schedule = getScheduleInfo(report.scheduleId);
          return (
            <div
              key={report.id}
              className="bg-card border border-border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg">{report.topic}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {schedule?.subject || 'Неизвестный предмет'}
                    </p>
                    {schedule?.teacher && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">{schedule.teacher}</p>
                      </>
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
