'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, Calendar, MessageCircle, User, Briefcase, PlusCircle, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BottomNavigation() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'nurse' | 'hospital' | null>(null);

  // ログイン中のユーザーの役割を確認する
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        return;
      }

      // profilesテーブルからロールを取得
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setUserRole(data.role as any);
      }
    };
    checkUser();
  }, [pathname]); // ページ移動のたびにチェック

  // ログイン画面やトップページの一部では表示しない制御も可能ですが、
  // 今回はログインしていない時は「非表示」にします。
  if (!userRole) return null;

  // 現在のページがアクティブかどうか判定する関数
  const isActive = (path: string) => pathname === path ? 'text-blue-600' : 'text-gray-400';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        
        {/* === 看護師用メニュー === */}
        {userRole === 'nurse' && (
          <>
            <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
              <Search size={24} />
              <span className="text-[10px] font-bold">さがす</span>
            </Link>
            <Link href="/favorites" className={`flex flex-col items-center gap-1 ${isActive('/favorites')}`}>
              <Heart size={24} />
              <span className="text-[10px] font-bold">お気に入り</span>
            </Link>
            <Link href="/works" className={`flex flex-col items-center gap-1 ${isActive('/works')}`}>
              <Calendar size={24} />
              <span className="text-[10px] font-bold">はたらく</span>
            </Link>
            <Link href="/messages" className={`flex flex-col items-center gap-1 ${isActive('/messages')}`}>
              <MessageCircle size={24} />
              <span className="text-[10px] font-bold">メッセージ</span>
            </Link>
            <Link href="/mypage" className={`flex flex-col items-center gap-1 ${isActive('/mypage')}`}>
              <User size={24} />
              <span className="text-[10px] font-bold">マイページ</span>
            </Link>
          </>
        )}

        {/* === 病院用メニュー === */}
        {userRole === 'hospital' && (
          <>
            <Link href="/hospital" className={`flex flex-col items-center gap-1 ${isActive('/hospital')}`}>
              <LayoutDashboard size={24} />
              <span className="text-[10px] font-bold">管理ホーム</span>
            </Link>
            <Link href="/hospital/create" className={`flex flex-col items-center gap-1 ${isActive('/hospital/create')}`}>
              <PlusCircle size={24} />
              <span className="text-[10px] font-bold">求人作成</span>
            </Link>
            {/* 病院用マイページ（後で作ります） */}
            <Link href="/hospital/profile" className={`flex flex-col items-center gap-1 ${isActive('/hospital/profile')}`}>
              <Briefcase size={24} />
              <span className="text-[10px] font-bold">病院情報</span>
            </Link>
          </>
        )}

      </div>
    </div>
  );
}