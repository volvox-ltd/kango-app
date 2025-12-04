'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Save, Upload, X, LogOut, Building2 } from 'lucide-react';

export default function HospitalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  // 入力データ
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // 画像関連
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // 既に保存されている画像URL

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: hospital } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', user.id)
        .single();

      if (hospital) {
        setName(hospital.name || '');
        setAddress(hospital.address || '');
        setManagerName(hospital.manager_name || '');
        setDescription(hospital.description || '');
        setWebsiteUrl(hospital.website_url || '');
        setExistingImages(hospital.images || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [router]);

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // 画像選択
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // 合計枚数チェック (既存 + 新規)
      if (existingImages.length + imageFiles.length >= 3) {
        alert('画像は最大3枚までです');
        return;
      }
      setImageFiles([...imageFiles, file]);
      
      // プレビュー
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews([...imagePreviews, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  // 新規画像削除
  const removeNewImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  // 既存画像削除
  const removeExistingImage = (index: number) => {
    const newImages = [...existingImages];
    newImages.splice(index, 1);
    setExistingImages(newImages);
  };

  // 保存処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. 新しい画像をアップロード
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const { error } = await supabase.storage
          .from('hospital_photos')
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data } = supabase.storage
          .from('hospital_photos')
          .getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }

      // 2. 既存画像と新画像を結合
      const finalImages = [...existingImages, ...uploadedUrls];

      // 3. データベース更新
      const { error } = await supabase
        .from('hospitals')
        .update({
          name: name,
          address: address,
          manager_name: managerName,
          description: description,
          website_url: websiteUrl,
          images: finalImages
        })
        .eq('id', userId);

      if (error) throw error;

      alert('病院情報を保存しました！');
      
      // 状態をリセット（プレビューを消して、全てexistingに移動させるためリロード推奨だが、今回は簡易的に）
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages(finalImages);

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
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h1 className="font-bold text-lg flex items-center gap-2 text-gray-800">
          <Building2 className="text-blue-600" /> 病院情報編集
        </h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
          <LogOut size={16} /> ログアウト
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* 画像アップロードエリア */}
          <section className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-bold text-gray-700 mb-4">病院・施設の写真 (最大3枚)</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {/* 既存の画像 */}
              {existingImages.map((src, idx) => (
                <div key={`existing-${idx}`} className="relative w-24 h-24 flex-shrink-0">
                  <img src={src} alt="hospital" className="w-full h-full object-cover rounded-lg border" />
                  <button type="button" onClick={() => removeExistingImage(idx)} className="absolute -top-2 -right-2 bg-gray-600 text-white rounded-full p-1 hover:bg-red-500 transition">
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {/* 新規プレビュー */}
              {imagePreviews.map((src, idx) => (
                <div key={`new-${idx}`} className="relative w-24 h-24 flex-shrink-0">
                  <img src={src} alt="preview" className="w-full h-full object-cover rounded-lg border border-blue-200" />
                  <button type="button" onClick={() => removeNewImage(idx)} className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 hover:bg-red-500 transition">
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* 追加ボタン */}
              {(existingImages.length + imageFiles.length < 3) && (
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <Upload className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">追加</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
              )}
            </div>
          </section>

          {/* 基本情報フォーム */}
          <section className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="font-bold text-gray-700 border-b pb-2 mb-4">基本情報</h2>
            
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">施設名</label>
              <input type="text" required className="w-full border p-3 rounded-lg bg-gray-50" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">住所</label>
              <input type="text" required className="w-full border p-3 rounded-lg bg-gray-50" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">担当者名</label>
              <input type="text" className="w-full border p-3 rounded-lg bg-gray-50" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">Webサイト (URL)</label>
              <input type="url" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="https://..." value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">紹介文・特徴</label>
              <textarea 
                rows={5} 
                className="w-full border p-3 rounded-lg bg-gray-50" 
                placeholder="どんな職場か、スタッフの雰囲気などを入力してください"
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
          </section>

          {/* 保存ボタン */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            <Save size={20} />
            {saving ? '保存中...' : '情報を保存する'}
          </button>

        </form>
      </div>
    </div>
  );
}