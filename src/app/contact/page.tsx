"use client";

import { useLocale } from "@/context/LocaleContext";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailtoUrl = `mailto:koujiy@souichirou.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
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
        <p className="text-[var(--muted)] text-[15px] mb-6">{t("contact.description")}</p>

        <div className="mb-4">
          <label className="text-[13px] text-[var(--muted)] block mb-1">{t("contact.name")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("contact.name")}
            className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]"
          />
        </div>

        <div className="mb-4">
          <label className="text-[13px] text-[var(--muted)] block mb-1">{t("contact.email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("contact.email")}
            className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]"
          />
        </div>

        <div className="mb-4">
          <label className="text-[13px] text-[var(--muted)] block mb-1">{t("contact.subject")}</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("contact.subject")}
            className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]"
          />
        </div>

        <div className="mb-6">
          <label className="text-[13px] text-[var(--muted)] block mb-1">{t("contact.message")}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("contact.message")}
            rows={5}
            className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)] resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors"
        >
          {t("contact.send")}
        </button>
      </div>

      <div className="h-20" />
    </>
  );
}
