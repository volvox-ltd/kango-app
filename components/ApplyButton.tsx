'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation'; // usePathnameを追加

export default function ApplyButton({ jobId, isApplied = false }: { jobId: string, isApplied?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'applied'>(isApplied ? 'applied' : 'idle');
  const router = useRouter();
  const pathname = usePathname(); // 現在のURLを取得

  const handleApply = async () => {
    setLoading(true);

    // 1. ログインチェック
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      if (confirm('応募するにはログインが必要です。\nログイン画面に移動しますか？')) {
        // ★修正: 現在のページのURLを「next」として持たせてログイン画面へ
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login/nurse?next=${returnUrl}`);
      }
      setLoading(false);
      return;
    }

    // 2. 応募処理
    const { error } = await supabase
      .from('applications')
      .insert([
        {
          job_id: jobId,
          user_id: session.user.id,
          status: 'applied'
        }
      ]);

    if (error) {
      if (error.code === '23505') { // 重複エラー
        setStatus('applied');
      } else {
        alert('エラーが発生しました: ' + error.message);
      }
    } else {
      setStatus('applied');
      router.refresh();
    }
    setLoading(false);
  };

  if (status === 'applied') {
    return (
      <button disabled className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        応募済み
      </button>
    );
  }

  return (
    <button
      onClick={handleApply}
      disabled={loading}
      className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-orange-600 transition transform active:scale-95 flex justify-center items-center gap-2"
    >
      {loading ? (
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
      ) : (
        'この求人に応募する'
      )}
    </button>
  );
}