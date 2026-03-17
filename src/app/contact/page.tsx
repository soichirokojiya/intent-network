"use client";

import { useLocale } from "@/context/LocaleContext";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const { error: dbError } = await supabase.from("contact_messages").insert({
      name, email, subject, message,
    });

    if (dbError) {
      setError(dbError.message);
    } else {
      setSent(true);
      setName(""); setEmail(""); setSubject(""); setMessage("");
    }
    setLoading(false);
  };

  const isValid = name.trim() && email.trim() && subject.trim() && message.trim();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <Link href="/" className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </Link>
        <span className="text-lg font-bold">{t("contact.title")}</span>
      </header>

      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        {sent ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold mb-2">{t("contact.sent")}</h2>
            <p className="text-[var(--muted)] text-[15px]">{t("contact.sentDesc")}</p>
          </div>
        ) : (
          <>
            <p className="text-[var(--muted)] text-[15px] mb-6">{t("contact.description")}</p>

            {error && <p className="text-[var(--danger)] text-[13px] mb-4">{error}</p>}

            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-1">{t("contact.name")}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("contact.name")}
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
            </div>

            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-1">{t("contact.email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("contact.email")}
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
            </div>

            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-1">{t("contact.subject")}</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("contact.subject")}
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
            </div>

            <div className="mb-6">
              <label className="text-[13px] text-[var(--muted)] block mb-1">{t("contact.message")}</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("contact.message")} rows={5}
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)] resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={!isValid || loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors">
              {loading ? "..." : t("contact.send")}
            </button>
          </>
        )}
      </div>
      <div className="h-20" />
    </>
  );
}
