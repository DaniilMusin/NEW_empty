import { Schedule, LessonReport, Grade, Homework, AIMessage } from '@/types';

const STORAGE_KEYS = {
  SCHEDULES: 'student_schedules',
  REPORTS: 'student_reports',
  GRADES: 'student_grades',
  HOMEWORK: 'student_homework',
  AI_MESSAGES: 'student_ai_messages',
} as const;

export class Storage {
  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return null;
    }
  }

  static set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage:`, error);
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
    }
  }

  // Schedule methods
  static getSchedules(): Schedule[] {
    return this.get<Schedule[]>(STORAGE_KEYS.SCHEDULES) || [];
  }

  static saveSchedules(schedules: Schedule[]): void {
    this.set(STORAGE_KEYS.SCHEDULES, schedules);
  }

  // Reports methods
  static getReports(): LessonReport[] {
    return this.get<LessonReport[]>(STORAGE_KEYS.REPORTS) || [];
  }

  static saveReports(reports: LessonReport[]): void {
    this.set(STORAGE_KEYS.REPORTS, reports);
  }

  // Grades methods
  static getGrades(): Grade[] {
    return this.get<Grade[]>(STORAGE_KEYS.GRADES) || [];
  }

  static saveGrades(grades: Grade[]): void {
    this.set(STORAGE_KEYS.GRADES, grades);
  }

  // Homework methods
  static getHomework(): Homework[] {
    return this.get<Homework[]>(STORAGE_KEYS.HOMEWORK) || [];
  }

  static saveHomework(homework: Homework[]): void {
    this.set(STORAGE_KEYS.HOMEWORK, homework);
  }

  // AI Messages methods
  static getAIMessages(): AIMessage[] {
    return this.get<AIMessage[]>(STORAGE_KEYS.AI_MESSAGES) || [];
  }

  static saveAIMessages(messages: AIMessage[]): void {
    this.set(STORAGE_KEYS.AI_MESSAGES, messages);
  }
}
