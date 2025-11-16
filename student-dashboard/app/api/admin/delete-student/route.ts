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

    const { student_id } = await request.json();

    if (!student_id) {
      return NextResponse.json(
        { error: 'ID ученика обязателен' },
        { status: 400 }
      );
    }

    // Проверяем, что удаляем не админа
    const { data: studentData } = await supabase
      .from('students')
      .select('is_admin')
      .eq('id', student_id)
      .single();

    if (studentData?.is_admin) {
      return NextResponse.json(
        { error: 'Нельзя удалить админа' },
        { status: 403 }
      );
    }

    // Удаляем профиль (каскадно удалятся все связанные данные)
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', student_id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Ошибка при удалении ученика' },
        { status: 500 }
      );
    }

    // Примечание: удаление пользователя из auth.users требует service role key
    // Для production нужно настроить это отдельно

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
