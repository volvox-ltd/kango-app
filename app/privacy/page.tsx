export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">プライバシーポリシー</h1>
      <p className="mb-4 text-sm text-gray-500">最終更新日: 2025年12月8日</p>
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">1. 個人情報の収集</h2>
        <p>
          本サービス（以下「本サービス」）は、ユーザーが利用登録やお問い合わせを行う際に、
          氏名、メールアドレス、LINEアカウント情報その他当社が定める情報を取得します。
          また、サービス利用状況やアクセスログなどの情報を自動的に取得する場合があります。
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">2. 個人情報の利用目的</h2>
        <p>収集した個人情報は、以下の目的のために利用します。</p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>本サービスの提供、仲介および運営のため</li>
          <li>ユーザーと事業者（発注者）間のマッチングに必要な情報共有のため</li>
          <li>本人確認および不正利用防止のため</li>
          <li>お知らせ、サポート、緊急時の連絡のため</li>
          <li>サービス改善、新サービスの検討およびマーケティング（統計化したデータに限る）のため</li>
          <li>利用規約違反への対応および権利保護のため</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">3. 個人情報の第三者提供</h2>
        <p>
          法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。
          ただし、サービス提供に必要な範囲で業務委託先（決済代行事業者、システム運用事業者等）に
          個人情報を提供する場合があります。その場合、当社は適切な管理が行われるよう監督します。
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">4. 安全管理措置</h2>
        <p>
          当社は、個人情報の漏洩、紛失、改ざん等を防止するため、
          必要かつ適切な安全管理措置を講じます。
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">5. プライバシーポリシーの変更</h2>
        <p>
          当社は、本ポリシーの内容を適宜変更することがあります。
          重要な変更がある場合には、本サービス上で通知します。
        </p>
      </section>
      <div className="mt-12 pt-8 border-t">
        <a href="/" className="text-blue-600 hover:underline">← トップページに戻る</a>
      </div>
    </div>
  );
}