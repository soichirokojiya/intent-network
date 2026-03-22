import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "./articles";

export const metadata: Metadata = {
  title: "musu lab | musu",
  description:
    "musuの活用事例。AIエージェントチームで業務を自動化する方法を紹介します。",
};

export default function MediaPage() {
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-extrabold text-gray-900 tracking-tight">
              musu
            </Link>
            <span className="text-xs text-[#4A99E9] font-bold bg-[#e8f0fe] px-2.5 py-0.5 rounded-full">
              lab
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
              musuについて
            </Link>
            <Link href="/" className="text-sm font-bold text-white bg-[#4A99E9] hover:bg-[#3a89d9] px-4 py-2 rounded-full transition-colors">
              無料ではじめる
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4A99E9] via-[#3a7bd5] to-[#2d6bc4] text-white px-5 py-16 md:py-24">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5" />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <p className="text-sm text-white/50 tracking-[0.2em] uppercase mb-4">musu lab</p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 leading-tight">
            育て方の数だけ、働き方がある。
          </h1>
          <p className="text-white/70 text-lg max-w-lg">
            musuを活用しているソロプレナーたちのリアルな事例を紹介します。
          </p>
        </div>
      </section>

      {/* Tags */}
      <div className="max-w-5xl mx-auto px-5 py-6">
        <div className="flex flex-wrap gap-2">
          {["すべて", "Gmail", "Sheets", "自動化", "Slack", "Notion", "Calendar", "Square"].map((tag) => (
            <span key={tag} className={`text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors ${tag === "すべて" ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#4A99E9] hover:text-[#4A99E9]"}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Featured Article */}
      <div className="max-w-5xl mx-auto px-5 mb-8">
        <Link href={`/media/${featured.slug}`} className="block group">
          <article className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all md:flex">
            <div className={`bg-gradient-to-br ${featured.color} md:w-2/5 h-48 md:h-auto flex items-center justify-center`}>
              <span className="text-6xl md:text-7xl">{featured.emoji}</span>
            </div>
            <div className="p-6 md:p-8 md:w-3/5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                {featured.tags.map((tag) => (
                  <span key={tag} className="text-[11px] text-[#4A99E9] font-medium bg-[#e8f0fe] px-2 py-0.5 rounded-full">{tag}</span>
                ))}
                <span className="text-xs text-gray-400">{featured.date}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-[#4A99E9] transition-colors mb-3 leading-snug">
                {featured.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {featured.description}
              </p>
            </div>
          </article>
        </Link>
      </div>

      {/* Article Grid */}
      <div className="max-w-5xl mx-auto px-5 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {rest.map((article) => (
            <Link key={article.slug} href={`/media/${article.slug}`} className="block group">
              <article className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all h-full">
                <div className={`bg-gradient-to-br ${article.color} h-40 flex items-center justify-center`}>
                  <span className="text-5xl">{article.emoji}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {article.tags.map((tag) => (
                      <span key={tag} className="text-[10px] text-[#4A99E9] font-medium bg-[#e8f0fe] px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-base font-bold text-gray-900 group-hover:text-[#4A99E9] transition-colors mb-2 leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {article.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-3">{article.date}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 text-center py-10">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg font-extrabold text-gray-900">musu</span>
            <span className="text-xs text-[#4A99E9] font-bold bg-[#e8f0fe] px-2 py-0.5 rounded-full">lab</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">育て方の数だけ、働き方がある。</p>
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <Link href="/about" className="hover:underline">musuについて</Link>
            <Link href="/help" className="hover:underline">ヘルプ</Link>
            <Link href="/contact" className="hover:underline">お問い合わせ</Link>
            <Link href="/terms" className="hover:underline">利用規約</Link>
          </div>
          <p className="text-xs text-gray-300 mt-4">&copy; 2026 musu.world</p>
        </div>
      </footer>
    </div>
  );
}
