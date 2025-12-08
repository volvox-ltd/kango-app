import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'No code' });

  // 1. 環境変数の取得 (環境変数が設定されていない場合のフォールバックも考慮)
  const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID || process.env.LINE_CHANNEL_ID!;
  const LINE_CLIENT_SECRET = process.env.LINE_CHANNEL_SECRET!;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://kango-app.vercel.app'}/api/auth/line/callback`;
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 2. LINEからアクセストークンを取得
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

  // 3. IDトークンからユーザー情報を取得
  const profileResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: tokenData.id_token,
      client_id: LINE_CLIENT_ID,
    }),
  });

  const profile = await profileResponse.json();
  // LINEの仕様により、userId か sub のどちらかがIDになります
  const lineUserId = profile.userId || profile.sub;
  const displayName = profile.name || profile.displayName || 'No Name';
  const pictureUrl = profile.picture || profile.pictureUrl;
  const email = profile.email || `${lineUserId}@line.dummy`;

  // 4. Supabase Adminでユーザー操作
  const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ユーザーを探す
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  let user = users.find((u) => u.email === email);

  if (!user) {
    // --- 新規登録 ---
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        avatar_url: pictureUrl,
        provider: 'line'
      }
    });
    if (createError) return NextResponse.json({ error: createError.message });
    user = newUser.user!;
    
    // プロフィール作成
    await supabaseAdmin.from('profiles').insert([{ id: user.id, email, role: 'nurse' }]);
    
    // 看護師データ作成（LINE IDも保存）
    await supabaseAdmin.from('nurses').insert([{ 
      id: user.id, 
      name: displayName, 
      avatar_url: pictureUrl,
      line_user_id: lineUserId // ★ここでLINE IDを保存
    }]);

  } else {
    // --- 既存ユーザーの場合 ---
    // LINE IDを最新のものに更新して紐付けを確実にする
    await supabaseAdmin.from('nurses').update({
      line_user_id: lineUserId
    }).eq('id', user.id); // ★ここを 'user.id' に修正しました
  }

  // 5. ログイン用リンク(Magic Link)を発行してリダイレクト
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://kango-app.vercel.app'}/mypage`
    }
  });

  if (linkData?.properties?.action_link) {
    return NextResponse.redirect(linkData.properties.action_link);
  }

  return NextResponse.json({ error: 'Failed to generate login link' });
}