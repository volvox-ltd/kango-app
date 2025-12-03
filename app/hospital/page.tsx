'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HospitalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hospitalUser, setHospitalUser] = useState<any>(null);
  
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  // ★追加: ステータス日本語化辞書
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

    // 1. 自分の求人リスト
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('hospital_id', user.id)
      .order('created_at', { ascending: false });

    if (jobsData) setMyJobs(jobsData);

    // 2. 応募リスト
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

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('本当にこの求人を削除しますか？\n（※既に応募がある場合、応募データも消えます）')) return;

    const { error } = await supabase.from('jobs').delete().eq('id', jobId);

    if (error) {
      alert('削除に失敗しました: ' + error.message);
    } else {
      alert('求人を削除しました。');
      fetchData();
    }
  };

  // --- 応募処理 ---
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
          {myJobs.length === 0 ? (
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
                  {myJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(job.start_time).toLocaleDateString()} <br/>
                        {new Date(job.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}~
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        <Link href={`/jobs/${job.id}`} className="hover:underline hover:text-blue-600">
                          {job.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm">¥{job.hourly_wage.toLocaleString()}</td>
                      <td className="px-6 py-4 flex gap-2">
                        {/* ★追加: 編集ボタン */}
                        <Link 
                          href={`/hospital/edit/${job.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
                        >
                          編集
                        </Link>
                        <button 
                          onClick={() => handleDeleteJob(job.id)}
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
                        <div>{app.nurses?.name || '名無し'}</div>
                        <div className="text-xs text-gray-500">¥{(app.nurses?.wallet_balance || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        {/* ★変更: ステータスを日本語化 */}
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
                            <button onClick={() => handleComplete(app)} className="bg-orange-500 text-white px-3 py-1 rounded text-xs">業務完了</button>
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