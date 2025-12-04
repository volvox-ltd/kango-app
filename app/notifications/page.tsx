'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Bell, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 既読にする処理
  const markAsRead = async (id: string, linkUrl: string | null) => {
    // DB更新（裏で実行して待たない）
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .then(() => fetchNotifications()); // 更新後に再取得

    // リンクがあれば遷移
    if (linkUrl) {
      router.push(linkUrl);
    }
  };

  // 全て既読にする
  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    
    fetchNotifications();
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Bell className="text-blue-600" /> お知らせ
          </h1>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllAsRead} className="text-xs text-blue-600 font-bold flex items-center gap-1">
            <Check size={14} /> 全て既読
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>お知らせはありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => markAsRead(n.id, n.link_url)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition ${!n.is_read ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-red-500' : 'bg-transparent'}`}></div>
                  <div className="flex-1">
                    <p className={`text-sm mb-1 ${!n.is_read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2 text-right">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}