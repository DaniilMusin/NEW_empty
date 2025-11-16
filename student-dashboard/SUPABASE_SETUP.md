# Инструкция по настройке Supabase

Этот документ содержит пошаговую инструкцию по настройке Supabase для личного кабинета ученика.

## Шаг 1: Создание проекта в Supabase

1. Перейдите на https://supabase.com
2. Войдите или зарегистрируйтесь
3. Нажмите "New Project"
4. Заполните данные:
   - **Name**: Student Dashboard (или любое название)
   - **Database Password**: создайте надежный пароль (сохраните его!)
   - **Region**: выберите ближайший регион
5. Нажмите "Create new project" и дождитесь создания (2-3 минуты)

## Шаг 2: Получение API ключей

1. В панели Supabase перейдите в **Settings** → **API**
2. Найдите раздел **Project API keys**
3. Скопируйте:
   - **Project URL** (например, `https://xxxxx.supabase.co`)
   - **anon public** ключ

## Шаг 3: Настройка переменных окружения

1. В корне проекта создайте файл `.env.local`:

```bash
cp .env.local.example .env.local
```

2. Откройте `.env.local` и заполните:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Perplexity API (опционально)
PERPLEXITY_API_KEY=your-perplexity-key

# Пароль для админа (не обязательно, используется для будущих фич)
ADMIN_PASSWORD=your-secure-password
```

## Шаг 4: Создание таблиц в базе данных

1. В панели Supabase перейдите в **SQL Editor**
2. Нажмите "New query"
3. Скопируйте весь SQL-код из файла `supabase-schema.sql`
4. Вставьте в редактор и нажмите **Run**
5. Дождитесь выполнения (должно быть "Success")

## Шаг 5: Настройка аутентификации

1. Перейдите в **Authentication** → **Providers**
2. Убедитесь, что **Email** провайдер включен
3. В настройках Email:
   - **Enable Email provider**: ON
   - **Confirm email**: OFF (отключите для упрощения)
   - **Secure email change**: OFF
4. Сохраните изменения

## Шаг 6: Настройка Email Templates (опционально)

Если вы не хотите, чтобы Supabase отправлял email подтверждения:

1. Перейдите в **Authentication** → **Email Templates**
2. Для каждого шаблона можно настроить или отключить отправку

## Шаг 7: Создание первого админа

1. Перейдите в **Authentication** → **Users**
2. Нажмите "Add user" → "Create new user"
3. Заполните:
   - **Email**: `admin@student.local` (или любой email)
   - **Password**: создайте надежный пароль
   - **Auto Confirm User**: ON
4. Нажмите "Create user"
5. Скопируйте UUID созданного пользователя

### Добавление записи в таблицу students

1. Перейдите в **Table Editor** → **students**
2. Нажмите "Insert" → "Insert row"
3. Заполните:
   - **id**: вставьте UUID пользователя из шага выше
   - **username**: `admin`
   - **full_name**: ваше имя
   - **is_admin**: `true`
4. Нажмите "Save"

## Шаг 8: Запуск приложения

1. Убедитесь, что все зависимости установлены:

```bash
npm install
```

2. Запустите приложение:

```bash
npm run dev
```

3. Откройте http://localhost:3000
4. Войдите с credentials:
   - **Логин**: `admin`
   - **Пароль**: пароль, который вы создали в Supabase

## Шаг 9: Создание учеников через админ-панель

1. После входа как админ, перейдите во вкладку "Админ-панель"
2. Нажмите "Добавить ученика"
3. Заполните форму:
   - **Логин**: уникальный логин для ученика (только буквы, цифры, подчеркивание)
   - **Полное имя**: имя и фамилия ученика
   - **Пароль**: сгенерируйте или введите вручную
4. Нажмите "Создать ученика"
5. **ВАЖНО**: Сохраните логин и пароль - их нужно передать ученику

## Устранение проблем

### Ошибка "Invalid API key"

- Проверьте, что вы скопировали правильный API ключ
- Убедитесь, что в `.env.local` нет лишних пробелов
- Перезапустите dev сервер (`npm run dev`)

### Ошибка "User already exists"

- Такой логин уже используется
- Выберите другой логин для ученика

### Не могу войти как админ

- Убедитесь, что вы создали запись в таблице `students` с `is_admin = true`
- Проверьте, что ID в таблице `students` совпадает с ID пользователя в `auth.users`
- Используйте логин (username), а не email

### Ошибки при выполнении SQL

- Убедитесь, что вы скопировали весь SQL-код
- Проверьте, что нет предыдущих версий таблиц (удалите их через Table Editor)
- Выполняйте SQL по частям, если есть ошибки

## Дополнительные настройки

### Изменение лимитов Row Level Security

По умолчанию RLS настроен так, что:
- Ученики видят только свои данные
- Админы видят данные всех учеников
- Ученики могут добавлять/изменять только свои записи

Если нужно изменить эти правила:
1. Перейдите в **Authentication** → **Policies**
2. Выберите таблицу
3. Отредактируйте или добавьте новые политики

### Backup данных

Рекомендуется регулярно делать backup:
1. Перейдите в **Database** → **Backups**
2. Настройте автоматические backup (доступно в платных планах)
3. Или используйте ручной экспорт через SQL Editor

## Production Deployment

Для деплоя на production (Vercel, Netlify и т.д.):

1. Добавьте environment variables в настройках платформы:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `PERPLEXITY_API_KEY`

2. В Supabase настройте:
   - **Authentication** → **URL Configuration**
   - Добавьте ваш production URL в **Site URL**
   - Добавьте URL в **Redirect URLs**

## Безопасность

1. **Никогда** не коммитьте файл `.env.local` в Git
2. Используйте надежные пароли для админов
3. Регулярно проверяйте логи в **Logs** → **Authentication**
4. Включите 2FA для вашего Supabase аккаунта
5. Настройте rate limiting в **Authentication** → **Rate Limits**

## Полезные ссылки

- [Документация Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor](https://supabase.com/docs/guides/database/overview)

---

Если у вас возникли вопросы или проблемы, обратитесь к документации Supabase или создайте issue в репозитории проекта.
