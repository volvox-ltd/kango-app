export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">利用規約</h1>
      <p className="mb-4 text-sm text-gray-500">最終更新日: 2025年12月8日</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">第1条（適用）</h2>
        <p>本規約は、ユーザーと本サービス（KanGO）運営者との間の、本サービスの利用に関わる一切の関係に適用されます。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">第2条（禁止事項）</h2>
        <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為に関連する行為</li>
          <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
          <li>他人の個人情報などを不正に収集・蓄積・利用する行為</li>
          <li>本サービスの運営を妨害するおそれのある行為</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">第3条（免責事項）</h2>
        <p>運営者は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</p>
      </section>

      {/* 必要に応じて条文を追加してください */}

      <div className="mt-12 pt-8 border-t">
        <a href="/" className="text-blue-600 hover:underline">← トップページに戻る</a>
      </div>
    </div>
  );
}