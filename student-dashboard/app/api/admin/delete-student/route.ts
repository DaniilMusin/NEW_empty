import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateCSRF } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    // БАГ #50: CSRF защита
    if (!validateCSRF(request)) {
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

    // БАГ #53: Проверяем существование студента
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('is_admin')
      .eq('id', student_id)
      .single();

    if (studentError || !studentData) {
      return NextResponse.json(
        { error: 'Студент не найден' },
        { status: 404 }
      );
    }

    if (studentData.is_admin) {
      return NextResponse.json(
        { error: 'Нельзя удалить админа' },
        { status: 403 }
      );
    }

    // БАГ #24: Сначала удаляем из auth.users, затем из students
    // Это безопаснее: если удаление из students упадет, пользователь не сможет войти
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
      student_id
    );

    if (authDeleteError) {
      console.error('Error deleting user from auth:', authDeleteError);
      return NextResponse.json(
        { error: 'Ошибка при удалении пользователя из системы авторизации' },
        { status: 500 }
      );
    }

    // Удаляем профиль (каскадно удалятся все связанные данные)
    const { error: deleteError } = await adminClient
      .from('students')
      .delete()
      .eq('id', student_id);

    if (deleteError) {
      // БАГ #24: Если удаление профиля упало после удаления auth, логируем ошибку
      console.error('Error deleting student profile after auth deletion:', deleteError);
      return NextResponse.json(
        { error: 'Ошибка при удалении профиля ученика (требуется ручная очистка)' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
