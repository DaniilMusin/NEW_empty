export interface Schedule {
  id: string;
  subject: string;
  teacher: string;
  dayOfWeek: number; // 0-6 (Mon-Sun)
  startTime: string;
  endTime: string;
  classroom?: string;
}

export interface LessonReport {
  id: string;
  scheduleId: string;
  date: string;
  topic: string;
  notes: string;
  attendance: boolean;
  createdAt: string;
}

export interface Grade {
  id: string;
  subject: string;
  value: number;
  maxValue: number;
  date: string;
  type: 'homework' | 'test' | 'exam' | 'quiz' | 'project';
  description: string;
}

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
