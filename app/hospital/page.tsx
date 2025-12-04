'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HospitalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hospitalUser, setHospitalUser] = useState<any>(null);
  
  // データ入れ物
  const [groupedMyJobs, setGroupedMyJobs] = useState<any[]>([]); // まとめた求人リスト
  const [applications, setApplications] = useState<any[]>([]); // 応募リスト

  // ステータス日本語化
  const statusMap: { [key: string]: string } = {
    applied: '承認待ち',
    negotiating: '商談中',
    confirmed: '採用確定',
    rejected: '不採用',
    completed: '完了'
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }
    setHospitalUser(user);

    // 1. 自分の求人リストを取得
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('hospital_id', user.id)
      .order('created_at', { ascending: false });

    if (jobsError) console.error(jobsError);

    // ★ここでグルーピング処理を行います
    if (jobsData) {
      const groups: { [key: string]: any } = {};
      jobsData.forEach((job) => {
        const key = job.group_id || job.id; // グループIDがない場合は自分自身をキーに
        if (!groups[key]) {
          groups[key] = {
            ...job,
            dates: [],
            count: 0
          };
        }
        groups[key].dates.push(job.start_time);
        groups[key].count++;
      });
      setGroupedMyJobs(Object.values(groups));
    }

    // 2. 応募リストを取得
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        nurses ( id, name, license_image_url, wallet_balance ),
        jobs!inner ( title, hourly_wage, start_time, end_time, hospital_id )
      `)
      .eq('jobs.hospital_id', user.id)
      .order('created_at', { ascending: false });

    if (appData) setApplications(appData);
    if (appError) console.error(appError);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // 求人削除機能（グループごと削除）
  const handleDeleteJobGroup = async (job: any) => {
    if (!confirm(`「${job.title}」の募集日程（全${job.count}件）をすべて削除しますか？\n※既に応募がある場合、それらも消えます。`)) return;

    // group_idがあればそれで、なければidで削除
    let query = supabase.from('jobs').delete();
    
    if (job.group_id) {
      query = query.eq('group_id', job.group_id);
    } else {
      query = query.eq('id', job.id);
    }

    const { error } = await query;

    if (error) {
      alert('削除に失敗しました: ' + error.message);
    } else {
      alert('求人を削除しました。');
      fetchData(); // 画面更新
    }
  };

  // --- 応募処理ロジック ---
  const handleApprove = async (appId: string) => {
    if (!confirm('承認してチャットを開始しますか？')) return;
    const { error } = await supabase.from('applications').update({ status: 'negotiating' }).eq('id', appId);
    if (!error) { alert('承認しました！'); fetchData(); }
  };

  const handleConfirm = async (appId: string) => {
    if (!confirm('採用確定しますか？')) return;
    const { error } = await supabase.from('applications').update({ status: 'confirmed' }).eq('id', appId);
    if (!error) { alert('採用確定しました！'); fetchData(); }
  };

  const handleComplete = async (app: any) => {
    if (!confirm('業務完了としますか？')) return;
    const start = new Date(app.jobs.start_time).getTime();
    const end = new Date(app.jobs.end_time).getTime();
    const durationHours = (end - start) / (1000 * 60 * 60);
    const totalAmount = Math.floor(app.jobs.hourly_wage * durationHours);
    
    try {
      const { error: appError } = await supabase.from('applications').update({ status: 'completed', final_amount: totalAmount }).eq('id', app.id);
      if (appError) throw appError;
      const { error: nurseError } = await supabase.from('nurses').update({ wallet_balance: (app.nurses.wallet_balance || 0) + totalAmount }).eq('id', app.nurses.id);
      if (nurseError) throw nurseError;
      alert(`業務完了！入金しました。`);
      fetchData();
    } catch (e: any) { console.error(e); alert('エラー: ' + e.message); }
  };

  if (loading) return <div className="p-8">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🏥 病院管理ダッシュボード</h1>
            <span className="text-sm text-gray-500 mt-1 block">ID: {hospitalUser?.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 text-sm font-bold underline">ログアウト</button>
            <Link href="/hospital/create" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-bold">＋ 新規求人を作成</Link>
          </div>
        </div>
        
        {/* ① 求人管理セクション */}
        <section>
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-l-4 border-blue-600 pl-3">
            📂 作成した求人リスト
          </h2>
          {groupedMyJobs.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded">まだ求人を作成していません。</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">求人タイトル</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">時給</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedMyJobs.map((group) => (
                    <tr key={group.id}>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {/* 日付をまとめて表示 */}
                        <div className="font-bold text-gray-700 mb-1">
                          全{group.count}日程
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {group.dates.slice(0, 5).map((d: string, i: number) => (
                            <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {new Date(d).toLocaleDateString()}
                            </span>
                          ))}
                          {group.count > 5 && <span className="text-xs">...他</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        <Link href={`/jobs/${group.id}`} className="hover:underline hover:text-blue-600">
                          {group.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm">¥{group.hourly_wage.toLocaleString()}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link 
                          href={`/hospital/edit/${group.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
                        >
                          編集
                        </Link>
                        <button 
                          onClick={() => handleDeleteJobGroup(group)}
                          className="text-red-500 hover:text-red-700 text-sm border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ② 応募者対応セクション */}
        <section>
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-l-4 border-orange-500 pl-3">
            🔔 届いている応募リスト
          </h2>
          {applications.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded">現在、対応が必要な応募はありません。</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">求人 / 応募日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">看護師</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-bold">{app.jobs?.title}</div>
                        <div className="text-xs text-gray-400">{new Date(app.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                            <Link href={`/nurses/${app.nurses.id}`} className="text-sm text-blue-600 font-bold hover:underline">
                            {app.nurses?.name || '名無し'}
                            </Link>
                        </div>
                        <div className="text-xs text-gray-500">¥{(app.nurses?.wallet_balance || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          app.status === 'completed' ? 'bg-gray-800 text-white' :
                          app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          app.status === 'negotiating' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {statusMap[app.status] || app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {app.status === 'applied' && <button onClick={() => handleApprove(app.id)} className="bg-blue-600 text-white px-3 py-1 rounded">承認する</button>}
                        {app.status === 'negotiating' && (
                          <div className="flex flex-col gap-2 items-start">
                            <Link href={`/chat/${app.id}`} className="text-blue-600 hover:underline text-xs font-bold flex items-center">💬 チャットを開く</Link>
                            <button onClick={() => handleConfirm(app.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs">採用確定</button>
                          </div>
                        )}
                        {app.status === 'confirmed' && (
                          <div className="flex flex-col gap-2 items-start">
                            <Link href={`/chat/${app.id}`} className="text-gray-500 text-xs">📄 ログを見る</Link>
                            <Link 
                            href={`/hospital/complete/${app.id}`}
                            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 shadow font-bold text-xs inline-block"
                            >
                            業務完了・報告
                            </Link>
                          </div>
                        )}
                        {app.status === 'completed' && <span className="text-green-600 font-bold">完了済 ✅</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}