import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "./articles";

export const metadata: Metadata = {
  title: "musu lab | musu",
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
          className="text-xl font-extrabold text-gray-900 tracking-tight"
        >
          musu
        </Link>
        <span className="text-xs text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full">
          lab
        </span>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4A99E9] via-[#3a7bd5] to-[#2d6bc4] text-white px-5 py-20 md:py-32">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-white/3" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <p className="text-sm text-white/50 tracking-[0.2em] uppercase mb-4">musu lab</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-5 leading-tight">
            育て方の数だけ、
            <br />
            働き方がある。
          </h1>
          <p className="text-white/70 text-lg max-w-lg">
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
