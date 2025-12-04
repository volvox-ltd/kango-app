'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Upload, X, MapPin, FileText, AlertTriangle, CheckCircle, Trash2, Calendar, Clock } from 'lucide-react';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // 15分刻みの時間リストを生成 (00:00 ~ 23:45)
  const timeOptions: string[] = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const hour = i.toString().padStart(2, '0');
      const min = j.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${min}`);
    }
  }

  // フォームデータ
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // ★変更: 日付と時間をセットで管理
    shifts: [
      { date: '', startTime: '09:00', endTime: '12:00' }
    ],
    hourlyWage: 2000,
    benefits: [] as string[],
    precautions: '',
    requirements: '',
    documentUrl: '',
    accessInfo: '',
  });

  const benefitsList = [
    '交通費支給', '自転車通勤OK', 'バイク通勤OK', '自動車通勤OK', '髪型自由', '服装自由'
  ];

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ★シフト追加
  const addShift = () => {
    if (formData.shifts.length >= 10) return;
    // 直前のシフトの内容をコピーして追加すると入力が楽
    const lastShift = formData.shifts[formData.shifts.length - 1];
    setFormData({ 
      ...formData, 
      shifts: [...formData.shifts, { ...lastShift, date: '' }] // 日付だけ空にする
    });
  };

  // ★シフト削除
  const removeShift = (index: number) => {
    if (formData.shifts.length <= 1) return;
    const newShifts = [...formData.shifts];
    newShifts.splice(index, 1);
    setFormData({ ...formData, shifts: newShifts });
  };

  // ★シフト変更（日付・時間）
  const handleShiftChange = (index: number, field: 'date' | 'startTime' | 'endTime', value: string) => {
    const newShifts = [...formData.shifts];
    newShifts[index][field] = value;
    setFormData({ ...formData, shifts: newShifts });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (imageFiles.length >= 3) {
        alert('画像は3枚までです');
        return;
      }
      setImageFiles([...imageFiles, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews([...imagePreviews, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const toggleBenefit = (benefit: string) => {
    if (formData.benefits.includes(benefit)) {
      setFormData({ ...formData, benefits: formData.benefits.filter(b => b !== benefit) });
    } else {
      setFormData({ ...formData, benefits: [...formData.benefits, benefit] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // バリデーション
    if (formData.shifts.some(s => !s.date || !s.startTime || !s.endTime)) {
      alert('日時が正しく入力されていない項目があります');
      return;
    }
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインしてください');

      const groupId = crypto.randomUUID(); 

      // 画像アップロード
      const uploadedImageUrls: string[] = [];
      for (const file of imageFiles) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const { error } = await supabase.storage.from('job_photos').upload(`${user.id}/${fileName}`, file);
        if (error) throw error;
        const { data } = supabase.storage.from('job_photos').getPublicUrl(`${user.id}/${fileName}`);
        uploadedImageUrls.push(data.publicUrl);
      }

      // ★シフトごとに登録ループ
      for (const shift of formData.shifts) {
        const startDateTime = new Date(`${shift.date}T${shift.startTime}`);
        const endDateTime = new Date(`${shift.date}T${shift.endTime}`);

        const { error } = await supabase
          .from('jobs')
          .insert([
            {
              hospital_id: user.id,
              group_id: groupId,
              title: formData.title,
              description: formData.description,
              start_time: startDateTime.toISOString(),
              end_time: endDateTime.toISOString(),
              hourly_wage: parseInt(formData.hourlyWage as any),
              images: uploadedImageUrls,
              benefits: formData.benefits,
              precautions: formData.precautions,
              requirements: formData.requirements,
              document_url: formData.documentUrl,
              access_info: formData.accessInfo,
              status: 'open'
            }
          ]);
        
        if (error) throw error;
      }

      alert('求人を公開しました！');
      router.push('/hospital');

    } catch (error: any) {
      console.error(error);
      alert('登録失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-sm">
        <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <button onClick={() => router.back()} className="text-gray-500">キャンセル</button>
          <h1 className="font-bold text-lg">求人作成</h1>
          <button onClick={handleSubmit} disabled={loading} className="text-blue-600 font-bold disabled:opacity-50">
            {loading ? '公開中...' : '公開'}
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* 画像 */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-2">職場の写真 (最大3枚)</label>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                  <img src={src} alt="preview" className="w-full h-full object-cover rounded-lg" />
                  <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {imageFiles.length < 3 && (
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">追加</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
              )}
            </div>
          </section>

          {/* タイトル・内容 */}
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">求人タイトル</label>
              <input name="title" type="text" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: クリニックの受付・案内" onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">業務内容</label>
              <textarea name="description" rows={4} className="w-full border p-3 rounded-lg bg-gray-50" placeholder="具体的な仕事内容を入力..." onChange={handleChange} />
            </div>
          </section>

          {/* ★日時設定（セット版） */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">募集日時 (最大10枠)</label>
            
            <div className="space-y-3">
              {formData.shifts.map((shift, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative">
                  {/* 削除ボタン（2つ目以降） */}
                  {formData.shifts.length > 1 && (
                    <button 
                      onClick={() => removeShift(idx)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <div className="flex flex-col gap-3">
                    {/* 日付 */}
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-blue-500" />
                      <input
                        type="date"
                        className="bg-white border p-2 rounded flex-1"
                        value={shift.date}
                        onChange={(e) => handleShiftChange(idx, 'date', e.target.value)}
                      />
                    </div>

                    {/* 時間 */}
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-orange-500" />
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          className="bg-white border p-2 rounded flex-1"
                          value={shift.startTime}
                          onChange={(e) => handleShiftChange(idx, 'startTime', e.target.value)}
                        >
                          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="text-gray-400">〜</span>
                        <select
                          className="bg-white border p-2 rounded flex-1"
                          value={shift.endTime}
                          onChange={(e) => handleShiftChange(idx, 'endTime', e.target.value)}
                        >
                          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.shifts.length < 10 && (
              <button onClick={addShift} type="button" className="mt-3 w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition">
                + 日程・時間を追加する
              </button>
            )}
          </section>

          {/* 時給 */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-1">時給</label>
            <div className="relative">
              <input name="hourlyWage" type="number" defaultValue={2000} className="w-full border p-3 rounded-lg bg-gray-50 pl-8" onChange={handleChange} />
              <span className="absolute left-3 top-3 text-gray-500">¥</span>
            </div>
          </section>

          {/* 待遇・特徴 */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-2">待遇・特徴</label>
            <div className="flex flex-wrap gap-2">
              {benefitsList.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleBenefit(item)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    formData.benefits.includes(item)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {/* 詳細情報 */}
          <section className="space-y-4 pt-4 border-t">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                <CheckCircle size={16} className="text-green-600" /> 働くための条件
              </label>
              <textarea name="requirements" rows={2} className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: 看護師免許必須、臨床経験3年以上" onChange={handleChange} />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                <AlertTriangle size={16} className="text-orange-500" /> 注意事項
              </label>
              <textarea name="precautions" rows={2} className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: 貴重品ロッカーあり、昼食持参" onChange={handleChange} />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                <MapPin size={16} className="text-red-500" /> アクセス・場所
              </label>
              <textarea name="accessInfo" rows={2} className="w-full border p-3 rounded-lg bg-gray-50" placeholder="例: 渋谷駅ハチ公口より徒歩5分。1階がコンビニのビルです。" onChange={handleChange} />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                <FileText size={16} className="text-blue-500" /> 業務に関する書類 (URL)
              </label>
              <input name="documentUrl" type="text" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="https://..." onChange={handleChange} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}