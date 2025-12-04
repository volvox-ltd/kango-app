'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Calendar, MapPin, Clock, CheckCircle, Navigation } from 'lucide-react';

export default function WorksPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorks = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('applications')
        .select(`
          *,
          jobs (
            *,
            hospitals ( name, address )
          )
        `)
        .eq('user_id', user.id);

      // タブによって取得するデータを変える
      if (activeTab === 'upcoming') {
        // 予定: 「採用確定(confirmed)」のもの
        query = query.eq('status', 'confirmed');
      } else {
        // 履歴: 「完了(completed)」のもの
        query = query.eq('status', 'completed');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) console.error(error);
      if (data) setJobs(data);
      setLoading(false);
    };

    fetchWorks();
  }, [activeTab]);

  // 日時フォーマット関数
  const formatDateTime = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return {
      date: s.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }),
      time: `${s.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 〜 ${e.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー＆タブ */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="p-4">
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Calendar className="text-blue-600" /> お仕事管理
          </h1>
        </div>
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'upcoming' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            これからの予定
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'past' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            完了したお仕事
          </button>
        </div>
      </div>

      {/* リスト表示 */}
      <div className="max-w-md mx-auto p-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-10">読み込み中...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>
              {activeTab === 'upcoming' 
                ? '予定されているお仕事はありません' 
                : 'まだ完了したお仕事はありません'}
            </p>
            <Link href="/" className="text-blue-600 underline mt-4 block">
              お仕事を探す
            </Link>
          </div>
        ) : (
          jobs.map((app) => {
            const { date, time } = formatDateTime(app.jobs.start_time, app.jobs.end_time);

            return (
              <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* ヘッダー帯 */}
                <div className={`px-4 py-2 text-white text-xs font-bold flex justify-between items-center ${
                  activeTab === 'upcoming' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  <span>{activeTab === 'upcoming' ? '本採用・勤務予定' : '業務完了'}</span>
                  <span>{date}</span>
                </div>

                <div className="p-4">
                  {/* @ts-ignore */}
                  <h3 className="font-bold text-lg mb-1">{app.jobs?.title}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-4">
                    <MapPin size={12} />
                    {/* @ts-ignore */}
                    <span>{app.jobs?.hospitals?.name}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock size={18} className="text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">勤務時間</p>
                        <p className="text-sm font-bold">{time}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Navigation size={18} className="text-red-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">アクセス</p>
                        {/* @ts-ignore */}
                        <p className="text-sm">{app.jobs?.hospitals?.address}</p>
                      </div>
                    </div>

                    {/* 完了タブの表示項目（レビューボタン追加） */}
                    {activeTab === 'past' && (
                      <div className="pt-2 border-t mt-2 space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle size={18} className="text-green-500 mt-0.5" />
                          <div className="w-full">
                            <p className="text-xs text-gray-400">獲得報酬</p>
                            <div className="flex justify-between items-end">
                              <p className="text-xl font-bold text-green-700">
                                ¥{(app.final_amount || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ★追加: レビューボタン */}
                        <div className="flex gap-2">
                          <Link 
                            href={`/jobs/review/${app.id}`} 
                            className="flex-1 bg-pink-50 text-pink-600 py-2 rounded-lg text-sm font-bold text-center border border-pink-200 hover:bg-pink-100 transition"
                          >
                            <span className="flex items-center justify-center gap-1">
                               病院をレビューする
                            </span>
                          </Link>
                          <Link href={`/chat/${app.id}`} className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-bold text-center border border-gray-200">
                            履歴
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 予定タブの時だけ出るボタン */}
                  {activeTab === 'upcoming' && (
                    <div className="mt-4 pt-4 border-t flex gap-2">
                       <Link 
                         href={`/chat/${app.id}`} 
                         className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-bold text-center hover:bg-blue-100"
                       >
                         メッセージ
                       </Link>
                       <Link 
                         href={`/jobs/${app.jobs.id}`} 
                         className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-bold text-center hover:bg-gray-100"
                       >
                         詳細確認
                       </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}