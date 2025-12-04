'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { use } from 'react'; // Next.js 15+ のためのフック
import React from 'react';

export default function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  // Next.js 15以降は params が Promise なので use() でアンラップします
  const { slug } = use(params);

  // コンテンツの定義
  const contents: { [key: string]: { title: string; body: React.ReactNode } } = {
    terms: {
      title: '利用規約',
      body: (
        <div className="space-y-4">
          <p>この利用規約（以下，「本規約」といいます。）は，KanGO!（以下，「当社」といいます。）がこのウェブサイト上で提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。</p>
          <h3 className="font-bold mt-4">第1条（適用）</h3>
          <p>本規約は，ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
          <h3 className="font-bold mt-4">第2条（禁止事項）</h3>
          <p>ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。</p>
          <ul className="list-disc pl-5">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>本サービスの内容等，本サービスに含まれる著作権，商標権ほか知的財産権を侵害する行為</li>
          </ul>
          {/* 必要に応じて追記 */}
        </div>
      )
    },
    privacy: {
      title: 'プライバシーポリシー',
      body: (
        <div className="space-y-4">
          <p>KanGO!（以下，「当社」といいます。）は，本ウェブサイト上で提供するサービスにおける，ユーザーの個人情報の取扱いについて，以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。</p>
          <h3 className="font-bold mt-4">第1条（個人情報）</h3>
          <p>「個人情報」とは，個人情報保護法にいう「個人情報」を指すものとし，生存する個人に関する情報であって，当該情報に含まれる氏名，生年月日，住所，電話番号，連絡先その他の記述等により特定の個人を識別できる情報を指します。</p>
        </div>
      )
    },
    help: {
      title: 'よくある質問',
      body: (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-blue-600">Q. 給与はいつ振り込まれますか？</h3>
            <p className="mt-1">A. 業務完了後、病院側が承認を行った時点でウォレットに反映されます。振込申請を行うと、翌月末にご指定の口座へ振り込まれます。</p>
          </div>
          <div>
            <h3 className="font-bold text-blue-600">Q. キャンセルはできますか？</h3>
            <p className="mt-1">A. 確定前のキャンセルは可能です。確定後のキャンセルは、チャットにて病院へ直接ご連絡ください。無断キャンセルはアカウント停止の対象となります。</p>
          </div>
          <div>
            <h3 className="font-bold text-blue-600">Q. 免許証の登録は必須ですか？</h3>
            <p className="mt-1">A. はい、求人に応募するためには看護師免許証の画像登録と承認が必須となります。</p>
          </div>
        </div>
      )
    },
    contact: {
      title: 'お問い合わせ',
      body: (
        <div className="space-y-4">
          <p>サービスに関するお問い合わせは、以下のメールアドレスまでお願いいたします。</p>
          <div className="bg-gray-100 p-4 rounded text-center">
            <p className="font-bold text-lg select-all">support@kango-app.com</p>
          </div>
          <p className="text-sm text-gray-500">
            ※お問い合わせの際は、お名前とユーザーID（メールアドレス）を記載してください。<br/>
            ※返信には2〜3営業日いただく場合がございます。
          </p>
        </div>
      )
    }
  };

  const content = contents[slug];

  if (!content) {
    return <div className="p-8 text-center">ページが見つかりません</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <Link href="/mypage" className="text-gray-600">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="font-bold text-lg">{content.title}</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 bg-white mt-4 rounded-xl shadow-sm min-h-[50vh]">
        <div className="text-gray-800 leading-relaxed">
          {content.body}
        </div>
      </div>
    </div>
  );
}