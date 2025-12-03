'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // フォームの入力値を管理
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    hourlyWage: 2000,
    tags: ''
  });

  // 初期データ読み込み
  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setJobId(resolvedParams.id);

      // 求人データを取得
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error || !job) {
        alert('求人が見つかりませんでした');
        router.push('/hospital');
        return;
      }

      // 日付データの変換 (例: "2025-12-03T09:00:00+09:00")
      const start = new Date(job.start_time);
      const end = new Date(job.end_time);

      // フォーム用に整形 (YYYY-MM-DD, HH:mm)
      // ※ローカル時間での調整が面倒なので、簡易的にtoISOStringなどをスライスして使います
      // 日本時間環境前提で、簡易な文字列操作でやります
      const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString();
      };

      setFormData({
        title: job.title,
        description: job.description || '',
        date: toLocalISO(start).split('T')[0],
        startTime: toLocalISO(start).split('T')[1].substring(0, 5),
        endTime: toLocalISO(end).split('T')[1].substring(0, 5),
        hourlyWage: job.hourly_wage,
        tags: job.tags ? job.tags.join('、') : ''
      });
      
      setLoading(false);
    })();
  }, [params, router]);


  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('変更内容を保存しますか？')) return;
    
    setLoading(true);

    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    // Update処理
    const { error } = await supabase
      .from('jobs')
      .update({
        title: formData.title,
        description: formData.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        hourly_wage: parseInt(formData.hourlyWage as any),
        tags: formData.tags.split('、').map(t => t.trim())
      })
      .eq('id', jobId);

    if (error) {
      console.error(error);
      alert('更新に失敗しました: ' + error.message);
      setLoading(false);
    } else {
      alert('求人内容を更新しました！');
      router.push('/hospital'); // ダッシュボードに戻る
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">求人の編集</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* タイトル */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">求人タイトル</label>
            <input
              name="title"
              type="text"
              required
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              value={formData.title}
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
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              value={formData.description}
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
                value={formData.date}
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
                value={formData.startTime}
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
                value={formData.endTime}
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
                className="w-full border border-gray-300 p-2 rounded"
                value={formData.hourlyWage}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">特徴タグ (「、」区切り)</label>
              <input
                name="tags"
                type="text"
                className="w-full border border-gray-300 p-2 rounded"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr className="my-4" />

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition shadow-lg"
            >
              更新して保存する
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}