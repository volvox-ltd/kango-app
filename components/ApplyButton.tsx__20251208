'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ApplyButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);

    // 1. ログインチェック
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (confirm('応募するにはログインが必要です。\nログイン画面に移動しますか？')) {
        router.push('/login');
      }
      setLoading(false);
      return;
    }

    // 2. 免許証登録チェック (ここが新機能！)
    const { data: nurse } = await supabase
      .from('nurses')
      .select('license_image_url')
      .eq('id', user.id)
      .single();

    if (!nurse?.license_image_url) {
      if (confirm('⚠️ 応募するには「看護師免許証」の登録が必要です。\n\nプロフィール編集画面で免許証をアップロードしますか？')) {
        router.push('/mypage/profile');
      }
      setLoading(false);
      return;
    }

    // 3. 応募意思の最終確認
    if (!confirm('この仕事に応募しますか？\n（病院担当者に通知が飛びます）')) {
      setLoading(false);
      return;
    }

    // 4. 重複チェック（念のため）
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .single();

    if (existingApp) {
      alert('既にこの仕事には応募済みです。');
      setLoading(false);
      return;
    }

    // 5. データ登録
    const { error } = await supabase
      .from('applications')
      .insert([
        {
          job_id: jobId,
          user_id: user.id,
          status: 'applied'
        }
      ]);

    if (error) {
      console.error(error);
      alert('エラーが発生しました: ' + error.message);
    } else {
      alert('応募が完了しました！\n病院からの承認をお待ちください。');
      router.push('/mypage'); // マイページへ誘導
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={handleApply}
      disabled={loading}
      className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? '確認中...' : 'この仕事に応募する'}
    </button>
  );
}