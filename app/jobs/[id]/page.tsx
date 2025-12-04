import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ApplyButton from '@/components/ApplyButton';
import { MapPin, Clock, Calendar, AlertTriangle, FileText, CheckCircle, Navigation } from 'lucide-react';

// 常に最新データを表示
export const revalidate = 0;

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  // 1. まず表示しようとしている求人データを取得
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      hospitals ( name, address, website_url, description )
    `)
    .eq('id', id)
    .single();

  if (error || !job) {
    return <div className="p-8 text-center">お仕事が見つかりませんでした。</div>;
  }

  // 2. 同じグループ（同じ募集内容）の他の日程を探す
  let relatedJobs: any[] = [];
  if (job.group_id) {
    const { data } = await supabase
      .from('jobs')
      .select('id, start_time, end_time')
      .eq('group_id', job.group_id)
      .eq('status', 'open') // 募集中のみ
      .order('start_time', { ascending: true });
    
    if (data) relatedJobs = data;
  }

  // 日付フォーマット用関数
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}〜${e.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  const startDate = new Date(job.start_time);
  const dateStr = startDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = formatTime(job.start_time, job.end_time);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* --- 画像エリア --- */}
      <div className="w-full h-64 bg-gray-200 relative">
        {job.images && job.images.length > 0 ? (
          <img 
            src={job.images[0]} 
            alt="Main" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        <Link href="/" className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow text-sm font-bold z-10">
          ✕ 閉じる
        </Link>
      </div>

      {/* --- メイン情報 --- */}
      <div className="max-w-2xl mx-auto -mt-4 relative z-10 px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex gap-2 mb-2 flex-wrap">
            {job.benefits?.map((tag: string) => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h1>
          
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
            <MapPin size={16} />
            {/* @ts-ignore */}
            <span>{job.hospitals?.name}</span>
          </div>

          <div className="flex gap-4 border-t border-b py-4 mb-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">給与</p>
              <p className="text-xl font-bold text-blue-600">¥{job.hourly_wage.toLocaleString()}<span className="text-sm text-gray-500 font-normal">/時</span></p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">現在選択中の日時</p>
              <p className="text-sm font-bold text-gray-800">{dateStr}</p>
              <p className="text-sm text-gray-800">{timeStr}</p>
            </div>
          </div>

          {/* ★追加: 日程選択エリア */}
          {relatedJobs.length > 1 && (
            <div className="mb-2">
              <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                <Calendar size={14} /> 勤務日を変更する
              </p>
              <div className="flex flex-wrap gap-2">
                {relatedJobs.map((relJob) => {
                  const isCurrent = relJob.id === job.id;
                  return (
                    <Link
                      key={relJob.id}
                      href={`/jobs/${relJob.id}`}
                      className={`block text-center px-3 py-2 rounded-lg border text-sm transition-all ${
                        isCurrent 
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md transform scale-105' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="block text-xs opacity-90">{formatDate(relJob.start_time)}</span>
                      <span className="block font-bold">{
                        new Date(relJob.start_time).getHours()
                      }:{
                        new Date(relJob.start_time).getMinutes().toString().padStart(2, '0')
                      }〜</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* --- 業務詳細 --- */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4 space-y-6">
          <section>
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> 業務内容
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </section>

          {job.requirements && (
            <section>
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" /> 応募条件
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {job.requirements}
              </p>
            </section>
          )}

          {job.precautions && (
            <section>
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" /> 注意事項
              </h2>
              <div className="bg-orange-50 p-3 rounded text-sm text-orange-800 whitespace-pre-wrap">
                {job.precautions}
              </div>
            </section>
          )}

          {job.document_url && (
             <section>
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-gray-500" /> 関連資料
              </h2>
              <a href={job.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                資料を確認する
              </a>
            </section>
          )}
        </div>

        {/* --- 場所・アクセス --- */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Navigation size={18} className="text-red-500" /> 勤務地・アクセス
          </h2>
          {/* @ts-ignore */}
          <p className="text-sm font-bold text-gray-800 mb-1">{job.hospitals?.name}</p>
          {/* @ts-ignore */}
          <p className="text-sm text-gray-600 mb-2">{job.hospitals?.address}</p>
          
          {job.access_info && (
            <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded mt-2">
              📍 {job.access_info}
            </p>
          )}
          
          {/* 簡易的なGoogleマップリンクボタン */}
          {/* @ts-ignore */}
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.hospitals?.address || '')}`} 
             target="_blank" rel="noopener noreferrer"
             className="mt-4 block w-full border border-gray-300 text-center py-2 rounded text-sm text-gray-600 hover:bg-gray-50"
          >
            Googleマップで開く
          </a>
        </div>
      </div>

      {/* --- 固定フッター（応募ボタン） --- */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-4 items-center">
          <div className="flex-1">
             <p className="text-xs text-gray-500">時給</p>
             <p className="text-xl font-bold text-blue-600">¥{job.hourly_wage.toLocaleString()}</p>
          </div>
          <div className="flex-[2]">
             {/* 既存の応募ボタンコンポーネントを使用 */}
             <ApplyButton jobId={job.id} />
          </div>
        </div>
      </div>
    </div>
  );
}