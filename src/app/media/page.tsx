import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "./articles";

export const metadata: Metadata = {
  title: "活用事例 | musu",
  description:
    "musuの活用事例。AIエージェントチームで業務を自動化する方法を紹介します。",
};

export default function MediaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
        <Link
          href="/"
          className="text-xl font-extrabold text-[#4A99E9] tracking-tight"
        >
          musu
        </Link>
        <span className="text-xs text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full">
          活用事例
        </span>
      </header>

      {/* Hero */}
      <section className="bg-[#4A99E9] text-white px-5 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-white/60 tracking-wider mb-3">musu media</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            育て方の数だけ、働き方がある。
          </h1>
          <p className="text-white/80 text-lg">
            musuを活用しているソロプレナーたちのリアルな事例を紹介します。
          </p>
        </div>
      </section>

      {/* Article list */}
      <section className="max-w-3xl mx-auto px-5 py-12">
        <div className="space-y-8">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/media/${article.slug}`}
              className="block group"
            >
              <article className="border border-gray-200 rounded-2xl p-6 hover:border-[#4A99E9] hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-[#4A99E9] font-bold bg-[#e8f0fe] px-2.5 py-0.5 rounded-full">
                    {article.label}
                  </span>
                  <span className="text-xs text-gray-400">{article.date}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#4A99E9] transition-colors mb-2">
                  {article.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {article.description}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-sm text-gray-400 border-t border-gray-200">
        &copy; 2026 musu.world — ソロプレナーのためのAIエージェントチーム
      </footer>
    </div>
  );
}
