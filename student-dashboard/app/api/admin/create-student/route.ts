import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Создаем пользователя через auth.admin
    // Для этого нужно использовать service role key
    // Создадим через обычный signUp и затем обновим профиль
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name,
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Ошибка при создании пользователя' },
        { status: 500 }
      );
    }

    // Создаем профиль студента
    const { error: profileError } = await supabase
      .from('students')
      .insert({
        id: authData.user.id,
        username,
        full_name,
        is_admin: false,
      });

    if (profileError) {
      // Если не удалось создать профиль, удаляем пользователя
      return NextResponse.json(
        { error: 'Ошибка при создании профиля' },
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
