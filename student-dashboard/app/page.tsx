'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Schedule from '@/components/Schedule';
import Homework from '@/components/Homework';
import Grades from '@/components/Grades';
import Reports from '@/components/Reports';
import AIAssistant from '@/components/AIAssistant';
import AdminPanel from '@/components/AdminPanel';

type Tab = 'schedule' | 'homework' | 'grades' | 'reports' | 'ai' | 'admin';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        // Получаем профиль ученика
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single();

        setStudent(studentData);
      }
      setLoading(false);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const tabs: { id: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: 'schedule', label: 'Расписание', icon: '📅' },
    { id: 'homework', label: 'Домашние задания', icon: '📝' },
    { id: 'grades', label: 'Оценки', icon: '📊' },
    { id: 'reports', label: 'Отчеты', icon: '📋' },
    { id: 'ai', label: 'AI-Ассистент', icon: '🤖' },
    { id: 'admin', label: 'Админ-панель', icon: '⚙️', adminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || student?.is_admin);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Личный кабинет ученика</h1>
            <div className="flex items-center gap-4">
              {student && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Привет, </span>
                  <span className="font-medium">{student.full_name}</span>
                  {student.is_admin && (
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      Админ
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-card border-b border-border sticky top-[73px] z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 whitespace-nowrap font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'schedule' && <Schedule />}
          {activeTab === 'homework' && <Homework />}
          {activeTab === 'grades' && <Grades />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'ai' && <AIAssistant />}
          {activeTab === 'admin' && student?.is_admin && <AdminPanel />}
        </div>
      </main>

      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Личный кабинет ученика • Powered by Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  );
}
