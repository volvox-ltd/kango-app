'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // フォームの入力値を管理
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',        // 日付
    startTime: '',   // 開始時間
    endTime: '',     // 終了時間
    hourlyWage: 2000,
    tags: ''         // カンマ区切りで入力させる
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. 日時のデータを結合して、Timestamp形式にする
    // (例: 2025-12-10 と 09:00 -> 2025-12-10T09:00:00)
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    // 2. ログイン中の病院ユーザーを取得
    // ※今回は簡易的に「現在ログインしているユーザー」を病院として扱います
    // 本来は病院としてログインしているかチェックが必要です
    const { data: { user } } = await supabase.auth.getUser();
    
    // (開発用: もしログインしてなければ、さっきのテスト病院IDを強制使用する裏技)
    // 今回は簡単のため、ユーザーがいればそのIDを使います
    const hospitalId = user ? user.id : '00000000-0000-0000-0000-000000000001'; 

    // 3. Supabaseに保存
    const { error } = await supabase
      .from('jobs')
      .insert([
        {
          hospital_id: hospitalId,
          title: formData.title,
          description: formData.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          hourly_wage: parseInt(formData.hourlyWage as any),
          tags: formData.tags.split('、').map(t => t.trim()), // 「、」で区切って配列にする
          status: 'open'
        }
      ]);

    if (error) {
      console.error(error);
      alert('登録に失敗しました: ' + error.message);
    } else {
      alert('求人を公開しました！');
      router.push('/hospital'); // ダッシュボードに戻る
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">新規求人の作成</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* タイトル */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">求人タイトル</label>
            <input
              name="title"
              type="text"
              required
              placeholder="例: 午前中の健診介助スタッフ"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              onChange={handleChange}
            />
          </div>

          {/* 業務詳細 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">業務内容</label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="詳しい業務内容や持ち物などを入力してください"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              onChange={handleChange}
            />
          </div>

          {/* 日時設定エリア */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">日付</label>
              <input
                name="date"
                type="date"
                required
                className="w-full border border-gray-300 p-2 rounded"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">開始時間</label>
              <input
                name="startTime"
                type="time"
                required
                className="w-full border border-gray-300 p-2 rounded"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">終了時間</label>
              <input
                name="endTime"
                type="time"
                required
                className="w-full border border-gray-300 p-2 rounded"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* 時給とタグ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">時給 (円)</label>
              <input
                name="hourlyWage"
                type="number"
                required
                min={1000}
                defaultValue={2000}
                className="w-full border border-gray-300 p-2 rounded"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">特徴タグ (「、」区切り)</label>
              <input
                name="tags"
                type="text"
                placeholder="例: 採血あり、駅チカ"
                className="w-full border border-gray-300 p-2 rounded"
                onChange={handleChange}
              />
            </div>
          </div>

          <hr className="my-4" />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition shadow-lg"
          >
            {loading ? '登録中...' : 'この内容で募集を開始する'}
          </button>

        </form>
      </div>
    </div>
  );
}