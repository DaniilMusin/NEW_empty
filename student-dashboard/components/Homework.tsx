'use client';

import { useState, useEffect } from 'react';
import { Homework as HomeworkType } from '@/types';
import { Storage } from '@/lib/storage';

export default function Homework() {
  const [homework, setHomework] = useState<HomeworkType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    setHomework(Storage.getHomework());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newHomework: HomeworkType = {
      id: Date.now().toString(),
      ...formData,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...homework, newHomework];
    setHomework(updated);
    Storage.saveHomework(updated);
    setIsAdding(false);
    setFormData({
      subject: '',
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
    });
  };

  const handleToggle = (id: string) => {
    const updated = homework.map(hw =>
      hw.id === id ? { ...hw, completed: !hw.completed } : hw
    );
    setHomework(updated);
    Storage.saveHomework(updated);
  };

  const handleDelete = (id: string) => {
    const updated = homework.filter(hw => hw.id !== id);
    setHomework(updated);
    Storage.saveHomework(updated);
  };

  const sortedHomework = [...homework].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isOverdue = (dateStr: string) => {
    return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="space-y-4">
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
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg border border-border space-y-4">
          <input
            type="text"
            placeholder="Предмет"
            value={formData.subject}
            onChange={e => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="text"
            placeholder="Название задания"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <textarea
            placeholder="Описание"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <select
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
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
        {sortedHomework.map(hw => (
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
                onChange={() => handleToggle(hw.id)}
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
                  <span className={`text-xs px-2 py-1 rounded ${
                    isOverdue(hw.dueDate) && !hw.completed
                      ? 'bg-red-500 text-white'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {formatDate(hw.dueDate)}
                    {isOverdue(hw.dueDate) && !hw.completed && ' (Просрочено)'}
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
