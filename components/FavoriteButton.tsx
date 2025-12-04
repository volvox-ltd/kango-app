'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart } from 'lucide-react';

export default function FavoriteButton({ jobId }: { jobId: string }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 初期状態チェック
  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .single();
      
      if (data) setIsFavorited(true);
    };
    checkStatus();
  }, [jobId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // 親リンクへの遷移を防ぐ
    e.stopPropagation();

    if (!userId) {
      alert('お気に入り機能を使うにはログインが必要です');
      return;
    }
    if (loading) return;
    setLoading(true);

    if (isFavorited) {
      // 削除（解除）
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId);
      
      if (!error) setIsFavorited(false);
    } else {
      // 追加
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, job_id: jobId }]);
      
      if (!error) setIsFavorited(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full transition-all active:scale-90 ${
        isFavorited ? 'bg-pink-100 text-pink-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      }`}
    >
      <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
    </button>
  );
}