'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HospitalLoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false); // ログインか登録かの切り替え
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 新規登録用フィールド
  const [hospitalName, setHospitalName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [address, setAddress] = useState('');

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
      router.push('/hospital'); // 病院ダッシュボードへ
      router.refresh();
    }
  };

  // 新規登録処理（病院スペシャル版）
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Authユーザー作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setMessage('登録失敗: ' + (authError?.message || '不明なエラー'));
      setLoading(false);
      return;
    }

    // 2. プロフィール作成 (role = 'hospital')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ 
        id: authData.user.id, 
        email: email, 
        role: 'hospital' 
      }]);

    // 3. 病院情報作成
    const { error: hospitalError } = await supabase
      .from('hospitals')
      .insert([{ 
        id: authData.user.id, 
        name: hospitalName,
        manager_name: managerName,
        address: address
      }]);

    if (profileError || hospitalError) {
      console.error(profileError, hospitalError);
      setMessage('アカウントは作成されましたが、詳細情報の保存に失敗しました。');
    } else {
      setMessage('登録成功！自動的にログインします...');
      setTimeout(() => {
        router.push('/hospital');
        router.refresh();
      }, 1000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border-t-4 border-orange-500">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🏥 病院・施設ログイン
        </h2>

        {message && (
          <div className="p-4 rounded mb-4 bg-red-100 text-red-700 text-sm">
            {message}
          </div>
        )}

        {/* フォーム切り替えタブ */}
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 py-2 font-bold ${!isSignUp ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}
            onClick={() => setIsSignUp(false)}
          >
            ログイン
          </button>
          <button
            className={`flex-1 py-2 font-bold ${isSignUp ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}
            onClick={() => setIsSignUp(true)}
          >
            新規登録
          </button>
        </div>

        {/* 入力フォーム */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          
          {/* 新規登録時のみ表示する項目 */}
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700">施設名</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  placeholder="例: 〇〇クリニック"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">担当者名</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  placeholder="例: 山田 花子"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">住所</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  placeholder="例: 東京都渋谷区..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <hr className="my-4"/>
            </>
          )}

          {/* 共通項目 */}
          <div>
            <label className="block text-sm font-bold text-gray-700">メールアドレス</label>
            <input
              type="email"
              required
              className="mt-1 block w-full border border-gray-300 rounded p-2"
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
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded font-bold hover:bg-orange-700 transition shadow"
          >
            {loading ? '処理中...' : (isSignUp ? 'この内容で登録する' : 'ログイン')}
          </button>
        </form>
      </div>
    </div>
  );
}