'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ChatPage({ params }: { params: { id: string } }) {
  // Promise形式のparamsをアンラップ（Next.jsの最新仕様対応）
  const [applicationId, setApplicationId] = useState<string>('');

  useEffect(() => {
    // paramsの解決を待つ
    (async () => {
      const resolvedParams = await params;
      setApplicationId(resolvedParams.id);
    })();
  }, [params]);

  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 初回読み込み
  useEffect(() => {
    if (!applicationId) return; // IDがまだなければ何もしない

    const fetchMessages = async () => {
      // 1. ユーザー確認
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // 2. メッセージ履歴を取得（古い順）
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();
    
    // ※本来はここでリアルタイム受信の設定（Subscribe）をしますが、
    // 今回はシンプルにするため「リロードで更新」または「送信時に更新」とします。
  }, [applicationId, router]);

  // メッセージ送信処理
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // 1. データベースに保存
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          application_id: applicationId,
          sender_id: user.id,
          content: newMessage
        }
      ]);

    if (error) {
      alert('送信エラー');
    } else {
      // 2. 画面のリストにも即座に追加（擬似的にリアルタイム風に見せる）
      setMessages([...messages, {
        id: Math.random(), // 仮ID
        sender_id: user.id,
        content: newMessage,
        created_at: new Date().toISOString()
      }]);
      setNewMessage(''); // 入力欄を空にする
    }
  };

  if (loading) return <div className="p-4 text-center">読み込み中...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-blue-600 font-bold">
          &lt; 戻る
        </button>
        <h1 className="font-bold text-gray-700">チャットルーム</h1>
        <div className="w-10"></div>{/* レイアウト調整用の空き */}
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">
            メッセージはまだありません。<br/>挨拶を送ってみましょう！
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                  isMe 
                    ? 'bg-green-500 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 text-right ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 入力エリア */}
      <div className="bg-white p-4 border-t sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-green-500"
            placeholder="メッセージを入力..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-green-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-green-700 shadow"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}