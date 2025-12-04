'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MessageCircle, ChevronRight } from 'lucide-react';

export default function MessagesPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // チャットが発生するステータスの案件のみ取得
      const { data } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          updated_at,
          jobs ( title ),
          hospitals ( name )
        `)
        .eq('user_id', user.id)
        .in('status', ['negotiating', 'confirmed', 'completed']) // チャット可能なステータス
        .order('updated_at', { ascending: false });

      if (data) setRooms(data);
      setLoading(false);
    };

    fetchRooms();
  }, []);

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <h1 className="font-bold text-lg flex items-center gap-2">
          <MessageCircle className="text-blue-600" /> メッセージ
        </h1>
      </div>

      <div className="max-w-md mx-auto">
        {rooms.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>メッセージはありません</p>
            <p className="text-xs mt-2">応募が承認されるとここに表示されます</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {rooms.map((room) => (
              <Link 
                href={`/chat/${room.id}`} 
                key={room.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
              >
                {/* 病院アイコン（仮） */}
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                  {/* @ts-ignore */}
                  {room.hospitals?.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    {/* @ts-ignore */}
                    <h2 className="font-bold text-gray-800 truncate">{room.hospitals?.name}</h2>
                    <span className="text-[10px] text-gray-400">
                      {new Date(room.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  {/* @ts-ignore */}
                  <p className="text-xs text-gray-500 truncate mb-1">{room.jobs?.title}</p>
                  
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    room.status === 'negotiating' ? 'bg-blue-100 text-blue-700' :
                    room.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {room.status === 'negotiating' ? '商談中' : 
                     room.status === 'confirmed' ? '採用確定' : '完了'}
                  </span>
                </div>

                <ChevronRight size={16} className="text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}