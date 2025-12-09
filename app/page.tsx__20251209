'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Search, MapPin, Calendar, SlidersHorizontal, Clock, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [groupedJobs, setGroupedJobs] = useState<any[]>([]);

  const [filterDate, setFilterDate] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterPrefecture, setFilterPrefecture] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // 1. LIFFからのアクセスを検知
    const liffState = searchParams.get('liff.state');
    const nextParam = searchParams.get('next');

    if (liffState || nextParam) {
      setIsRedirecting(true);
      
      // 戻り先を特定
      let destination = '/mypage';
      if (nextParam) {
         destination = nextParam;
      } else if (liffState) {
         try {
           const decoded = decodeURIComponent(liffState);
           if (decoded.includes('next=')) {
              destination = decoded.split('next=')[1];
           }
         } catch (e) {
           console.error(e);
         }
      }

      console.log('Starting LIFF App Login...');

      const runLiffLogin = async () => {
        try {
          // LIFF SDKをロード
          const liff = (await import('@line/liff')).default;
          await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

          // ★ここが決定的な違いです★
          // APIルート(/api/auth/line)へリダイレクトするのではなく、
          // LIFF SDKの login() 関数を使って、アプリ内ブラウザの特権でログインします。
          // リダイレクト先(redirectUri)には、APIのコールバックURLを指定します。
          
          const callbackUrl = `${window.location.origin}/api/auth/line/callback?next=${encodeURIComponent(destination)}`;
          
          // これを実行すると、LINEアプリは「パスワード入力なし」で認証を通し、
          // 直接 callbackUrl へコードを持って移動します。
          liff.login({ redirectUri: callbackUrl });
          
        } catch (e) {
          console.error('LIFF Login Error:', e);
          setIsRedirecting(false);
        }
      };

      runLiffLogin();
    } else {
      fetchJobs();
    }
  }, [searchParams]);

  // ログイン処理中は画面を白くする
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-bold text-sm">LINEで認証中...</p>
      </div>
    );
  }

  // --- 以下、変更なし ---
  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  const fetchJobs = async () => {
    if (!loading && groupedJobs.length > 0) return; 
    
    let query = supabase
      .from('jobs')
      .select(`
        *,
        hospitals!inner ( name, address ),
        applications ( status )
      `)
      .eq('status', 'open')
      .order('start_time', { ascending: true });

    if (filterDate) { query = query.gte('start_time', `${filterDate}T00:00:00`); }
    if (filterKeyword) { query = query.ilike('title', `%${filterKeyword}%`); }
    if (filterPrefecture) { query = query.like('hospitals.address', `${filterPrefecture}%`); }

    const { data: jobs, error } = await query;

    if (error) console.error(error);
    
    if (jobs) {
      const groups: { [key: string]: any } = {};

      jobs.forEach((job) => {
        const key = job.group_id || job.id;
        const confirmedCount = job.applications?.filter((a: any) => 
          ['confirmed', 'completed'].includes(a.status)
        ).length || 0;
        const isFull = confirmedCount >= (job.capacity || 1);

        if (!groups[key]) {
          groups[key] = {
            ...job,
            dates: [],
            total_shifts: 0
          };
        }
        groups[key].dates.push({
          id: job.id,
          start: job.start_time,
          end: job.end_time,
          isFull: isFull
        });
        groups[key].total_shifts++;
      });
      setGroupedJobs(Object.values(groups));
    } else {
      setGroupedJobs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [filterDate, filterPrefecture]);

  const clearFilters = () => {
    setFilterDate('');
    setFilterKeyword('');
    setFilterPrefecture('');
    setLoading(true);
    fetchJobs();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold text-gray-800">KanGO!</h1>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="キーワード検索" 
                className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && { setLoading:true, fetchJobs:fetchJobs() }}
              />
            </div>
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2 rounded-full border relative ${
                showFilter || filterDate || filterPrefecture ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-600'
              }`}
            >
              <SlidersHorizontal size={20} />
              {(filterDate || filterPrefecture) && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
          {showFilter && (
            <div className="mt-3 pt-3 border-t animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">エリア（都道府県）</label>
                  <select 
                    className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-blue-500"
                    value={filterPrefecture}
                    onChange={(e) => setFilterPrefecture(e.target.value)}
                  >
                    <option value="">指定なし</option>
                    {prefectures.map((pref) => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">いつから働けますか？</label>
                  <input 
                    type="date" 
                    className="bg-gray-100 rounded-lg px-3 py-2 text-sm w-full"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button onClick={clearFilters} className="text-xs text-gray-500 underline flex items-center gap-1">
                    <X size={12} /> 条件をクリア
                  </button>
                  <button 
                    onClick={() => { setLoading(true); fetchJobs(); setShowFilter(false); }}
                    className="bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-md active:scale-95 transition"
                  >
                    検索する
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-md mx-auto p-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-10">読み込み中...</p>
        ) : groupedJobs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="font-bold mb-2">条件に合うお仕事がありません</p>
            <p className="text-sm">エリアや日付を変更して<br/>もう一度検索してみてください。</p>
            <button onClick={clearFilters} className="mt-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-bold">
              すべての求人を表示
            </button>
          </div>
        ) : (
          groupedJobs.map((group) => {
            const startDate = new Date(group.start_time);
            const endDate = new Date(group.end_time);
            const coverImage = (group.images && group.images.length > 0) 
              ? group.images[0] 
              : 'https://placehold.jp/300x200.png?text=No%20Image';
            const isAllFull = group.dates.every((d: any) => d.isFull);

            return (
              <Link href={`/jobs/${group.id}`} key={group.id} className="block group">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 group-active:scale-[0.98] transition-transform duration-100 relative">
                  <div className="relative h-32 w-full bg-gray-200 overflow-hidden">
                    {isAllFull && (
                      <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden z-20 pointer-events-none">
                        <div className="bg-gray-500 text-white text-xs font-bold absolute top-[12px] left-[-28px] w-[100px] text-center -rotate-45 py-1 shadow-md">
                          募集終了
                        </div>
                      </div>
                    )}
                    <img 
                      src={coverImage} 
                      alt={group.title} 
                      className={`w-full h-full object-cover transition duration-300 ${isAllFull ? 'grayscale opacity-70' : ''}`}
                    />
                    {!isAllFull && (
                      <div className="absolute bottom-2 right-2 bg-blue-600 text-white font-bold px-3 py-1 rounded-full shadow-md text-sm">
                        ¥{group.hourly_wage.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className={`font-bold text-lg leading-tight mb-2 line-clamp-2 ${isAllFull ? 'text-gray-500' : 'text-gray-800'}`}>
                      {group.title}
                    </h2>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                      <MapPin size={12} />
                      {/* @ts-ignore */}
                      <span className="line-clamp-1">{group.hospitals?.name} ({group.hospitals?.address})</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Calendar size={12} />
                        <span>募集日程 ({group.dates.length}件)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.dates.slice(0, 3).map((d: any) => (
                          <span 
                            key={d.id} 
                            className={`text-xs px-2 py-1 rounded border ${
                              d.isFull 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 line-through' 
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}
                          >
                            {new Date(d.start).getDate()}日{d.isFull ? '(満)' : ''}
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

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">読み込み中...</div>}>
      <HomeContent />
    </Suspense>
  );
}