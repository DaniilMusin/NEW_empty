import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateCSRF } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // БАГ #50: CSRF защита
    if (!validateCSRF(request)) {
      logger.security('CSRF validation failed', {
        operation: 'create-student',
      });
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Проверяем, что пользователь админ
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.warn('Unauthorized create student attempt', {
        operation: 'create-student',
      });
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { data: adminData } = await supabase
      .from('students')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!adminData?.is_admin) {
      logger.security('Non-admin tried to create student', {
        userId: user.id,
        operation: 'create-student',
      });
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const { username, full_name, password } = await request.json();

    if (!username || !full_name || !password) {
      logger.warn('Missing required fields in create student', {
        userId: user.id,
        operation: 'create-student',
      });
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    // Создаем email из username
    const email = `${username}@student.local`;

    // Проверяем, не существует ли уже пользователь с таким username
    const { data: existingStudent } = await supabase
      .from('students')
      .select('username')
      .eq('username', username)
      .single();

    if (existingStudent) {
      logger.warn('Attempt to create duplicate student', {
        userId: user.id,
        operation: 'create-student',
        metadata: { username },
      });
      return NextResponse.json(
        { error: 'Пользователь с таким логином уже существует' },
        { status: 400 }
      );
    }

    // БАГ #2, #3: Используем Admin API для создания пользователя
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name,
      },
    });

    if (authError || !authData.user) {
      logger.error('Failed to create auth user', authError, {
        userId: user.id,
        operation: 'create-student',
        metadata: { username },
      });
      return NextResponse.json(
        { error: authError?.message || 'Ошибка при создании пользователя' },
        { status: 500 }
      );
    }

    // Создаем профиль студента
    const { error: profileError } = await adminClient
      .from('students')
      .insert({
        id: authData.user.id,
        username,
        full_name,
        is_admin: false,
      });

    if (profileError) {
      // БАГ #3: Если не удалось создать профиль, удаляем пользователя
      await adminClient.auth.admin.deleteUser(authData.user.id);
      logger.error('Failed to create student profile, rolled back', profileError, {
        userId: user.id,
        operation: 'create-student',
        metadata: { username, newUserId: authData.user.id },
      });
      return NextResponse.json(
        { error: 'Ошибка при создании профиля: ' + profileError.message },
        { status: 500 }
      );
    }

    logger.admin('Student created successfully', {
      userId: user.id,
      metadata: {
        newStudentId: authData.user.id,
        username,
        full_name,
      },
    });

    logger.performance('create-student', Date.now() - startTime, {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      student: {
        id: authData.user.id,
        username,
        full_name,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in create-student', error, {
      operation: 'create-student',
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
