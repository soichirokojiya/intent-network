"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const CHARGE_OPTIONS = [1000, 3000, 5000, 10000];

export default function ChargePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const sessionId = searchParams.get("session_id");
  const [charged, setCharged] = useState(false);

  useEffect(() => {
    const deviceId = localStorage.getItem("musu_device_id");
    if (deviceId) {
      fetch(`/api/credits?deviceId=${deviceId}`).then((r) => r.json()).then((d) => setBalance(d.balance));
    }
  }, []);

  // After successful payment, verify with Stripe and add credit
  useEffect(() => {
    if (sessionId && !charged) {
      setCharged(true);
      fetch("/api/credits/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).then((r) => r.json()).then((d) => {
        if (d.balance !== undefined) setBalance(d.balance);
      });
    }
  }, [sessionId, charged]);

  const [error, setError] = useState("");

  const handleCharge = async (chargeAmount: number) => {
    setError("");
    setLoading(String(chargeAmount));

    const deviceId = localStorage.getItem("musu_device_id");
    if (!deviceId) {
      setError("デバイスIDが見つかりません。ホーム画面に戻ってからやり直してください。");
      setLoading(null);
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: chargeAmount, deviceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "チャージの開始に失敗しました");
        setLoading(null);
      }
    } catch {
      setError("通信エラーが発生しました");
      setLoading(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">クレジットチャージ</span>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto">
        {sessionId && (
          <div className="p-4 rounded-xl bg-[rgba(0,186,124,0.1)] text-[var(--green)] text-[14px] mb-6">
            チャージが完了しました！
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-[rgba(244,33,46,0.1)] text-[var(--danger)] text-[14px] mb-6">
            {error}
          </div>
        )}

        {/* Current balance */}
        <div className="text-center mb-8">
          <p className="text-[var(--muted)] text-[13px] mb-1">現在の残高</p>
          <p className="text-4xl font-extrabold">
            ¥{balance !== null ? Math.round(balance).toLocaleString() : "..."}
          </p>
        </div>

        {/* Charge options */}
        <div className="space-y-3">
          {CHARGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleCharge(opt)}
              disabled={loading !== null}
              className="w-full py-4 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl text-[16px] font-bold hover:border-[var(--accent)] hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50"
            >
              {loading === String(opt) ? "処理中..." : `¥${opt.toLocaleString()} チャージ`}
            </button>
          ))}
        </div>

        <p className="text-[var(--muted)] text-[12px] text-center mt-6 leading-relaxed">
          クレジットはAIエージェントの利用に消費されます。<br />
          トークン消費量に応じた従量課金です。
        </p>
      </div>
    </>
  );
}
