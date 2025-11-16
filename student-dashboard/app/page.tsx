'use client';

import { useState } from 'react';
import Schedule from '@/components/Schedule';
import Homework from '@/components/Homework';
import Grades from '@/components/Grades';
import Reports from '@/components/Reports';
import AIAssistant from '@/components/AIAssistant';

type Tab = 'schedule' | 'homework' | 'grades' | 'reports' | 'ai';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'schedule', label: 'Расписание', icon: '📅' },
    { id: 'homework', label: 'Домашние задания', icon: '📝' },
    { id: 'grades', label: 'Оценки', icon: '📊' },
    { id: 'reports', label: 'Отчеты', icon: '📋' },
    { id: 'ai', label: 'AI-Ассистент', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Личный кабинет ученика</h1>
        </div>
      </header>

      <nav className="bg-card border-b border-border sticky top-[73px] z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
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
        </div>
      </main>

      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Личный кабинет ученика • Powered by Next.js & Perplexity AI</p>
        </div>
      </footer>
    </div>
  );
}
