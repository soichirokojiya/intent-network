import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "musu.world - ひとりなのに、仲間がいる。",
  description:
    "AIが、あなたの仕事仲間になる。フリーランス・個人事業主のためのAIエージェントチーム。使った分だけの従量課金。",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="px-5 pt-16 pb-16 sm:pt-24 sm:pb-20 max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-10 sm:mb-12">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#4A99E9] rounded-xl flex items-center justify-center">
            <svg
              viewBox="0 0 40 40"
              width="24"
              height="24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              className="sm:w-7 sm:h-7"
            >
              <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
            </svg>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            musu
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5 sm:mb-6">
          ひとりなのに、
          <br />
          仲間がいる。
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-md mx-auto mb-10 sm:mb-12">
          AIが、あなたの仕事仲間になる。
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 rounded-full hover:bg-gray-700 transition-colors"
        >
          無料ではじめる
        </Link>
      </section>

      {/* Concept */}
      <section className="px-5 py-16 sm:py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed text-gray-700">
            ただのAIツールじゃない。
            <br />
            疲れたら休むし、放っておけば拗ねる。
            <br />
            育てるほど頼れる存在になる。
            <br />
            <span className="text-gray-900">そんなAIの仲間たち。</span>
          </p>
        </div>
      </section>

      {/* What musu is */}
      <section className="px-5 py-16 sm:py-24">
        <div className="max-w-xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center">
            <p className="text-4xl mb-4">💬</p>
            <h3 className="text-lg sm:text-xl font-extrabold mb-3">
              話しかけるだけ
            </h3>
            <p className="text-gray-400 text-sm sm:text-base">
              「これ調べて」「戦略考えて」。
              <br />
              リーダーが受け取って、仲間に振り分ける。
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl mb-4">🌱</p>
            <h3 className="text-lg sm:text-xl font-extrabold mb-3">育てる</h3>
            <p className="text-gray-400 text-sm sm:text-base">
              仲間にはバイオリズムがある。
              <br />
              大切にすればレベルが上がり、もっと頼れるようになる。
              <br />
              雑に扱えば、辞めてしまうかも。
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl mb-4">🤝</p>
            <h3 className="text-lg sm:text-xl font-extrabold mb-3">
              一緒に働く
            </h3>
            <p className="text-gray-400 text-sm sm:text-base">
              仲間はあなたとの会話を覚えている。
              <br />
              「前に話した件」で通じる。
              <br />
              本当のチームのように。
            </p>
          </div>
        </div>
      </section>

      {/* For who */}
      <section className="px-5 py-16 sm:py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-5 sm:mb-6">
            ひとりで頑張っている人へ
          </h2>
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
            フリーランス、個人事業主、副業。
            <br />
            人を雇うほどじゃないけど、一人じゃ手が足りない。
            <br />
            musuは、そんなあなたに仲間を届けます。
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 py-16 sm:py-24">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-sm text-gray-400 mb-2">料金</p>
          <p className="text-2xl sm:text-3xl font-extrabold mb-2">
            使った分だけ
          </p>
          <p className="text-gray-400 text-sm sm:text-base mb-8">
            月額固定なし。初回¥1,000クレジット付き。
          </p>
          <Link
            href="/"
            className="block bg-[#4A99E9] text-white font-bold py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-[#3a89d9] transition-colors"
          >
            無料ではじめる
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-10 text-center text-sm text-gray-300 space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-[#4A99E9] rounded-md flex items-center justify-center">
            <svg
              viewBox="0 0 40 40"
              width="16"
              height="16"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
            </svg>
          </div>
          <span className="font-bold text-gray-400">musu.world</span>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="hover:text-gray-500">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-gray-500">
            プライバシーポリシー
          </Link>
          <Link href="/contact" className="hover:text-gray-500">
            お問い合わせ
          </Link>
        </div>
        <p>&copy; 2026 musu.world</p>
      </footer>
    </div>
  );
}
