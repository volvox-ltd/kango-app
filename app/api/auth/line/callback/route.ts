import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'No code' });

  // 1. LINEからアクセストークンを取得
  const LINE_CLIENT_ID = '2008629342'; // ★書き換えてください
  const LINE_CLIENT_SECRET = '2a1f8048f08b3515fef40f4845d3f1c3'; // ★書き換えてください
  const REDIRECT_URI = 'https://kango-app.vercel.app/api/auth/line/callback';

  const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: LINE_CLIENT_ID,
      client_secret: LINE_CLIENT_SECRET,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.id_token) return NextResponse.json({ error: 'Token error', details: tokenData });

  // 2. IDトークンからユーザー情報を取得
  const profileResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: tokenData.id_token,
      client_id: LINE_CLIENT_ID,
    }),
  });

  const profile = await profileResponse.json();
  const email = profile.email || `${profile.sub}@line.dummy`; // メールがない場合はダミー

  // 3. Supabase Adminでユーザー操作
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ユーザーを探す、なければ作る
  // (emailで検索するのが一番確実です)
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  let user = users.find((u) => u.email === email);

  if (!user) {
    // 新規作成
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        full_name: profile.name,
        avatar_url: profile.picture,
        provider: 'line'
      }
    });
    if (createError) return NextResponse.json({ error: createError.message });
    user = newUser.user!;
    
    // プロフィールテーブルなども作成
    await supabaseAdmin.from('profiles').insert([{ id: user.id, email, role: 'nurse' }]);
    await supabaseAdmin.from('nurses').insert([{ id: user.id, name: profile.name, avatar_url: profile.picture }]);
  }

  // 4. ログイン用リンク(Magic Link)を発行してリダイレクト
  // これでクライアント側でセッションが確立されます
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: 'https://kango-app.vercel.app/mypage' // ログイン後の移動先
    }
  });

  if (linkData?.properties?.action_link) {
    // ユーザーをそのリンクに飛ばす（＝ログイン完了）
    return NextResponse.redirect(linkData.properties.action_link);
  }

  return NextResponse.json({ error: 'Failed to generate login link' });
}