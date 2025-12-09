import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // ★修正: クッキーだけでなく、URLパラメータの 'next' も確認する
  // これにより、クッキーが消えても迷子になりません
  const nextParam = searchParams.get('next');

  if (!code) return NextResponse.json({ error: 'No code' });

  // 戻り先を決定（URLパラメータ優先 → クッキー → デフォルト）
  const cookieStore = await cookies();
  const nextUrl = nextParam || cookieStore.get('auth-redirect')?.value || '/mypage';

  // 1. 環境変数の取得
  const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID || process.env.LINE_CHANNEL_ID!;
  const LINE_CLIENT_SECRET = process.env.LINE_CHANNEL_SECRET!;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kango-app.vercel.app';
  // ★重要: コールバックURLにも next を引き継ぐ必要がありますが、
  // LINEの認証時には登録されたURLと完全に一致する必要があるため、ここではパラメータを付けないのが一般的です。
  // ただし、今回は「state」を使わずに「next」を運ぶため、liff.login の redirectUri にパラメータを含めます。
  // LINE Developersの登録URLは「パラメータなし」でも、実際のリクエストには「パラメータあり」で通る場合がありますが、
  // 最も安全なのは「登録URLと一致させること」です。
  // 今回は、liff.loginのredirectUriにパラメータを付ける戦略をとります。
  
  // NOTE: redirect_uri は LINE Developers に登録したものと一致させる必要があります
  const REDIRECT_URI = `${BASE_URL}/api/auth/line/callback`;
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 2. LINEからアクセストークンを取得
  const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI, // ここは登録URLと一致させる（パラメータなし）
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

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  let user = users.find((u) => u.email === email);

  if (!user) {
    // 新規登録
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
    
    await supabaseAdmin.from('profiles').insert([{ id: user.id, email, role: 'nurse' }]);
    await supabaseAdmin.from('nurses').insert([{ 
      id: user.id, 
      name: displayName, 
      avatar_url: pictureUrl,
      line_user_id: lineUserId 
    }]);

  } else {
    // 既存ユーザー更新
    await supabaseAdmin.from('nurses').update({
      line_user_id: lineUserId
    }).eq('id', user.id);
  }

  // 5. ログイン用リンク発行
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      // ★ここで、確実に元の場所（nextUrl）に戻るように設定
      redirectTo: `${BASE_URL}${nextUrl}`
    }
  });

  // クッキーを削除（念のため）
  cookieStore.delete('auth-redirect');

  if (linkData?.properties?.action_link) {
    return NextResponse.redirect(linkData.properties.action_link);
  }

  return NextResponse.json({ error: 'Failed to generate login link' });
}