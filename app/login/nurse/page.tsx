'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function NurseLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/mypage';

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // LIFF初期化（アプリ内ブラウザで開かれた場合の自動ログイン用）
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffModule = await import('@line/liff');
        const liff = liffModule.default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

        // LINEアプリ内なら自動ログイン
        if (liff.isInClient()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setLoading(true);
            setMessage('LINEで自動ログイン中...');
            // APIへ転送
            window.location.href = `/api/auth/line?next=${encodeURIComponent(nextUrl)}`;
          } else {
             router.push(nextUrl);
          }
        }
      } catch (error) {
        console.error('LIFF init error', error);
      }
    };
    initLiff();
  }, [nextUrl, router]);

  // ★修正: ボタンを押したら「LIFF URL」へ飛ばす
  const handleLineLogin = () => {
    setLoading(true);
    
    // LIFF IDを取得
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      alert('LIFF IDが設定されていません');
      setLoading(false);
      return;
    }

    // 「ログインしてね」という合図(auto_login=true)をつけて、LINEアプリを呼び出す
    // これなら universal_link_error は起きません
    const liffUrl = `https://liff.line.me/${liffId}?auto_login=true&next=${encodeURIComponent(nextUrl)}`;
    
    // 移動！
    window.location.href = liffUrl;
  };

  // --- 以下、通常ログイン・登録処理はそのまま ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage('ログイン失敗: ' + error.message);
      setLoading(false);
    } else {
      router.push(nextUrl); 
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setMessage('登録失敗: ' + (authError?.message || '不明なエラー'));
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: authData.user.id, email: email, role: 'nurse' }]);

    const { error: nurseError } = await supabase
      .from('nurses')
      .insert([{ id: authData.user.id, name: name || '未設定のナース' }]);

    if (profileError || nurseError) {
       console.error(profileError, nurseError);
       setMessage('アカウント作成エラー');
    } else {
       setMessage('登録成功！');
       setTimeout(() => {
         router.push(nextUrl); 
         router.refresh();
       }, 1000);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-500">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        💉 看護師ログイン
      </h2>
      
      <button
        onClick={handleLineLogin}
        className="w-full bg-[#06C755] text-white font-bold py-3 rounded-lg shadow hover:bg-[#05b34c] transition mb-6 flex items-center justify-center gap-2"
      >
        <span className="text-xl font-black">LINE</span> でログイン / 登録
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">またはメールアドレスで</span></div>
      </div>

      {message && (
        <div className={`p-4 rounded mb-4 text-sm ${message.includes('成功') || message.includes('自動') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="flex mb-6 border-b">
        <button type="button" className={`flex-1 py-2 font-bold ${!isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`} onClick={() => setIsSignUp(false)}>ログイン</button>
        <button type="button" className={`flex-1 py-2 font-bold ${isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`} onClick={() => setIsSignUp(true)}>新規登録</button>
      </div>

      <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-sm font-bold text-gray-700">お名前</label>
            <input type="text" required className="mt-1 block w-full border border-gray-300 rounded p-2" placeholder="例: 看護 花子" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label className="block text-sm font-bold text-gray-700">メールアドレス</label>
          <input type="email" required className="mt-1 block w-full rounded border border-gray-300 p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">パスワード</label>
          <input type="password" required minLength={6} className="mt-1 block w-full rounded border border-gray-300 p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow">
          {loading ? '処理中...' : (isSignUp ? 'この内容で登録する' : 'ログイン')}
        </button>
      </form>
    </div>
  );
}

export default function NurseLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <Suspense fallback={<div className="text-gray-500 font-bold">読み込み中...</div>}>
        <NurseLoginForm />
      </Suspense>
    </div>
  );
}