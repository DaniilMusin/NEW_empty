import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Проверяем, что пользователь админ
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { data: adminData } = await supabase
      .from('students')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!adminData?.is_admin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const { username, full_name, password } = await request.json();

    if (!username || !full_name || !password) {
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
      return NextResponse.json(
        { error: 'Пользователь с таким логином уже существует' },
        { status: 400 }
      );
    }

    // БАГ #2, #3: Используем Admin API для создания пользователя
    // Это не выкинет текущего админа и позволяет откатить транзакцию
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
      // БАГ #3: Если не удалось создать профиль, удаляем пользователя (откат транзакции)
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Ошибка при создании профиля: ' + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: authData.user.id,
        username,
        full_name,
      },
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
