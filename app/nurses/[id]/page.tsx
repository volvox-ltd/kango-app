import { supabase } from '@/lib/supabase';
import { User, MapPin, Briefcase, CheckCircle, ThumbsUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NurseProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;

  // 1. 看護師データ取得
  const { data: nurse } = await supabase
    .from('nurses')
    .select('*')
    .eq('id', id)
    .single();

  if (!nurse) return <div className="p-8">ユーザーが見つかりません</div>;

  // 2. 「ありがとう」の数を集計
  const { count: thanksCount } = await supabase
    .from('nurse_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('nurse_id', id);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/hospital" className="bg-white p-2 rounded-full shadow text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-lg text-gray-700">応募者プロフィール</h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        
        {/* 基本情報カード */}
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
          
          {/* 実績バッジ */}
          <div className="flex justify-center gap-3 mt-3">
            {nurse.license_image_url && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200">
                <CheckCircle size={12} /> 免許証確認済
              </span>
            )}
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

      </div>
    </div>
  );
}