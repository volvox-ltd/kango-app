'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, Save, ArrowLeft, CheckCircle, Trash2, User } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  // 入力データ
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // 追加項目
  const [nearestStation, setNearestStation] = useState('');
  const [clinicalExperience, setClinicalExperience] = useState<number | ''>('');
  const [selfIntroduction, setSelfIntroduction] = useState('');

  // 画像系ステート
  const [licenseUrl, setLicenseUrl] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState('');

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // データ取得
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
        setName(nurse.name || '');
        setPhone(nurse.phone || '');
        setLicenseUrl(nurse.license_image_url || '');
        setAvatarUrl(nurse.avatar_url || '');
        setNearestStation(nurse.nearest_station || '');
        setClinicalExperience(nurse.clinical_experience || '');
        setSelfIntroduction(nurse.self_introduction || '');
      }
      setLoading(false);
    };
    fetchData();
  }, [router]);

  // 画像選択ハンドラ（共通化）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'avatar') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (type === 'license') {
          setLicenseFile(file);
          setLicensePreview(reader.result as string);
        } else {
          setAvatarFile(file);
          setAvatarPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像削除ハンドラ
  const handleDeleteImage = (type: 'license' | 'avatar') => {
    if (!confirm('画像を削除しますか？')) return;
    if (type === 'license') {
      setLicenseFile(null);
      setLicensePreview('');
      setLicenseUrl(''); // 空文字にすることでDB更新時に削除扱いにする
    } else {
      setAvatarFile(null);
      setAvatarPreview('');
      setAvatarUrl('');
    }
  };

  // 保存処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalLicenseUrl = licenseUrl;
      let finalAvatarUrl = avatarUrl;

      // 免許証アップロード
      if (licenseFile) {
        const fileName = `${userId}_license_${Date.now()}`;
        const { error } = await supabase.storage.from('license_photos').upload(fileName, licenseFile);
        if (error) throw error;
        const { data } = supabase.storage.from('license_photos').getPublicUrl(fileName);
        finalLicenseUrl = data.publicUrl;
      }

      // アバターアップロード
      if (avatarFile) {
        const fileName = `${userId}_avatar_${Date.now()}`;
        const { error } = await supabase.storage.from('avatar_photos').upload(fileName, avatarFile);
        if (error) throw error;
        const { data } = supabase.storage.from('avatar_photos').getPublicUrl(fileName);
        finalAvatarUrl = data.publicUrl;
      }

      // データベース更新
      const { error } = await supabase
        .from('nurses')
        .update({
          name: name,
          phone: phone,
          license_image_url: finalLicenseUrl || null, // 空文字ならnullを入れて削除扱いに
          avatar_url: finalAvatarUrl || null,
          nearest_station: nearestStation,
          clinical_experience: clinicalExperience === '' ? null : Number(clinicalExperience),
          self_introduction: selfIntroduction,
        })
        .eq('id', userId);

      if (error) throw error;

      alert('プロフィールを保存しました！');
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
      {/* ヘッダー */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg">プロフィール編集</h1>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* --- プロフィール画像 (アバター) --- */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                {(avatarPreview || avatarUrl) ? (
                  <img 
                    src={avatarPreview || avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              
              {/* 画像追加・変更ボタン */}
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700">
                <Camera size={20} />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
              </label>

              {/* 削除ボタン（画像がある時のみ） */}
              {(avatarPreview || avatarUrl) && (
                <button 
                  type="button"
                  onClick={() => handleDeleteImage('avatar')}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">プロフィール画像を設定</p>
          </div>

          {/* --- 基本情報 --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="font-bold text-gray-700 border-b pb-2">基本情報</h2>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">お名前</label>
              <input type="text" required className="w-full border p-3 rounded-lg bg-gray-50" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">最寄駅</label>
              <input type="text" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: 新宿駅" value={nearestStation} onChange={(e) => setNearestStation(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">臨床経験年数 (年)</label>
              <input type="number" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: 3" value={clinicalExperience} onChange={(e) => setClinicalExperience(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">自己紹介</label>
              <textarea rows={3} className="w-full border p-3 rounded-lg bg-gray-50" placeholder="簡単な経歴や得意な業務など" value={selfIntroduction} onChange={(e) => setSelfIntroduction(e.target.value)} />
            </div>
          </div>

          {/* --- 免許証アップロード --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              資格・免許証
            </h2>
            <p className="text-xs text-gray-500">
              応募するには看護師免許証の画像登録が必要です。
            </p>

            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[200px] flex flex-col items-center justify-center">
              {(licensePreview || licenseUrl) ? (
                <>
                  <img src={licensePreview || licenseUrl} alt="License" className="max-h-64 object-contain rounded" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    {/* 変更ボタン */}
                    <label className="bg-black/50 text-white p-2 rounded cursor-pointer hover:bg-black/70">
                      <Camera size={16} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'license')} />
                    </label>
                    {/* 削除ボタン */}
                    <button 
                      type="button" 
                      onClick={() => handleDeleteImage('license')}
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center cursor-pointer w-full h-full py-10">
                  <Camera size={48} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">画像をアップロード</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'license')} />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? '保存中...' : 'プロフィールを保存'}
          </button>
        </form>
      </div>
    </div>
  );
}