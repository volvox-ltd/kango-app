'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MapPin, Heart, ArrowLeft } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';

export default function FavoritesPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // favoritesテーブルを経由してjobsを取得
      // ※Supabaseの結合クエリを使います
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          job_id,
          jobs (
            *,
            hospitals ( name, address )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      
      // データ構造を整形（jobsをフラットに取り出す）
      if (data) {
        // @ts-ignore
        const formattedJobs = data.map(item => item.jobs).filter(job => job !== null);
        setJobs(formattedJobs);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, []);

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <h1 className="font-bold text-lg flex items-center gap-2">
          <Heart className="text-pink-500" fill="currentColor" /> お気に入り
        </h1>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Heart size={48} className="mx-auto mb-4 opacity-20" />
            <p>お気に入りの求人はありません</p>
            <Link href="/" className="text-blue-600 underline mt-4 block">
              お仕事を探す
            </Link>
          </div>
        ) : (
          jobs.map((job) => {
            const coverImage = (job.images && job.images.length > 0) 
              ? job.images[0] 
              : 'https://placehold.jp/300x200.png?text=No%20Image';

            return (
              <Link href={`/jobs/${job.id}`} key={job.id} className="block group">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex h-28">
                  
                  {/* 画像（左側） */}
                  <div className="w-28 h-full bg-gray-200 relative flex-shrink-0">
                    <img src={coverImage} alt={job.title} className="w-full h-full object-cover" />
                  </div>

                  {/* コンテンツ（右側） */}
                  <div className="flex-1 p-3 flex flex-col justify-between relative">
                    {/* お気に入りボタン */}
                    <div className="absolute top-2 right-2">
                      <FavoriteButton jobId={job.id} />
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2 pr-6">
                        {job.title}
                      </h2>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin size={10} />
                        {/* @ts-ignore */}
                        <span className="line-clamp-1">{job.hospitals?.name}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="text-blue-600 font-bold text-lg">
                        ¥{job.hourly_wage.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(job.start_time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}