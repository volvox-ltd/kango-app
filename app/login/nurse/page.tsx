'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NurseLoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false); // タブ切り替え用
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ★修正: LINEログイン処理 (OpenID Connect方式に戻す)
  const handleLineLogin = async () => {
    setLoading(true);
    
    // Auth0のドメイン（例: dev-xxxxx.us.auth0.com）を自分で設定する必要があります
    // ユーザーが入力したドメインに合わせてください
    const AUTH0_DOMAIN = "kango.jp.auth0.com"; 

    const { data, error } = await supabase.auth.signInWithOAuth({
    // ★providerを'oidc'に戻します
    // @ts-ignore
    provider: 'oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // Auth0のLINE接続に飛ぶための設定
          connection: 'line', 
          // どのAuth0アカウントを使うかを明示
          iss: AUTH0_DOMAIN
        },
      },
    });

    if (error) {
      alert('LINEログインエラー: ' + error.message);
      setLoading(false);
    }
  };


  // ... (その他のログイン/登録処理は省略)

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          💉 看護師ログイン
        </h2>
        
        {/* ★LINEログインボタン */}
        <button
          onClick={handleLineLogin}
          className="w-full bg-[#06C755] text-white font-bold py-3 rounded-lg shadow hover:bg-[#05b34c] transition mb-6 flex items-center justify-center gap-2"
        >
          <span className="text-xl font-black">LINE</span> でログイン / 登録
        </button>
        
        {/* ... (メールアドレスログインフォームは省略) */}

      </div>
    </div>
  );
}