'use client';

import { useState, useEffect } from 'react';
import { Schedule as ScheduleType } from '@/types';
import { Storage } from '@/lib/storage';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export default function Schedule() {
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    classroom: '',
  });

  useEffect(() => {
    setSchedules(Storage.getSchedules());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedule: ScheduleType = {
      id: Date.now().toString(),
      ...formData,
    };
    const updated = [...schedules, newSchedule];
    setSchedules(updated);
    Storage.saveSchedules(updated);
    setIsAdding(false);
    setFormData({
      subject: '',
      teacher: '',
      dayOfWeek: 0,
      startTime: '',
      endTime: '',
      classroom: '',
    });
  };

  const handleDelete = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    Storage.saveSchedules(updated);
  };

  const getSchedulesByDay = (day: number) => {
    return schedules
      .filter(s => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Расписание</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg border border-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Предмет"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <input
              type="text"
              placeholder="Преподаватель"
              value={formData.teacher}
              onChange={e => setFormData({ ...formData, teacher: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <select
              value={formData.dayOfWeek}
              onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>{day}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Кабинет (необязательно)"
              value={formData.classroom}
              onChange={e => setFormData({ ...formData, classroom: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="time"
              placeholder="Начало"
              value={formData.startTime}
              onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <input
              type="time"
              placeholder="Конец"
              value={formData.endTime}
              onChange={e => setFormData({ ...formData, endTime: e.target.value })}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day, dayIndex) => {
          const daySchedules = getSchedulesByDay(dayIndex);
          if (daySchedules.length === 0) return null;

          return (
            <div key={dayIndex} className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-lg">{day}</h3>
              <div className="space-y-2">
                {daySchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="bg-secondary p-3 rounded-lg space-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{schedule.subject}</div>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="text-muted-foreground hover:text-foreground text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground">{schedule.teacher}</div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    {schedule.classroom && (
                      <div className="text-sm text-muted-foreground">Каб. {schedule.classroom}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {schedules.length === 0 && !isAdding && (
        <div className="text-center py-12 text-muted-foreground">
          Расписание пусто. Добавьте первое занятие.
        </div>
      )}
    </div>
  );
}
