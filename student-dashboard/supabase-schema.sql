-- Создание таблиц для личного кабинета ученика

-- БАГ #8, #16: Валидация и ограничения для полей
-- Таблица профилей учеников (расширяет auth.users)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  full_name VARCHAR(100) NOT NULL CHECK (char_length(full_name) >= 2),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица расписания
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  teacher VARCHAR(100) NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time VARCHAR(5) NOT NULL CHECK (start_time ~ '^\d{2}:\d{2}$'),
  end_time VARCHAR(5) NOT NULL CHECK (end_time ~ '^\d{2}:\d{2}$'),
  classroom VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- БАГ #38: Проверка что время начала < времени окончания
  CHECK (start_time < end_time)
);

-- Таблица домашних заданий
CREATE TABLE IF NOT EXISTS public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица оценок
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0),
  max_value INTEGER NOT NULL CHECK (max_value > 0 AND max_value <= 1000),
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('homework', 'test', 'exam', 'quiz', 'project')),
  description VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- БАГ #39: Проверка что оценка не превышает максимальную
  CHECK (value <= max_value)
);

-- Таблица отчетов по занятиям
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  topic VARCHAR(200) NOT NULL,
  notes VARCHAR(2000) NOT NULL,
  attendance BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица истории AI-чата
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content VARCHAR(10000) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- БАГ #11: Объединены политики SELECT для избежания дублирования
-- Политики доступа для students
CREATE POLICY "Users can view profiles"
  ON public.students FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Students can update own profile"
  ON public.students FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert students"
  ON public.students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update all students"
  ON public.students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete students"
  ON public.students FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- БАГ #5: Разделены политики для INSERT и других операций
-- Политики для schedules
CREATE POLICY "Students can view own schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own schedules"
  ON public.schedules FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete own schedules"
  ON public.schedules FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all schedules"
  ON public.schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can manage all schedules"
  ON public.schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Политики для homework
CREATE POLICY "Students can view own homework"
  ON public.homework FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own homework"
  ON public.homework FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own homework"
  ON public.homework FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete own homework"
  ON public.homework FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all homework"
  ON public.homework FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can manage all homework"
  ON public.homework FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Политики для grades
CREATE POLICY "Students can view own grades"
  ON public.grades FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own grades"
  ON public.grades FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own grades"
  ON public.grades FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete own grades"
  ON public.grades FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all grades"
  ON public.grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can manage all grades"
  ON public.grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Политики для reports
CREATE POLICY "Students can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete own reports"
  ON public.reports FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can manage all reports"
  ON public.reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Политики для ai_messages
CREATE POLICY "Students can view own messages"
  ON public.ai_messages FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own messages"
  ON public.ai_messages FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own messages"
  ON public.ai_messages FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete own messages"
  ON public.ai_messages FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all messages"
  ON public.ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- БАГ #15: Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_students_username ON public.students(username);
CREATE INDEX IF NOT EXISTS idx_schedules_student_id ON public.schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_student_id ON public.homework(student_id);
-- БАГ #38: Индекс для оптимизации запросов просроченных заданий
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON public.homework(due_date);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_reports_student_id ON public.reports(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_student_id ON public.ai_messages(student_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
