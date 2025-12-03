import ApplyButton from '@/components/ApplyButton';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// URLの「id」を受け取って、その仕事の詳細を表示します
export default async function JobDetailPage({ params }: { params: { id: string } }) {
  // 1. URLからIDを取り出す（非同期で取得が必要な場合があります）
  const { id } = await params;

  // 2. そのIDを使って、Supabaseからデータを1件だけ取ってくる
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      hospitals ( name, address, manager_name )
    `)
    .eq('id', id) // IDが一致するものだけ
    .single();    // 1件だけ取得

  // エラーやデータがない場合
  if (error || !job) {
    return <div className="p-8">お仕事が見つかりませんでした。</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <main className="bg-white max-w-2xl w-full rounded-xl shadow-lg overflow-hidden">
        {/* ヘッダー画像エリア（仮） */}
        <div className="h-48 bg-blue-600 flex items-center justify-center text-white">
          <span className="text-2xl font-bold">🏥 病院・施設イメージ</span>
        </div>

        <div className="p-8">
          {/* タイトルとタグ */}
          <div className="mb-6">
            <span className="text-sm text-gray-500 mb-2 block">
              {/* @ts-ignore */}
              {job.hospitals?.name}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {job.title}
            </h1>
            <div className="flex gap-2">
              {job.tags?.map((tag: string) => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* 条件詳細 */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <span className="w-24 font-bold text-gray-600">💰 時給</span>
              <span className="text-xl font-bold text-blue-600">¥{job.hourly_wage.toLocaleString()}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 font-bold text-gray-600">📅 日時</span>
              <span>
                {new Date(job.start_time).toLocaleString('ja-JP')} 〜 <br/>
                {new Date(job.end_time).toLocaleTimeString('ja-JP')}
              </span>
            </div>
            <div className="flex items-start">
              <span className="w-24 font-bold text-gray-600">📍 場所</span>
              <span>
                {/* @ts-ignore */}
                {job.hospitals?.address}
              </span>
            </div>
            <div className="flex items-start">
              <span className="w-24 font-bold text-gray-600">📝 内容</span>
              <p className="flex-1 whitespace-pre-wrap text-gray-700">
                {job.description}
              </p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <Link href="/" className="flex-1 text-center py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              戻る
            </Link>
            {/* Job IDを渡してあげるのがポイントです */}
            <ApplyButton jobId={job.id} />
          </div>
        </div>
      </main>
    </div>
  );
}