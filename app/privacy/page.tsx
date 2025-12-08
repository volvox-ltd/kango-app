export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">プライバシーポリシー</h1>
      <p className="mb-4 text-sm text-gray-500">最終更新日: 2025年12月8日</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">1. 個人情報の収集</h2>
        <p>本サービス（KanGO）は、ユーザーが利用登録をする際に氏名、メールアドレス、LINEアカウント情報等の個人情報を取得します。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">2. 個人情報の利用目的</h2>
        <p>収集した個人情報は、以下の目的で利用します。</p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>本サービスの提供・運営のため</li>
          <li>ユーザーからのお問い合わせに回答するため</li>
          <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
          <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">3. 個人情報の第三者提供</h2>
        <p>本サービスは、法令に基づく場合を除き、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。</p>
      </section>

      <div className="mt-12 pt-8 border-t">
        <a href="/" className="text-blue-600 hover:underline">← トップページに戻る</a>
      </div>
    </div>
  );
}