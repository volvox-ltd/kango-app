'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, Wallet, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'billing'>('withdrawals');
  
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [billings, setBillings] = useState<any[]>([]);

  // データ取得
  const fetchData = async () => {
    setLoading(true);
    
    // 1. Admin権限チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      alert('権限がありません');
      router.push('/');
      return;
    }

    // 2. 振込申請リスト (申請中のみ)
    const { data: withdrawData } = await supabase
      .from('withdrawals')
      .select(`*, nurses(name, bank_name, branch_name, account_type, account_number, account_holder)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (withdrawData) setWithdrawals(withdrawData);

    // 3. 請求計算 (今月の完了案件を集計)
    const { data: apps } = await supabase
      .from('applications')
      .select(`*, jobs(hospital_id), hospitals(name)`)
      .eq('status', 'completed');

    if (apps) {
      // 病院ごとの合計を計算
      const billingMap: {[key: string]: {name: string, total: number, count: number}} = {};
      apps.forEach(app => {
        // @ts-ignore
        const hId = app.jobs.hospital_id;
        // @ts-ignore
        const hName = app.hospitals?.name;
        const amount = app.final_amount || 0;

        if (!billingMap[hId]) {
          billingMap[hId] = { name: hName, total: 0, count: 0 };
        }
        billingMap[hId].total += amount;
        billingMap[hId].count += 1;
      });
      setBillings(Object.values(billingMap));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // 振込完了処理
  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('振込完了としてマークしますか？')) return;
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'paid' })
      .eq('id', id);
    
    if (!error) {
      alert('処理しました');
      fetchData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="text-red-600" /> 運営管理 (ファイナンス)
          </h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 underline flex items-center gap-1">
            <LogOut size={16} /> ログアウト
          </button>
        </div>

        {/* タブメニュー */}
        <div className="flex gap-4 mb-6 border-b border-gray-300 pb-1">
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 font-bold rounded-t-lg ${activeTab === 'withdrawals' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="flex items-center gap-2"><Wallet size={18}/> 振込申請 ({withdrawals.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 font-bold rounded-t-lg ${activeTab === 'billing' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="flex items-center gap-2"><Building2 size={18}/> 請求管理</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow min-h-[400px]">
          
          {/* === 1. 振込申請タブ === */}
          {activeTab === 'withdrawals' && (
            <div className="p-6">
              <h2 className="font-bold text-lg mb-4">振込待ちリスト</h2>
              {withdrawals.length === 0 ? <p className="text-gray-400">現在、申請はありません。</p> : (
                <div className="space-y-4">
                  {withdrawals.map((req) => (
                    <div key={req.id} className="border p-4 rounded-lg flex justify-between items-center bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg">{req.nurses?.name}</span>
                          <span className="text-sm text-gray-500">{new Date(req.created_at).toLocaleDateString()} 申請</span>
                        </div>
                        <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                          <p>銀行: {req.bank_info?.bank} / {req.bank_info?.branch}</p>
                          <p>口座: {req.bank_info?.number} ({req.bank_info?.account_type || '普通'})</p>
                          <p>名義: {req.nurses?.account_holder}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600 mb-2">¥{req.amount.toLocaleString()}</p>
                        <button 
                          onClick={() => handleMarkAsPaid(req.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow"
                        >
                          振込完了にする
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === 2. 請求管理タブ === */}
          {activeTab === 'billing' && (
            <div className="p-6">
              <h2 className="font-bold text-lg mb-4">病院別 請求予定額 (完了案件ベース)</h2>
              {billings.length === 0 ? <p className="text-gray-400">請求データはありません。</p> : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-sm text-gray-500">
                      <th className="p-3">病院名</th>
                      <th className="p-3">件数</th>
                      <th className="p-3">ユーザー報酬計</th>
                      <th className="p-3">手数料 (30%)</th>
                      <th className="p-3">請求総額 (税込)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billings.map((bill, idx) => {
                      const commission = Math.floor(bill.total * 0.3); // 30%手数料
                      const totalBill = Math.floor((bill.total + commission) * 1.1); // +消費税
                      return (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-bold">{bill.name}</td>
                          <td className="p-3">{bill.count}件</td>
                          <td className="p-3">¥{bill.total.toLocaleString()}</td>
                          <td className="p-3 text-gray-600">+¥{commission.toLocaleString()}</td>
                          <td className="p-3 font-bold text-lg text-blue-600">¥{totalBill.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-gray-400 mt-4 text-right">※この画面は簡易集計です。</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}