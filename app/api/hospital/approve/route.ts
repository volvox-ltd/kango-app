import { createClient } from '@supabase/supabase-js'; // ★ここを修正しました
import { NextResponse } from 'next/server';
import { sendLineMessage } from '@/lib/line';

export async function POST(request: Request) {
  // 環境変数から鍵を取得
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Admin権限で操作するためのクライアントを作成
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  // 送られてきたデータ（応募ID）を取得
  const { applicationId } = await request.json();

  if (!applicationId) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  // 1. 応募情報を取得（看護師のIDを知るため）
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select('*, jobs(title), nurses(line_user_id, name)') // 求人タイトルと看護師のLINE IDも一緒に取る
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // 2. ステータスを「採用確定（confirmed）」に更新
  // ※画面のボタンは 'handleConfirm' なので、ステータスは 'confirmed' にするのが正解です
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: 'confirmed' })
    .eq('id', applicationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 3. 看護師にLINE通知を送る
  const nurseLineId = application.nurses?.line_user_id;
  const jobTitle = application.jobs?.title;

  if (nurseLineId) {
    const message = `🎉 おめでとうございます！\n\n「${jobTitle}」への応募が採用されました！\n\nこれからのやり取りはチャットで行いましょう。\nアプリを開く: https://kango-app.vercel.app/mypage`;
    
    // LINE送信
    await sendLineMessage(nurseLineId, message);
  }

  return NextResponse.json({ success: true });
}