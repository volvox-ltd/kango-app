// @/lib/supabase が読み込めない場合は、 '../lib/supabase' に書き換えてみてください
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 0;
// これがトップページの画面です
export default async function Home() {
  // 1. データベースから「jobs」テーブルの中身を取得（ついでに病院名も）
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      hospitals ( name )
    `);

  // エラーがあったらコンソールに表示
  if (error) {
    console.error('データ取得エラー:', error);
  }

  // 2. 画面を作って返す（HTMLのようなもの）
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <main className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          KanGO!
        </h1>
        <Link href="/mypage" className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full transition">
          マイページ
        </Link>
      </div>

        {/* データがない場合 */}
        {!jobs || jobs.length === 0 ? (
          <p className="text-gray-600">現在募集中のお仕事はありません。</p>
        ) : (
          /* データがある場合、カードを表示 */
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm text-gray-500 mb-1 block">
                      {/* 関連データは配列かオブジェクトで来るので安全に表示 */}
                      🏥 {Array.isArray(job.hospitals) ? job.hospitals[0]?.name : job.hospitals?.name}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {job.title}
                    </h2>
                    <div className="flex gap-2 mb-3">
                      {job.tags?.map((tag: string) => (
                        <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ¥{job.hourly_wage.toLocaleString()}
                      <span className="text-sm text-gray-500 font-normal">/時</span>
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                  {job.description}
                </p>
                <Link 
                  href={`/jobs/${job.id}`} 
                  className="mt-4 block w-full bg-blue-600 text-white py-2 rounded-md font-bold hover:bg-blue-700 transition text-center"
                >
                  詳細を見る
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}