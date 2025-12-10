'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

function NurseLoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/mypage';

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. 自動ログイン機能 (このページがLINEアプリ内で開かれた時だけ動く)
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const liff = (await import('@line/liff')).default;
        // LIFF初期化
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

        // LINEアプリ内(LIFF)で、かつログイン状態なら
        if (liff.isInClient() && liff.isLoggedIn()) {
          setLoading(true);
          setMessage('LINEで認証中...');

          // ★重要: パスワード入力画面には飛ばさず、
          // 今持っている「通行手形(IDトークン)」をAPIに渡して、その場でログインしてもらう
          const idToken = liff.getIDToken();

          if (idToken) {
            await verifyTokenAndLogin(idToken);
          }
        }
      } catch (e) {
        console.error('LIFF Error:', e);
      }
    };
    autoLogin();
  }, []);

  // 2. サーバーAPIにトークンを渡してログインする関数
  const verifyTokenAndLogin = async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/liff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, next: nextUrl }),
      });

      const data = await res.json();

      if (data.url) {
        // 成功したら、APIがくれた「ログイン済みURL」に移動するだけ
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error(error);
      setMessage('ログインエラー: ' + error.message);
      setLoading(false);
    }
  };

  // 3. ボタンを押した時の処理
  // スマホならLINEアプリが起動し、PCならQRコードが出ます
  const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?next=${encodeURIComponent(nextUrl)}`;


  // --- (通常ログイン用フォーム: 変更なし) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage('ログイン失敗: ' + error.message); setLoading(false); }
    else { router.push(nextUrl); router.refresh(); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) { setMessage('登録失敗'); setLoading(false); return; }
    await supabase.from('profiles').insert([{ id: data.user.id, email, role: 'nurse' }]);
    await supabase.from('nurses').insert([{ id: data.user.id, name: name || '未設定' }]);
    router.push(nextUrl); router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-bold">{message || '処理中...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">💉 看護師ログイン</h2>

        {/* ★ここがポイント: ボタンを単純なリンクにする */}
        <a
          href={liffUrl}
          className="w-full bg-[#06C755] text-white font-bold py-3 rounded-lg shadow hover:bg-[#05b34c] transition mb-6 flex items-center justify-center gap-2 no-underline"
        >
          <span className="text-xl font-black">LINE</span> でログイン / 登録
        </a>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">またはメールアドレスで</span></div>
        </div>

        {/* フォーム切り替えタブ */}
        <div className="flex mb-6 border-b">
          <button type="button" className={`flex-1 py-2 font-bold ${!isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`} onClick={() => setIsSignUp(false)}>ログイン</button>
          <button type="button" className={`flex-1 py-2 font-bold ${isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`} onClick={() => setIsSignUp(true)}>新規登録</button>
        </div>

        {/* 通常ログインフォーム */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-bold text-gray-700">お名前</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded p-2" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700">メールアドレス</label>
            <input type="email" required className="mt-1 block w-full rounded border border-gray-300 p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">パスワード</label>
            <input type="password" required className="mt-1 block w-full rounded border border-gray-300 p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition shadow">
            {isSignUp ? 'この内容で登録する' : 'ログイン'}
          </button>
        </form>
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