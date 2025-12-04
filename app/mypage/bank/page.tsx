'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Landmark, Save, ArrowLeft } from 'lucide-react';

export default function BankAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  // 口座情報フォーム
  const [formData, setFormData] = useState({
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolder: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: nurse } = await supabase
        .from('nurses')
        .select('*')
        .eq('id', user.id)
        .single();

      if (nurse) {
        setFormData({
          bankName: nurse.bank_name || '',
          branchName: nurse.branch_name || '',
          accountType: nurse.account_type || '普通',
          accountNumber: nurse.account_number || '',
          accountHolder: nurse.account_holder || ''
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('nurses')
        .update({
          bank_name: formData.bankName,
          branch_name: formData.branchName,
          account_type: formData.accountType,
          account_number: formData.accountNumber,
          account_holder: formData.accountHolder
        })
        .eq('id', userId);

      if (error) throw error;

      alert('口座情報を保存しました！');
      router.push('/mypage');

    } catch (error: any) {
      console.error(error);
      alert('保存失敗: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-gray-800">振込先口座の登録</h1>
      </div>

      <div className="max-w-md mx-auto p-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 border border-blue-200">
          <p className="font-bold flex items-center gap-2 mb-1">
            <Landmark size={16} /> 振込先について
          </p>
          ご本人名義の口座のみ登録可能です。入力内容に誤りがあると振込ができませんのでご注意ください。
        </div>

        <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">金融機関名</label>
            <input type="text" name="bankName" required className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: ○○銀行" value={formData.bankName} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">支店名</label>
              <input type="text" name="branchName" required className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: 本店" value={formData.branchName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">口座種別</label>
              <select name="accountType" className="w-full border p-3 rounded-lg bg-gray-50" value={formData.accountType} onChange={handleChange}>
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">口座番号 (半角数字)</label>
            <input type="text" name="accountNumber" required pattern="\d*" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="1234567" value={formData.accountNumber} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">口座名義 (全角カタカナ)</label>
            <input type="text" name="accountHolder" required className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: カンゴ ハナコ" value={formData.accountHolder} onChange={handleChange} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? '保存中...' : 'この口座を登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}