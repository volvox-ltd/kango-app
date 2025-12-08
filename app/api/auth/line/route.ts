import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // ★追加

export async function GET(request: Request) {
  // ★追加: URLから next パラメータを取得
  const { searchParams } = new URL(request.url);
  const nextUrl = searchParams.get('next') || '/mypage';

  // ★追加: Cookieに保存（有効期限5分）
  const cookieStore = await cookies();
  cookieStore.set('auth-redirect', nextUrl, { path: '/', maxAge: 300 });

  // LINEのログイン画面のURLを作成
  const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID || process.env.LINE_CHANNEL_ID!;
  // 環境変数に応じてベースURLを切り替え
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kango-app.vercel.app';
  const REDIRECT_URI = `${BASE_URL}/api/auth/line/callback`;
  
  // ランダムな文字列
  const state = Math.random().toString(36).substring(7);
  
  const lineUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=profile%20openid%20email`;

  return NextResponse.redirect(lineUrl);
}