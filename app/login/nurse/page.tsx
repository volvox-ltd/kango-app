'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NurseLoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Auth0のドメイン定義（必ず修正してください）
  const AUTH0_DOMAIN = "https://[あなたのAuth0ドメイン].auth0.com"; 

  // --- ログイン処理 ---
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
      router.push('/mypage'); 
      router.refresh();
    }
  };

  // --- 新規登録処理 ---
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

    // profilesテーブル作成
    const { error: profileError } = await supabase.from('profiles').insert([{ id: authData.user.id, email: email, role: 'nurse' }]);
    // 看護師テーブル作成
    const { error: nurseError } = await supabase.from('nurses').insert([{ id: authData.user.id, name: name || '未設定のナース' }]);

    if (profileError || nurseError) {
       console.error(profileError, nurseError);
       setMessage('アカウントは作成されましたが、プロフィールの保存に失敗しました。');
    } else {
       setMessage('登録成功！自動的にログインします...');
       setTimeout(() => {
         router.push('/mypage'); 
         router.refresh();
       }, 1000);
    }
    setLoading(false);
  };

    // ★シンプル版: 余計なオプションを削ぎ落とす
    const handleLineLogin = async () => {
        setLoading(true);
        
        // @ts-ignore
        const { data, error } = await supabase.auth.signInWithOAuth({
            // ★修正: 'as any' をつけて型チェックを強制的にパスさせます
            provider: 'auth0' as any, 
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                connection: 'line', 
                iss: AUTH0_DOMAIN, 
                },
            },
            });

        if (error) {
        alert('LINEログインエラー: ' + error.message);
        setLoading(false);
        }
    };


  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          💉 看護師ログイン
        </h2>
        
        {/* LINEログインボタン */}
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
          <div className={`p-4 rounded mb-4 text-sm ${message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* タブ切り替えエリア */}
        <div className="flex mb-6 border-b">
          <button
            type="button"
            className={`flex-1 py-2 font-bold ${!isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
            onClick={() => setIsSignUp(false)}
          >
            ログイン
          </button>
          <button
            type="button"
            className={`flex-1 py-2 font-bold ${isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
            onClick={() => setIsSignUp(true)}
          >
            新規登録
          </button>
        </div>

        {/* 入力フォーム */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          
          {/* 新規登録時のみ表示する「お名前」 */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-bold text-gray-700">お名前</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: 看護 花子"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700">メールアドレス</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">パスワード</label>
            <input
              type="password"
              required
              minLength={6}
              className="mt-1 block w-full rounded border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow"
          >
            {loading ? '処理中...' : (isSignUp ? 'この内容で登録する' : 'ログイン')}
          </button>
        </form>

      </div>
    </div>
  );
}