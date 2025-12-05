import { NextResponse } from 'next/server';

export async function GET() {
  // LINEのログイン画面のURLを作成
  const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID || '2008637795'; // ※後で設定します
  const REDIRECT_URI = 'https://kango-app.vercel.app/api/auth/line/callback';
  
  // ランダムな文字列（セキュリティ用）
  const state = Math.random().toString(36).substring(7);
  
  const lineUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=profile%20openid%20email`;

  return NextResponse.redirect(lineUrl);
}