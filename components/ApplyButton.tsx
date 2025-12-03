'use client'; // ブラウザで動く部品

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // もしエラーが出る場合は '../lib/supabase' に
import { useRouter } from 'next/navigation';

export default function ApplyButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    // 1. 確認ダイアログ
    if (!confirm('この仕事に応募しますか？（相手に通知が飛びます）')) return;
    
    setLoading(true);

    // 2. ログイン中のユーザーを取得
    const { data: { user } } = await supabase.auth.getUser();

    // ログインしていなければログイン画面へ
    if (!user) {
      alert('応募するにはログインが必要です。');
      router.push('/login');
      return;
    }

    // 3. データ登録（applicationsテーブルに追加）
    const { error } = await supabase
      .from('applications')
      .insert([
        {
          job_id: jobId,
          user_id: user.id,
          status: 'applied' // 初期ステータス：承認待ち
        }
      ]);

    if (error) {
      console.error(error);
      alert('応募に失敗しました。既にこの仕事に応募済みかもしれません。');
    } else {
      alert('応募が完了しました！病院からの承認をお待ちください。');
      router.push('/'); // トップに戻る
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={handleApply}
      disabled={loading}
      className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition disabled:opacity-50"
    >
      {loading ? '処理中...' : 'この仕事に応募する'}
    </button>
  );
}