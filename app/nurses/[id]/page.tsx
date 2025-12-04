'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, MapPin, Briefcase, CheckCircle, ThumbsUp, ArrowLeft, FileText, Lock } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation'; // useParamsを使います
import Link from 'next/link';

export default function NurseProfilePage() {
  const params = useParams();
  const id = params?.id as string; // URLからIDを取得
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [nurse, setNurse] = useState<any>(null);
  const [thanksCount, setThanksCount] = useState(0);
  const [isMatched, setIsMatched] = useState(false);
  const [hospitalUser, setHospitalUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // 1. ログイン中の病院情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // ログインしていない場合
        setLoading(false);
        return; 
      }
      setHospitalUser(user);

      // 2. 看護師データ取得
      const { data: nurseData } = await supabase
        .from('nurses')
        .select('*')
        .eq('id', id)
        .single();

      if (nurseData) setNurse(nurseData);

      // 3. 「ありがとう」の数を集計
      const { count } = await supabase
        .from('nurse_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('nurse_id', id);
      
      if (count !== null) setThanksCount(count);

      // 4. 閲覧権限チェック (マッチング済みか？)
      // この病院(user.id)と、この看護師(id)の間で、確定(confirmed)か完了(completed)の案件があるか探す
      const { data: matchedApps } = await supabase
        .from('applications')
        .select('id, jobs!inner(hospital_id)')
        .eq('user_id', id)
        .eq('jobs.hospital_id', user.id)
        .in('status', ['confirmed', 'completed']);

      // 配列が1つ以上あれば「マッチング済み」とみなす
      if (matchedApps && matchedApps.length > 0) {
        setIsMatched(true);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  if (!hospitalUser) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">ログインが必要です</p>
        <Link href="/login" className="text-blue-600 underline">ログイン画面へ</Link>
      </div>
    );
  }

  if (!nurse) return <div className="p-8 text-center">ユーザーが見つかりません</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="bg-white p-2 rounded-full shadow text-gray-500 hover:bg-gray-50">
          <ArrowLeft size={20} />
        </button>
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
                <CheckCircle size={12} /> 免許証提出済
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded border border-pink-200">
              <ThumbsUp size={12} /> ありがとう {thanksCount}回
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

        {/* 免許証確認エリア (プライバシー保護付き) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
            <FileText size={18} className="text-blue-600" /> 免許証・資格
          </h3>
          
          {nurse.license_image_url ? (
            <div className="relative">
              {/* --- 画像本体 --- */}
              <div className={`bg-gray-100 rounded-lg overflow-hidden border border-gray-200 transition-all ${
                !isMatched ? 'blur-md pointer-events-none select-none opacity-50' : ''
              }`}>
                <a href={isMatched ? nurse.license_image_url : '#'} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={nurse.license_image_url} 
                    alt="License" 
                    className="w-full object-contain"
                  />
                </a>
              </div>

              {/* --- ロック画面 (未確定時のみ表示) --- */}
              {!isMatched && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center p-4">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg flex flex-col items-center">
                    <Lock className="text-gray-500 mb-2" size={32} />
                    <p className="font-bold text-gray-800 text-sm">プライバシー保護</p>
                    <p className="text-xs text-gray-500 mt-1">
                      採用確定（マッチング）後に<br/>閲覧可能になります
                    </p>
                  </div>
                </div>
              )}

              {isMatched && (
                <p className="text-[10px] text-gray-400 mt-1 text-center">タップで拡大表示</p>
              )}
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