'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Search, MapPin, Calendar, SlidersHorizontal, Clock } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [groupedJobs, setGroupedJobs] = useState<any[]>([]); // まとめた後のデータ

  const [filterDate, setFilterDate] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    
    // 1. まず全件取得（並び順は日付順）
    let query = supabase
      .from('jobs')
      .select(`
        *,
        hospitals ( name, address )
      `)
      .eq('status', 'open')
      .order('start_time', { ascending: true });

    if (filterDate) {
      query = query.gte('start_time', `${filterDate}T00:00:00`);
    }
    if (filterKeyword) {
      query = query.ilike('title', `%${filterKeyword}%`);
    }

    const { data: jobs, error } = await query;

    if (error) console.error(error);
    
    // 2. データを「グループ」でまとめる処理
    if (jobs) {
      const groups: { [key: string]: any } = {};

      jobs.forEach((job) => {
        // group_idがない古いデータは、自分のidをグループキーにする
        const key = job.group_id || job.id;

        if (!groups[key]) {
          // 初めて見るグループなら、親として登録
          groups[key] = {
            ...job,
            dates: [], // 日付リストを入れる箱を作る
            total_shifts: 0
          };
        }
        
        // そのグループの日付リストに追加
        groups[key].dates.push({
          id: job.id, // クリックした時のリンク先用にIDを保持
          start: job.start_time,
          end: job.end_time
        });
        groups[key].total_shifts++;
      });

      // オブジェクトを配列に戻す
      setGroupedJobs(Object.values(groups));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* ヘッダーエリア（変更なし） */}
      <header className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-800 mb-2">KanGO!</h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="エリア・駅・キーワード" 
                className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
              />
            </div>
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2 rounded-full border ${showFilter ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-600'}`}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
          {showFilter && (
            <div className="mt-3 pt-3 border-t animate-fade-in-down">
              <label className="text-xs font-bold text-gray-500 mb-1 block">日付で絞り込み</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="bg-gray-100 rounded-lg px-3 py-2 text-sm w-full"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                {filterDate && (
                  <button onClick={() => setFilterDate('')} className="text-xs text-gray-500 underline">クリア</button>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={() => { fetchJobs(); setShowFilter(false); }}
                  className="bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded-full"
                >
                  検索する
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --- 求人リスト（ここが大きく変わりました） --- */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-10">読み込み中...</p>
        ) : groupedJobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>条件に合うお仕事が見つかりませんでした。</p>
            <button onClick={() => {setFilterDate(''); setFilterKeyword(''); fetchJobs();}} className="mt-4 text-blue-600 underline">
              条件をクリアする
            </button>
          </div>
        ) : (
          groupedJobs.map((group) => {
            // 表示用の代表データ（グループの最初のデータ）
            const startDate = new Date(group.start_time);
            const endDate = new Date(group.end_time);
            
            const coverImage = (group.images && group.images.length > 0) 
              ? group.images[0] 
              : 'https://placehold.jp/300x200.png?text=No%20Image';

            // リンク先は、代表ID（とりあえず一番早い日程の詳細へ飛ぶ）
            // ※詳細ページ側で「他の日程」を選べるようにするのがベストですが、
            // 今は一旦代表ページへ飛ばします
            return (
              <Link href={`/jobs/${group.id}`} key={group.id} className="block group">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 group-active:scale-[0.98] transition-transform duration-100">
                  
                  {/* 画像エリア */}
                  <div className="relative h-32 w-full bg-gray-200">
                    <img src={coverImage} alt={group.title} className="w-full h-full object-cover" />
                    {/* ★追加: お気に入りボタン（右上） */}
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteButton jobId={group.id} />
                    </div>
                                      
                    {/* 右下: 時給 */}
                    <div className="absolute bottom-2 right-2 bg-blue-600 text-white font-bold px-3 py-1 rounded-full shadow-md text-sm">
                      ¥{group.hourly_wage.toLocaleString()}
                    </div>
                  </div>

                  {/* コンテンツエリア */}
                  <div className="p-4">
                    <h2 className="font-bold text-gray-800 text-lg leading-tight mb-2 line-clamp-2">
                      {group.title}
                    </h2>
                    
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                      <MapPin size={12} />
                      {/* @ts-ignore */}
                      <span className="line-clamp-1">{group.hospitals?.name}</span>
                    </div>

                    {/* ★ここが変更点：日付選択チップ */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Calendar size={12} />
                        <span>募集日程 ({group.dates.length}件)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {/* 最初の3件だけ表示 */}
                        {group.dates.slice(0, 3).map((d: any) => (
                          <span key={d.id} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border border-gray-200">
                            {new Date(d.start).getDate()}日
                          </span>
                        ))}
                        {group.dates.length > 3 && (
                          <span className="text-xs text-gray-400 self-center">他{group.dates.length - 3}件...</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                      <Clock size={16} className="text-orange-500" />
                      <span>
                        {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                        <span className="mx-1">〜</span> 
                        {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    {/* 待遇タグ */}
                    <div className="flex flex-wrap gap-1">
                      {group.benefits?.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>
              </Link>
            );
          })
        )}
      </main>
    </div>
  );
}