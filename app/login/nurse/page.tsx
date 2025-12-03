'use client'; // これはお客様（ブラウザ）側で動く部品です、という宣言

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ログイン処理
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
      // 成功したらトップページへ
      router.push('/');
      router.refresh(); // 画面を更新
    }
  };

  // 新規登録処理
  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');

    // 1. Auth（ログイン機能）にユーザー登録
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMessage('登録失敗: ' + authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. profilesテーブルにもデータを追加（これが重要！）
      // ※トリガーを設定していないので、手動で入れます
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: authData.user.id, 
            email: email, 
            role: 'nurse' // デフォルトは看護師
          }
        ]);

      // 3. 看護師テーブル（nurses）の枠も作っておく
      const { error: nurseError } = await supabase
        .from('nurses')
        .insert([
          { 
            id: authData.user.id, 
            name: '未設定のナース', 
          }
        ]);

      if (profileError || nurseError) {
         console.error(profileError, nurseError);
         setMessage('アカウントは作成されましたが、プロフィールの作成に失敗しました。');
      } else {
         setMessage('登録成功！自動的にログインします...');
         // 少し待ってからトップへ
         setTimeout(() => {
           router.push('/');
           router.refresh();
         }, 1000);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          KanGO! ログイン
        </h2>

        {message && (
          <div className={`p-4 rounded mb-4 text-sm ${message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">パスワード</label>
            <input
              type="password"
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-bold"
          >
            {loading ? '処理中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">アカウントをお持ちでない方</p>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            新規登録（Sign Up）はこちら
          </button>
        </div>
      </div>
    </div>
  );
}