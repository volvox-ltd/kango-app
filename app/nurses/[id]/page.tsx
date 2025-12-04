import { supabase } from '@/lib/supabase';
import { User, MapPin, Briefcase, CheckCircle, ThumbsUp, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function NurseProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const { data: nurse } = await supabase
    .from('nurses')
    .select('*')
    .eq('id', id)
    .single();

  if (!nurse) return <div className="p-8">ユーザーが見つかりません</div>;

  const { count: thanksCount } = await supabase
    .from('nurse_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('nurse_id', id);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/hospital" className="bg-white p-2 rounded-full shadow text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-lg text-gray-700">応募者プロフィール</h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        
        {/* 基本情報 */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">
            {nurse.avatar_url ? (
              <img src={nurse.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={40} />
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{nurse.name}</h2>
          
          <div className="flex justify-center gap-3 mt-3">
            <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded border border-pink-200">
              <ThumbsUp size={12} /> ありがとう {thanksCount || 0}回
            </span>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="text-gray-400 mt-1" size={18} />
            <div>
              <p className="text-xs text-gray-400">最寄駅</p>
              <p className="font-bold text-gray-700">{nurse.nearest_station || '未登録'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase className="text-gray-400 mt-1" size={18} />
            <div>
              <p className="text-xs text-gray-400">臨床経験</p>
              <p className="font-bold text-gray-700">
                {nurse.clinical_experience ? `${nurse.clinical_experience}年` : '未登録'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-400 mb-2">自己紹介</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {nurse.self_introduction || '自己紹介はまだありません。'}
            </p>
          </div>
        </div>

        {/* ★追加: 免許証確認エリア */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
            <FileText size={18} className="text-blue-600" /> 免許証・資格
          </h3>
          
          {nurse.license_image_url ? (
            <div>
              <p className="text-xs text-gray-500 mb-2">提出された画像:</p>
              <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <a href={nurse.license_image_url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={nurse.license_image_url} 
                    alt="License" 
                    className="w-full object-contain hover:scale-105 transition duration-300 cursor-zoom-in"
                  />
                </a>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-center">タップで拡大表示</p>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-gray-400 text-sm">画像が登録されていません</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}