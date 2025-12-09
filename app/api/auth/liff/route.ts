import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { idToken, next } = await request.json();

    if (!idToken) return NextResponse.json({ error: 'No token provided' }, { status: 400 });

    const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID!;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kango-app.vercel.app';

    // 1. LINEのサーバーに「このトークン本物？」と聞きに行く
    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: LINE_CLIENT_ID,
      }),
    });

    const profile = await verifyResponse.json();

    if (profile.error) {
      console.error('LINE Token Verify Error:', profile);
      return NextResponse.json({ error: profile.error_description }, { status: 400 });
    }

    // 2. プロフィール情報を取得
    const lineUserId = profile.sub; // LINEのユーザーID
    const displayName = profile.name;
    const pictureUrl = profile.picture;
    const email = profile.email || `${lineUserId}@line.dummy`;

    // 3. Supabase Adminでユーザー処理
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
        user_metadata: { full_name: displayName, avatar_url: pictureUrl, provider: 'line' }
      });
      if (createError) throw createError;
      user = newUser.user!;
      
      // 関連テーブル作成
      await supabaseAdmin.from('profiles').insert([{ id: user.id, email, role: 'nurse' }]);
      await supabaseAdmin.from('nurses').insert([{ id: user.id, name: displayName, avatar_url: pictureUrl, line_user_id: lineUserId }]);
    } else {
      // 既存更新
      await supabaseAdmin.from('nurses').update({ line_user_id: lineUserId }).eq('id', user.id);
    }

    // 4. マジックリンクを発行して返す
    // これをフロントエンドで踏むと、クッキーがセットされてログイン状態になる
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: { redirectTo: `${BASE_URL}${next || '/mypage'}` }
    });

    return NextResponse.json({ url: linkData.properties?.action_link });

  } catch (error: any) {
    console.error('Auth Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}