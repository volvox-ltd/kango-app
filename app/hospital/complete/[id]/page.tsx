'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// ★追加: ThumbsUp アイコン
import { Clock, Calculator, ArrowLeft, CheckCircle, ThumbsUp } from 'lucide-react';

export default function CompleteJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [appId, setAppId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<any>(null);

  // 実績入力フォーム
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  
  // ★追加: ありがとう送信フラグ
  const [sendThanks, setSendThanks] = useState(true);

  // データ取得
  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setAppId(resolvedParams.id);

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs ( title, hourly_wage, start_time, end_time, hospital_id ),
          nurses ( id, name, wallet_balance )
        `)
        .eq('id', resolvedParams.id)
        .single();

      if (error || !data) {
        alert('データが見つかりませんでした');
        router.push('/hospital');
        return;
      }

      setApplication(data);

      // 初期値は「予定時間」を入れる
      const toLocalInput = (isoStr: string) => {
        const date = new Date(isoStr);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
      };

      setActualStart(toLocalInput(data.jobs.start_time));
      setActualEnd(toLocalInput(data.jobs.end_time));
      
      setLoading(false);
    })();
  }, [params, router]);

  // 金額の自動再計算
  useEffect(() => {
    if (application && actualStart && actualEnd) {
      const start = new Date(actualStart).getTime();
      const end = new Date(actualEnd).getTime();
      
      const diffHours = (end - start) / (1000 * 60 * 60);
      
      if (diffHours > 0) {
        const amount = Math.floor(application.jobs.hourly_wage * diffHours);
        setTotalAmount(amount);
      } else {
        setTotalAmount(0);
      }
    }
  }, [actualStart, actualEnd, application]);

  // 確定処理
  const handleSubmit = async () => {
    if (!confirm(`以下の内容で確定し、報酬 ¥${totalAmount.toLocaleString()} を支払いますか？\n（この操作は取り消せません）`)) return;
    
    setSubmitting(true);

    try {
      // 1. アプリケーション情報の更新
      const { error: appError } = await supabase
        .from('applications')
        .update({
          status: 'completed',
          actual_start_time: new Date(actualStart).toISOString(),
          actual_end_time: new Date(actualEnd).toISOString(),
          final_amount: totalAmount
        })
        .eq('id', appId);

      if (appError) throw appError;

      // 2. 看護師のウォレット残高を更新
      const currentBalance = application.nurses.wallet_balance || 0;
      const newBalance = currentBalance + totalAmount;

      const { error: nurseError } = await supabase
        .from('nurses')
        .update({ wallet_balance: newBalance })
        .eq('id', application.nurses.id);

      if (nurseError) throw nurseError;

      // 3. ★追加: 「ありがとう」を送る処理
      if (sendThanks) {
        // 重複エラーを避けるため、一応 insert してみる（エラーハンドリングは緩めに）
        await supabase
          .from('nurse_reviews')
          .insert([{
            nurse_id: application.nurses.id,
            hospital_id: application.jobs.hospital_id
          }]);
      }

      alert('業務完了手続きが完了しました！');
      router.push('/hospital');

    } catch (e: any) {
      console.error(e);
      alert('エラーが発生しました: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-gray-800">業務完了・報酬確定</h1>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <h2 className="text-sm font-bold text-gray-500 mb-2">対象の業務</h2>
          {/* @ts-ignore */}
          <p className="text-lg font-bold text-gray-800 mb-1">{application.jobs?.title}</p>
          {/* @ts-ignore */}
          <p className="text-sm text-gray-600">担当: {application.nurses?.name} さん</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Clock size={18} className="text-blue-600" /> 実績時間の入力
            </label>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">開始時間</span>
                <input 
                  type="datetime-local" 
                  className="w-full border p-3 rounded-lg bg-gray-50 font-mono text-lg"
                  value={actualStart}
                  onChange={(e) => setActualStart(e.target.value)}
                />
              </div>
              <div className="flex justify-center text-gray-400">↓</div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">終了時間</span>
                <input 
                  type="datetime-local" 
                  className="w-full border p-3 rounded-lg bg-gray-50 font-mono text-lg"
                  value={actualEnd}
                  onChange={(e) => setActualEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Calculator size={18} className="text-orange-500" /> お支払い金額
            </label>
            <div className="bg-orange-50 p-4 rounded-lg flex justify-between items-center">
              <span className="text-sm text-gray-600">時給 ¥{application.jobs.hourly_wage.toLocaleString()} × 時間</span>
              <span className="text-2xl font-bold text-orange-600">¥{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ★追加: ありがとうチェックボックス */}
        <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 flex items-center gap-3 cursor-pointer" onClick={() => setSendThanks(!sendThanks)}>
          <div className={`p-2 rounded-full transition-colors ${sendThanks ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
            <ThumbsUp size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">「ありがとう」を送る</p>
            <p className="text-xs text-gray-500">感謝の気持ちを伝えて実績バッジを付与します</p>
          </div>
          <input 
            type="checkbox" 
            className="w-6 h-6 text-pink-600 rounded focus:ring-pink-500"
            checked={sendThanks}
            onChange={(e) => setSendThanks(e.target.checked)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || totalAmount <= 0}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircle size={20} />
          {submitting ? '処理中...' : '内容を確定して支払う'}
        </button>

      </div>
    </div>
  );
}