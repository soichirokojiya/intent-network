"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [totalUsed, setTotalUsed] = useState<number | null>(null);
  const [totalCharged, setTotalCharged] = useState<number | null>(null);
  const [totalInputTokens, setTotalInputTokens] = useState<number>(0);
  const [totalOutputTokens, setTotalOutputTokens] = useState<number>(0);
  const [monthly, setMonthly] = useState<{ month: string; cost: number; inputTokens: number; outputTokens: number; count: number }[]>([]);

  useEffect(() => {
    const deviceId = localStorage.getItem("musu_device_id");
    if (deviceId) {
      fetch(`/api/credits?deviceId=${deviceId}`).then((r) => r.json()).then((d) => {
        setBalance(d.balance);
        setTotalUsed(d.totalUsed);
        setTotalCharged(d.totalCharged);
        setTotalInputTokens(d.totalInputTokens || 0);
        setTotalOutputTokens(d.totalOutputTokens || 0);
        setMonthly(d.monthly || []);
      });
    }
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">料金明細</span>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Balance */}
        <div className="p-4 bg-[var(--search-bg)] rounded-2xl">
          <p className="text-[12px] text-[var(--muted)] mb-1">現在の残高</p>
          <p className="text-3xl font-extrabold">¥{balance !== null ? balance.toLocaleString() : "..."}</p>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <h2 className="text-[15px] font-bold">利用サマリー</h2>
          <div className="flex justify-between py-2 border-b border-[var(--card-border)]">
            <span className="text-[14px] text-[var(--muted)]">累計チャージ額</span>
            <span className="text-[14px]">¥{totalCharged !== null ? totalCharged.toLocaleString() : "..."}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--card-border)]">
            <span className="text-[14px] text-[var(--muted)]">累計利用額</span>
            <span className="text-[14px]">¥{totalUsed !== null ? totalUsed.toLocaleString() : "..."}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--card-border)]">
            <span className="text-[14px] text-[var(--muted)]">入力トークン</span>
            <span className="text-[14px]">{totalInputTokens.toLocaleString()} tok</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--card-border)]">
            <span className="text-[14px] text-[var(--muted)]">出力トークン</span>
            <span className="text-[14px]">{totalOutputTokens.toLocaleString()} tok</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[14px] text-[var(--muted)]">合計トークン</span>
            <span className="text-[14px] font-bold">{(totalInputTokens + totalOutputTokens).toLocaleString()} tok</span>
          </div>
        </div>

        {/* Monthly breakdown */}
        {monthly.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[15px] font-bold">月別明細</h2>
            {monthly.map((m) => (
              <div key={m.month} className="p-3 bg-[var(--search-bg)] rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-[14px] font-bold">{m.month}</span>
                  <span className="text-[14px] font-bold">¥{m.cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[12px] text-[var(--muted)]">
                  <span>{m.count}回のリクエスト</span>
                  <span>{(m.inputTokens + m.outputTokens).toLocaleString()} tok</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charge button */}
        <button
          onClick={() => router.push("/charge")}
          className="w-full py-3 bg-[var(--accent)] text-white font-bold rounded-full hover:bg-[var(--accent-hover)] transition-colors"
        >
          チャージする
        </button>
      </div>
      <div className="h-20" />
    </>
  );
}
