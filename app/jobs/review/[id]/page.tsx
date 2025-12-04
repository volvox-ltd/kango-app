'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { use } from 'react'; // Next.js 15+

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Next.js 15以降の非同期params対応
  const { id } = use(params);

  const [isGood, setIsGood] = useState(true);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    
    // 1. applicationデータから必要なIDを取得
    const { data: app } = await supabase
      .from('applications')
      .select('user_id, job_id, jobs(hospital_id)')
      .eq('id', id)
      .single();

    if (!app) {
      alert('エラー: データが見つかりませんでした');
      setLoading(false);
      return;
    }

    // ★修正: jobsが配列で返ってくる場合に備えて、安全に取り出す
    // @ts-ignore
    const hospitalId = Array.isArray(app.jobs) ? app.jobs[0]?.hospital_id : app.jobs?.hospital_id;

    if (!hospitalId) {
      alert('エラー: 病院情報が取得できませんでした');
      setLoading(false);
      return;
    }

    // 2. レビューを保存
    const { error } = await supabase
      .from('hospital_reviews')
      .insert([{
        hospital_id: hospitalId,
        nurse_id: app.user_id,
        job_id: app.job_id,
        is_good: isGood,
        comment: comment
      }]);

    if (error) {
      alert('エラー: ' + error.message);
    } else {
      alert('レビューを送信しました！ありがとうございます。');
      router.push('/works');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
        <h1 className="text-xl font-bold text-center mb-2">お仕事の振り返り</h1>
        <p className="text-sm text-center text-gray-500 mb-8">今回の職場はいかがでしたか？</p>

        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={() => setIsGood(true)}
            className={`flex-1 py-6 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
              isGood ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-400'
            }`}
          >
            <ThumbsUp size={32} />
            <span className="font-bold">Good</span>
          </button>
          <button
            onClick={() => setIsGood(false)}
            className={`flex-1 py-6 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
              !isGood ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'
            }`}
          >
            <ThumbsDown size={32} />
            <span className="font-bold">Bad</span>
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">コメント（任意）</label>
          <textarea
            className="w-full border p-3 rounded-lg bg-gray-50"
            rows={4}
            placeholder="職場の雰囲気や良かった点など..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '送信中...' : 'レビューを送信して終了'}
        </button>
        
        <button onClick={() => router.back()} className="w-full text-center text-gray-400 text-sm mt-4">
          あとでする
        </button>
      </div>
    </div>
  );
}