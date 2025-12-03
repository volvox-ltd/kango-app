'use client';

import Link from 'next/link';

export default function LoginPortal() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">
          KanGO! ログイン
        </h1>
        <p className="text-gray-600">利用するアカウントを選択してください</p>

        <div className="space-y-4">
          <Link 
            href="/login/nurse"
            className="block w-full py-4 bg-white border-2 border-blue-500 text-blue-600 rounded-xl shadow hover:bg-blue-50 transition text-lg font-bold"
          >
            💉 看護師として利用
          </Link>

          <Link 
            href="/login/hospital"
            className="block w-full py-4 bg-white border-2 border-orange-500 text-orange-600 rounded-xl shadow hover:bg-orange-50 transition text-lg font-bold"
          >
            🏥 病院・施設として利用
          </Link>
        </div>
      </div>
    </div>
  );
}