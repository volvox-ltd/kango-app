'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function NurseLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/mypage';
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. 自動ログイン機能 (LIFFアプリ内で開いた場合)
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const liff = (await import('@line/liff')).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

        // LIFFアプリ内かつ未ログインなら、自動で処理開始
        if (liff.isInClient() && liff.isLoggedIn()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            handleLineLogin(); // 下で作る関数を呼ぶ
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    autoLogin();
  }, []);

  // 2. 新・ログイン処理 (画面遷移なし！)
  const handleLineLogin = async () => {
    setLoading(true);
    setMessage('LINEで認証中...');

    try {
      const liff = (await import('@line/liff')).default;
      
      // LIFF初期化
      if (!liff.id) {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
      }

      // ★ここがポイント: Webログイン画面に飛ばさず、トークンだけ取る
      if (!liff.isLoggedIn()) {
        // ログインしていなければ、ここで初めてLINE認証画面を出す(ブラウザの場合)
        liff.login({ redirectUri: window.location.href }); 
        return; 
      }

      // IDトークンを取得 (これがパスポート代わり)
      const idToken = liff.getIDToken();

      // さっき作ったAPIにトークンを投げる
      const res = await fetch('/api/auth/liff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, next: nextUrl }),
      });

      const data = await res.json();

      if (data.url) {
        // APIから返ってきた「ログイン用URL」に移動して完了！
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Login failed');
      }

    } catch (error: any) {
      console.error(error);
      setMessage('エラーが発生しました: ' + error.message);
      setLoading(false);
    }
  };

  // --- (以下、通常のメアドログインなどの既存コードはそのまま残す) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // ... (省略) ...
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">💉 看護師ログイン</h2>
        
        {/* ボタンは通常のonClickに戻す */}
        <button
          onClick={handleLineLogin}
          disabled={loading}
          className="w-full bg-[#06C755] text-white font-bold py-3 rounded-lg shadow hover:bg-[#05b34c] transition mb-6 flex items-center justify-center gap-2"
        >
          {loading ? '処理中...' : <><span className="text-xl font-black">LINE</span> でログイン / 登録</>}
        </button>

        {/* ... (残りのJSX) ... */}
        {message && <p className="text-center text-red-500 text-sm mb-4">{message}</p>}
        {/* ... */}
      </div>
    </div>
  );
}

export default function NurseLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NurseLoginForm />
    </Suspense>
  );
}