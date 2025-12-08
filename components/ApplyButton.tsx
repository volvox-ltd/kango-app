'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation'; // usePathnameを追加

export default function ApplyButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'applied'>('idle');
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

    // 2. 応募処理 (既存のロジック)
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
        alert('すでに応募済みです。');
        setStatus('applied');
      } else {
        alert('エラーが発生しました: ' + error.message);
      }
    } else {
      alert('応募が完了しました！\n病院からの連絡をお待ちください。');
      setStatus('applied');
      router.refresh();
    }
    setLoading(false);
  };

  if (status === 'applied') {
    return (
      <button disabled className="w-full py-4 bg-gray-400 text-white rounded-xl font-bold text-lg cursor-not-allowed">
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
      {loading ? '処理中...' : 'この求人に応募する'}
    </button>
  );
}