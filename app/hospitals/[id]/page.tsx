import { supabase } from '@/lib/supabase';
import { MapPin, Building2, Globe, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function HospitalProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;

  // 1. 病院データ取得
  const { data: hospital } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', id)
    .single();

  if (!hospital) return <div className="p-8">病院が見つかりません</div>;

  // 2. レビュー集計 (Good/Bad)
  // Goodの数
  const { count: goodCount } = await supabase
    .from('hospital_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', id)
    .eq('is_good', true);

  // Badの数
  const { count: badCount } = await supabase
    .from('hospital_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', id)
    .eq('is_good', false);

  // 3. 現在募集中の求人
  const { data: activeJobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('hospital_id', id)
    .eq('status', 'open')
    .order('start_time', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      {/* ヘッダー画像 */}
      <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden mb-6 relative">
        {hospital.images && hospital.images.length > 0 ? (
          <img src={hospital.images[0]} alt="hospital" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Building2 size={48} />
          </div>
        )}
        <Link href="/" className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow text-gray-500">
          <ArrowLeft size={20} />
        </Link>
      </div>

      <div className="max-w-md mx-auto space-y-8">
        
        {/* 基本情報 */}
        <section>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{hospital.name}</h1>
          <div className="flex items-center gap-1 text-gray-600 text-sm mb-4">
            <MapPin size={16} />
            <span>{hospital.address}</span>
          </div>

          {/* レビューバッジ */}
          <div className="flex gap-3 mb-6">
            <div className="bg-pink-50 text-pink-600 border border-pink-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <ThumbsUp size={16} />
              <span className="font-bold">{goodCount || 0}</span>
            </div>
            <div className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <ThumbsDown size={16} />
              <span className="font-bold">{badCount || 0}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {hospital.description || '紹介文はまだありません。'}
          </div>

          {hospital.website_url && (
            <a 
              href={hospital.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm font-bold"
            >
              <Globe size={16} /> 公式サイト
            </a>
          )}
        </section>

        {/* 募集中の求人リスト */}
        <section>
          <h2 className="font-bold text-gray-800 text-lg mb-4 border-l-4 border-blue-600 pl-3">
            募集中の求人
          </h2>
          {!activeJobs || activeJobs.length === 0 ? (
            <p className="text-gray-500 text-sm">現在募集中の求人はありません。</p>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <Link href={`/jobs/${job.id}`} key={job.id} className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800 line-clamp-1">{job.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(job.start_time).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-bold text-blue-600">¥{job.hourly_wage.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}