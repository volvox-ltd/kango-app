'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, User } from 'lucide-react';

export default function MyPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [nurseProfile, setNurseProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. ログイン確認
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // 2. 自分のナース情報を取得
      const { data: nurseData } = await supabase
        .from('nurses')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (nurseData) {
        setNurseProfile(nurseData);
      }

      // 3. 自分の応募履歴を取得
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            hourly_wage,
            start_time,
            hospitals ( name )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      if (data) setApplications(data);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  // ★追加: ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // ログイン画面（ポータル）に戻る
    router.refresh();
  };

  const statusMap: { [key: string]: string } = {
    applied: '承認待ち',
    negotiating: '商談中',
    confirmed: '採用確定',
    rejected: '不採用',
    completed: '完了'
  };

  const colorMap: { [key: string]: string } = {
    applied: 'bg-gray-100 text-gray-600',
    negotiating: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-gray-800 text-white'
  };

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <main className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">マイページ</h1>
          {/* ★追加: ログアウトボタン */}
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 underline font-bold"
          >
            ログアウト
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
            <div className="flex gap-4 items-center">
            {/* アバター画像表示 */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border border-gray-100 flex-shrink-0">
                {nurseProfile?.avatar_url ? (
                <img src={nurseProfile.avatar_url} alt="icon" className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {/* Userアイコンのインポートが必要です: import { User, CheckCircle } from 'lucide-react'; */}
                    <User size={32} />
                </div>
                )}
            </div>

            <div>
                <p className="text-gray-600 text-xs mb-1">こんにちは</p>
                <p className="text-lg font-bold text-gray-800 leading-tight">
                {nurseProfile?.name || 'ゲスト'} さん
                </p>
                
                {/* ★ 免許証登録済バッジ ★ */}
                {nurseProfile?.license_image_url ? (
                <div className="mt-1 inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                    <CheckCircle size={12} />
                    免許証登録済
                </div>
                ) : (
                <p className="text-xs text-red-500 mt-1">未承認</p>
                )}
            </div>
            </div>

            <Link 
            href="/mypage/profile"
            className="text-xs bg-gray-100 border border-gray-300 px-3 py-1.5 rounded text-gray-600 hover:bg-gray-200 font-bold"
            >
            編集
            </Link>
        </div>
        
        {/* 免許証未登録アラート（登録済みなら表示しない） */}
        {!nurseProfile?.license_image_url && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-3 items-center animate-pulse">
            <div className="text-red-500 text-2xl">⚠️</div>
            <div className="flex-1">
                <p className="text-sm font-bold text-red-700">免許証が未登録です</p>
                <p className="text-xs text-red-600">お仕事に応募するには、プロフィール編集から免許証画像を登録してください。</p>
            </div>
            </div>
        )}
        </div>

        {/* ウォレット表示エリア */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg p-6 mb-6 text-white">
          <p className="text-sm opacity-90 mb-1">現在のウォレット残高</p>
          <p className="text-4xl font-bold">
            ¥{(nurseProfile?.wallet_balance || 0).toLocaleString()}
          </p>
          <div className="mt-4 text-right">
            <button className="bg-white text-blue-600 text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-100 transition">
              振込申請をする
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 text-gray-700">応募履歴</h2>

        {!applications || applications.length === 0 ? (
          <p className="text-gray-500">まだ応募したお仕事はありません。</p>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white p-5 rounded-lg shadow border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorMap[app.status] || 'bg-gray-100'}`}>
                    {statusMap[app.status] || app.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    応募日: {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* @ts-ignore */}
                <h3 className="font-bold text-lg mb-1">{app.jobs?.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {/* @ts-ignore */}
                  🏥 {Array.isArray(app.jobs?.hospitals) ? app.jobs.hospitals[0]?.name : app.jobs?.hospitals?.name}
                </p>

                <div className="flex gap-4 text-sm text-gray-500">
                  {/* @ts-ignore */}
                  <span>💰 ¥{app.jobs?.hourly_wage.toLocaleString()}</span>
                  {/* @ts-ignore */}
                  <span>📅 {new Date(app.jobs?.start_time).toLocaleDateString()}</span>
                </div>

                {/* ステータスに応じたアクションボタン */}
                {app.status === 'negotiating' && (
                  <Link 
                    href={`/chat/${app.id}`}
                    className="mt-4 block w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 text-center"
                  >
                    💬 チャットを開く
                  </Link>
                )}
                
                {(app.status === 'confirmed' || app.status === 'completed') && (
                  <Link 
                    href={`/chat/${app.id}`}
                    className="mt-4 block w-full bg-gray-100 text-gray-600 py-2 rounded font-bold hover:bg-gray-200 text-center border border-gray-300"
                  >
                    📄 チャット履歴
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← お仕事一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}